import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Project } from '../projects/project.entity';

export enum CommitStatus {
  PENDING = 'pending',
  // Popped by the CLI, not yet confirmed executed.
  IN_FLIGHT = 'in_flight',
  EXECUTED = 'executed',
  SKIPPED = 'skipped',
}

@Entity('commit_queue')
export class CommitQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.commitQueue)
  project: Project;

  // UTC timestamp to use for the backdated commit.
  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ type: 'enum', enum: CommitStatus, default: CommitStatus.PENDING })
  status: CommitStatus;

  @Column({ nullable: true })
  commitHash: string;

  @Column({ type: 'timestamptz', nullable: true })
  executedAt: Date;

  // Ordering within the project (0-based).
  @Column({ type: 'int' })
  queueIndex: number;

  @CreateDateColumn()
  createdAt: Date;
}
