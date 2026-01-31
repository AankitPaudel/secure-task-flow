import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UserRole,
  Permission,
} from '@apaudel-98136478-137c-4b2f-a330-9a8e3c4edcab/data';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { OrganizationGuard } from '../guards/organization.guard';
import { Roles } from '../guards/roles.decorator';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard, OrganizationGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Permissions(Permission.CREATE)
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.READ)
  findAll(@Request() req) {
    return this.tasksService.findAll(req.user);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard, OrganizationGuard)
  @Permissions(Permission.READ)
  findOne(@Param('id') id: string, @Request() req) {
    return this.tasksService.findOne(+id, req.user);
  }

  @Put(':id')
  @UseGuards(RolesGuard, PermissionsGuard, OrganizationGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Permissions(Permission.UPDATE)
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    return this.tasksService.update(+id, updateTaskDto, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard, OrganizationGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Permissions(Permission.DELETE)
  remove(@Param('id') id: string, @Request() req) {
    return this.tasksService.remove(+id, req.user);
  }
}
