import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { CurrentUserId } from '../common/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { CliOrJwtAuthGuard } from '../auth/guards/cli-auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(userId, dto);
  }

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.projectsService.list(userId);
  }

  // Accepts CLI Bearer key OR dashboard JWT cookie — `timeline status` reads
  // project detail (queue stats) over the CLI key.
  @Public()
  @UseGuards(CliOrJwtAuthGuard)
  @Get(':id')
  detail(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.projectsService.detail(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.projectsService.remove(userId, id);
  }
}
