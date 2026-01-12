import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { RelayEmailsService } from './relay-emails.service';
import { CreateRelayDto } from './dto/create-relay.dto';
import { FindPrimaryEmailDto } from './dto/find-primary.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('relay-emails')
export class RelayEmailsController {
  constructor(private relayEmailsService: RelayEmailsService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createRelayEmail(
    @CurrentUser() user: { userId: bigint; username: string },
    @Body() dto: CreateRelayDto,
  ) {
    const relayEmail =
      await this.relayEmailsService.generateRelayEmailAddress(
        user.userId,
        dto.primaryEmail,
      );

    return {
      id: relayEmail.id.toString(),
      relayAddress: relayEmail.relayAddress,
      primaryEmail: relayEmail.primaryEmail,
      createdAt: relayEmail.createdAt,
    };
  }

  @Get('find-primary-email')
  @HttpCode(HttpStatus.OK)
  async findPrimaryEmail(
    @CurrentUser() user: { userId: bigint; username: string },
    @Query() dto: FindPrimaryEmailDto,
  ) {
    const relayEmail =
      await this.relayEmailsService.findRelayEmailWithUserId(dto.relayEmail);

    if (!relayEmail) {
      throw new NotFoundException('Relay email not found');
    }

    // Verify ownership
    if (relayEmail.userId !== user.userId) {
      throw new ForbiddenException(
        'You do not have permission to access this relay email',
      );
    }

    return { primaryEmail: relayEmail.primaryEmail };
  }
}
