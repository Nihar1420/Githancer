import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SchedulingMode } from '../project.entity';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  repoFullName: string;

  @IsString()
  @IsNotEmpty()
  branch: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(1)
  totalCommits: number;

  @IsEnum(SchedulingMode)
  schedulingMode: SchedulingMode;

  @IsOptional()
  @IsBoolean()
  workingDaysOnly?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  preferredHours?: number[];

  @IsOptional()
  @IsObject()
  schedulerConfig?: Record<string, unknown>;
}
