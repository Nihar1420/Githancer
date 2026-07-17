import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Initial schema: users, projects, commit_queue, cli_sessions.
 *
 * Hand-authored (no Postgres available at generation time). Column names use
 * the TypeORM default naming strategy (camelCase) to match the entities.
 * Regenerate against a live database if the entities drift.
 */
export class InitialSchema1752800000000 implements MigrationInterface {
  name = 'InitialSchema1752800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'githubId', type: 'varchar', isUnique: true },
          { name: 'username', type: 'varchar' },
          { name: 'avatarUrl', type: 'varchar' },
          { name: 'accessTokenEncrypted', type: 'varchar' },
          { name: 'cliApiKeyHash', type: 'varchar', isNullable: true },
          { name: 'timezone', type: 'varchar', default: "'UTC'" },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'projects',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'ownerId', type: 'uuid', isNullable: true },
          { name: 'repoFullName', type: 'varchar' },
          { name: 'branch', type: 'varchar' },
          { name: 'startDate', type: 'date' },
          { name: 'endDate', type: 'date' },
          { name: 'totalCommits', type: 'integer' },
          {
            name: 'schedulingMode',
            type: 'enum',
            enum: ['linear', 'random', 'sprint', 'human_like', 'team'],
            enumName: 'scheduling_mode_enum',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'paused', 'completed'],
            enumName: 'project_status_enum',
            default: "'active'",
          },
          { name: 'schedulerConfig', type: 'jsonb', isNullable: true },
          { name: 'workingDaysOnly', type: 'boolean', default: false },
          { name: 'preferredHours', type: 'integer', isArray: true, isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
        foreignKeys: [
          {
            columnNames: ['ownerId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'commit_queue',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'projectId', type: 'uuid', isNullable: true },
          { name: 'scheduledAt', type: 'timestamp with time zone' },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'in_flight', 'executed', 'skipped'],
            enumName: 'commit_status_enum',
            default: "'pending'",
          },
          { name: 'commitHash', type: 'varchar', isNullable: true },
          { name: 'executedAt', type: 'timestamp with time zone', isNullable: true },
          { name: 'queueIndex', type: 'integer' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
        foreignKeys: [
          {
            columnNames: ['projectId'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'cli_sessions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'uuid', isNullable: true },
          { name: 'currentProjectId', type: 'uuid', isNullable: true },
          { name: 'machineId', type: 'varchar' },
          { name: 'lastSyncAt', type: 'timestamp with time zone', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['currentProjectId'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cli_sessions', true);
    await queryRunner.dropTable('commit_queue', true);
    await queryRunner.dropTable('projects', true);
    await queryRunner.dropTable('users', true);
  }
}
