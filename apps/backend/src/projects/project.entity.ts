import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { CommitQueue } from '../commit-queue/commit-queue.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum SchedulingMode {
  LINEAR = 'linear',
  RANDOM = 'random',
  SPRINT = 'sprint',
  HUMAN_LIKE = 'human_like',
  TEAM = 'team',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.projects)
  owner: User;

  // e.g. "nihar/my-project"
  @Column()
  repoFullName: string;

  @Column()
  branch: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column()
  totalCommits: number;

  @Column({ type: 'enum', enum: SchedulingMode })
  schedulingMode: SchedulingMode;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  // Mode-specific config (sprint/team/human settings).
  @Column({ type: 'jsonb', nullable: true })
  schedulerConfig: Record<string, unknown>;

  @Column({ default: false })
  workingDaysOnly: boolean;

  @Column('int', { array: true, nullable: true })
  preferredHours: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CommitQueue, (entry) => entry.project)
  commitQueue: CommitQueue[];
}
