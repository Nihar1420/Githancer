import { IsArray, IsOptional, IsString } from 'class-validator';

export class SuggestCommitDto {
  @IsString()
  repoFullName: string;

  @IsString()
  branch: string;

  @IsArray()
  @IsString({ each: true })
  recentMessages: string[];

  @IsOptional()
  @IsString()
  projectDescription?: string;
}
