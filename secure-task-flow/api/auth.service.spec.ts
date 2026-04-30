import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './src/app/auth/auth.service';
import { User } from './src/app/entities/user.entity';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserRole } from '@secure-task-flow/data';

jest.mock('bcrypt', () => ({
  hash: jest.fn(async (value: string) => `hashed-${value}`),
  compare: jest.fn(async (value: string, hash: string) => hash === `hashed-${value}`),
}));

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

function createUserRepositoryMock(): MockRepo<User> {
  return {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: MockRepo<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    userRepository = createUserRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({ id: 1, email: 'test@example.com' });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          roleId: 1,
          organizationId: 1,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should create and return new user without password', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockImplementation((dto) => ({ id: 1, ...dto }));
      (userRepository.save as jest.Mock).mockImplementation(async (user) => user);

      const result = await service.register({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        roleId: 1,
        organizationId: 1,
      });

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          name: 'New User',
          roleId: 1,
          organizationId: 1,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          email: 'new@example.com',
          name: 'New User',
        }),
      );
      // password should not be returned
      expect((result as any).password).toBeUndefined();
    });
  });

  describe('login', () => {
    const baseUser: Partial<User> = {
      id: 1,
      email: 'owner@acme.com',
      name: 'John Owner',
      roleId: 1,
      organizationId: 1,
      role: { id: 1, name: UserRole.OWNER, permissions: [] } as any,
      organization: { id: 1, name: 'Acme' } as any,
    };

    it('should throw UnauthorizedException if user not found', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({
          email: 'missing@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        ...baseUser,
        password: 'hashed-otherpassword',
      });

      await expect(
        service.login({
          email: 'owner@acme.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return access_token and user info on successful login', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        ...baseUser,
        password: 'hashed-password123',
      });

      const result = await service.login({
        email: 'owner@acme.com',
        password: 'password123',
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 1,
          email: 'owner@acme.com',
          roleId: 1,
          organizationId: 1,
        }),
      );

      expect(result).toEqual({
        access_token: 'test-jwt-token',
        user: {
          id: 1,
          email: 'owner@acme.com',
          name: 'John Owner',
          role: UserRole.OWNER,
          organizationId: 1,
        },
      });
    });
  });
});

