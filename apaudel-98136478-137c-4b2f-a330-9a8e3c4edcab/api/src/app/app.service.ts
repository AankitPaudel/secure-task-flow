import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from './entities/role.entity';
import { Organization } from './entities/organization.entity';
import { User } from './entities/user.entity';
import { Permission } from '@apaudel-98136478-137c-4b2f-a330-9a8e3c4edcab/data';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedDatabase();
  }

  async seedDatabase() {
    // Check if already seeded
    const existingRoles = await this.roleRepository.count();
    if (existingRoles > 0) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database...');

    // Create Roles
    const ownerRole = this.roleRepository.create({
      name: 'Owner',
      permissions: [
        Permission.CREATE,
        Permission.READ,
        Permission.UPDATE,
        Permission.DELETE,
        Permission.MANAGE_USERS,
        Permission.VIEW_AUDIT,
      ],
    });
    await this.roleRepository.save(ownerRole);

    const adminRole = this.roleRepository.create({
      name: 'Admin',
      permissions: [
        Permission.CREATE,
        Permission.READ,
        Permission.UPDATE,
        Permission.DELETE,
        Permission.VIEW_AUDIT,
      ],
    });
    await this.roleRepository.save(adminRole);

    const viewerRole = this.roleRepository.create({
      name: 'Viewer',
      permissions: [Permission.READ],
    });
    await this.roleRepository.save(viewerRole);

    // Create Organizations (2-level hierarchy)
    const parentOrg = this.organizationRepository.create({
      name: 'Acme Corporation',
    });
    await this.organizationRepository.save(parentOrg);

    const childOrg = this.organizationRepository.create({
      name: 'Acme Engineering Division',
      parentOrganizationId: parentOrg.id,
    });
    await this.organizationRepository.save(childOrg);

    // Create Users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const owner = this.userRepository.create({
      email: 'owner@acme.com',
      password: hashedPassword,
      name: 'John Owner',
      roleId: ownerRole.id,
      organizationId: parentOrg.id,
    });
    await this.userRepository.save(owner);

    const admin = this.userRepository.create({
      email: 'admin@acme.com',
      password: hashedPassword,
      name: 'Jane Admin',
      roleId: adminRole.id,
      organizationId: childOrg.id,
    });
    await this.userRepository.save(admin);

    const viewer = this.userRepository.create({
      email: 'viewer@acme.com',
      password: hashedPassword,
      name: 'Bob Viewer',
      roleId: viewerRole.id,
      organizationId: childOrg.id,
    });
    await this.userRepository.save(viewer);

    console.log('Database seeded successfully!');
    console.log('Test users:');
    console.log('  Owner: owner@acme.com / password123');
    console.log('  Admin: admin@acme.com / password123');
    console.log('  Viewer: viewer@acme.com / password123');
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
