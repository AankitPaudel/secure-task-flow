import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditModule } from './audit/audit.module';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Role } from './entities/role.entity';
import { Task } from './entities/task.entity';
import { AuditLog } from './entities/audit-log.entity';
import { RolesGuard } from './guards/roles.guard';
import { OrganizationGuard } from './guards/organization.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, Organization, Role, Task, AuditLog],
      synchronize: true, // Auto-create tables (disable in production)
    }),
    TypeOrmModule.forFeature([User, Organization, Role, Task, AuditLog]),
    AuthModule,
    TasksModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService, RolesGuard, OrganizationGuard, PermissionsGuard],
})
export class AppModule {}
