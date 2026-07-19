import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GithubStrategy } from './github.strategy';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CliOrJwtAuthGuard } from './guards/cli-auth.guard';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    ProjectsModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
            '24h') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  providers: [AuthService, GithubStrategy, JwtStrategy, JwtAuthGuard, CliOrJwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, CliOrJwtAuthGuard],
})
export class AuthModule {}
