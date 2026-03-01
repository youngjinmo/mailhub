import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import { CustomEnvService } from '../config/custom-env.service';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import {
  OAuthGithubDto,
  OAuthGoogleDto,
  OAuthAppleDto,
} from './dto/oauth-login.dto';
import { UnlinkOAuthDto } from '../users/dto/unlink-oauth.dto';
import { REFRESH_TOKEN_EXPIRATION } from './auth.policy';
import { Public } from '../common/decorators/public.decorator';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private oauthService: OAuthService,
    private customEnvService: CustomEnvService,
  ) {}

  @Public()
  @Post('send-verification-code')
  @HttpCode(HttpStatus.OK)
  async sendVerificationCode(
    @Body() dto: SendVerificationCodeDto,
  ): Promise<{ message: string; isNewUser: boolean }> {
    const { isNewUser } = await this.authService.sendVerificationCode(
      dto.encryptedUsername,
    );
    return { message: 'Verification code sent successfully', isNewUser };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Pick<AuthResponseDto, 'accessToken'>> {
    const ip = request.ip || request.socket.remoteAddress || '';
    const userAgent = request.headers['user-agent'] || '';

    const { accessToken, refreshToken } =
      await this.authService.verifyCodeAndLogin(dto, ip, userAgent);

    this.setRefreshTokenCookie(response, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.CREATED)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Pick<AuthResponseDto, 'accessToken'>> {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const ip = request.ip || request.socket.remoteAddress || '';
    const userAgent = request.headers['user-agent'] || '';

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(refreshToken, ip, userAgent);

    this.setRefreshTokenCookie(response, newRefreshToken);
    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const refreshToken = request.cookies?.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    this.clearRefreshTokenCookie(response);
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Get('oauth/github/url')
  @HttpCode(HttpStatus.OK)
  getGithubAuthUrl(@Query('redirectUri') redirectUri: string): { url: string } {
    return this.oauthService.getGithubAuthUrl(redirectUri);
  }

  @Public()
  @Get('oauth/google/url')
  @HttpCode(HttpStatus.OK)
  getGoogleAuthUrl(@Query('redirectUri') redirectUri: string): { url: string } {
    return this.oauthService.getGoogleAuthUrl(redirectUri);
  }

  @Public()
  @Post('oauth/github')
  @HttpCode(HttpStatus.OK)
  async oauthGithub(
    @Body() dto: OAuthGithubDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Pick<AuthResponseDto, 'accessToken'>> {
    const ip = request.ip || request.socket.remoteAddress || '';
    const userAgent = request.headers['user-agent'] || '';

    const { accessToken, refreshToken } =
      await this.oauthService.loginWithGithub(
        dto.code,
        dto.redirectUri,
        ip,
        userAgent,
      );

    this.setRefreshTokenCookie(response, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('oauth/google')
  @HttpCode(HttpStatus.OK)
  async oauthGoogle(
    @Body() dto: OAuthGoogleDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Pick<AuthResponseDto, 'accessToken'>> {
    const ip = request.ip || request.socket.remoteAddress || '';
    const userAgent = request.headers['user-agent'] || '';

    const { accessToken, refreshToken } =
      await this.oauthService.loginWithGoogle(
        dto.code,
        dto.redirectUri,
        ip,
        userAgent,
      );

    this.setRefreshTokenCookie(response, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('oauth/apple')
  @HttpCode(HttpStatus.OK)
  async oauthApple(
    @Body() dto: OAuthAppleDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Pick<AuthResponseDto, 'accessToken'>> {
    const ip = request.ip || request.socket.remoteAddress || '';
    const userAgent = request.headers['user-agent'] || '';

    const { accessToken, refreshToken } =
      await this.oauthService.loginWithApple(dto.idToken, ip, userAgent);

    this.setRefreshTokenCookie(response, refreshToken);
    return { accessToken };
  }

  @Post('oauth/unlink')
  @HttpCode(HttpStatus.OK)
  async unlinkOAuth(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UnlinkOAuthDto,
  ): Promise<{ message: string }> {
    await this.oauthService.unlinkOAuth(user.userId, dto.provider);
    return { message: `${dto.provider} OAuth unlinked successfully` };
  }

  private setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
  ): void {
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRATION,
      path: '/',
    });
  }

  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
  }
}
