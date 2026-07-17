import { IsArray, IsString } from 'class-validator';

export class ReorderQueueDto {
  @IsArray()
  @IsString({ each: true })
  order: string[];
}
