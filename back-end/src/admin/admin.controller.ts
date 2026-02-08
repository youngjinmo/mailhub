import {
  Controller,
  Get,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.enums';

@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private usersService: UsersService,
  ) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboard(@CurrentUser() currentUser: CurrentUserPayload) {
    const user = await this.usersService.findById(currentUser.userId);
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return this.adminService.getDashboardStats();
  }
}
