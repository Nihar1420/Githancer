import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateCommitDto {
  @IsOptional()
  @IsString()
  commitHash?: string;

  @IsIn(['executed', 'skipped'])
  status: 'executed' | 'skipped';
}
