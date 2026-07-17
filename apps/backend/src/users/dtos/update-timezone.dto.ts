import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTimezoneDto {
  @IsString()
  @IsNotEmpty()
  timezone: string;
}
