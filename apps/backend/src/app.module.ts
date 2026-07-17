import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        GITHUB_CLIENT_ID: Joi.string().allow('').optional(),
        GITHUB_CLIENT_SECRET: Joi.string().allow('').optional(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN: Joi.string().default('24h'),
        ENCRYPTION_KEY: Joi.string().length(64).required(),
        ENCRYPTION_IV_LENGTH: Joi.number().default(16),
        FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
        GITHUB_CALLBACK_URL: Joi.string().uri().optional(),
        THROTTLE_TTL: Joi.number().default(60),
        THROTTLE_LIMIT: Joi.number().default(10),
        ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
      }),
    }),
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
