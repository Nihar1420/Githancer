import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SchedulingMode } from '../project.entity';

export class UpdateProjectDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  totalCommits?: number;

  @IsOptional()
  @IsEnum(SchedulingMode)
  schedulingMode?: SchedulingMode;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsBoolean()
  workingDaysOnly?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  preferredHours?: number[];
}
