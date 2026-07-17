import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateTimezoneDto } from './dtos/update-timezone.dto';
import { CurrentUserId } from '../common/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUserId() userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  updateMe(@CurrentUserId() userId: string, @Body() dto: UpdateTimezoneDto) {
    return this.usersService.updateTimezone(userId, dto.timezone);
  }
}
