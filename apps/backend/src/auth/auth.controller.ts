import {
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { CurrentUserId } from '../common/current-user.decorator';
import { AuthedUser } from './github.strategy';

const COOKIE_NAME = 'gtm_token';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin(): void {
    // Passport redirects to GitHub; this handler body is never reached.
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubCallback(
    @Req() req: { user: AuthedUser },
    @Res() res: Response,
  ): void {
    const token = this.authService.issueJwt(req.user.userId, req.user.username);
    // Cross-origin (Vercel frontend ↔ Railway backend) requires sameSite:'none',
    // which browsers only accept alongside secure:true (HTTPS).
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: COOKIE_MAX_AGE,
    });
    res.redirect(`${this.config.get<string>('FRONTEND_URL')}/auth/callback`);
  }

  @Post('cli-token')
  async createCliToken(@CurrentUserId() userId: string): Promise<{ apiKey: string }> {
    return { apiKey: await this.authService.generateCliToken(userId) };
  }

  @Delete('cli-token')
  async revokeCliToken(@CurrentUserId() userId: string): Promise<{ message: string }> {
    await this.authService.revokeCliToken(userId);
    return { message: 'CLI token revoked' };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    // Clear options must match the set options for the cookie to be removed.
    res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'none', secure: true });
    return { message: 'Logged out' };
  }
}
