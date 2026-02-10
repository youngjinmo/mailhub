import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import {
  OAuthGithubDto,
  OAuthGoogleDto,
  OAuthAppleDto,
} from './dto/oauth-login.dto';
import { UnlinkOAuthDto } from '../users/dto/unlink-oauth.dto';
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
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const { accessToken } = await this.authService.verifyCodeAndLogin(dto);

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: Request): Promise<{ message: string }> {
    const accessToken = request.headers.authorization?.split(' ')[1];
    if (accessToken) {
      await this.authService.logout(accessToken);
    }
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
  async oauthGithub(@Body() dto: OAuthGithubDto): Promise<AuthResponseDto> {
    return this.oauthService.loginWithGithub(dto.code, dto.redirectUri);
  }

  @Public()
  @Post('oauth/google')
  @HttpCode(HttpStatus.OK)
  async oauthGoogle(@Body() dto: OAuthGoogleDto): Promise<AuthResponseDto> {
    return this.oauthService.loginWithGoogle(dto.code, dto.redirectUri);
  }

  @Public()
  @Post('oauth/apple')
  @HttpCode(HttpStatus.OK)
  async oauthApple(@Body() dto: OAuthAppleDto): Promise<AuthResponseDto> {
    return this.oauthService.loginWithApple(dto.idToken);
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
}
