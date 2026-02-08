import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RelayEmail } from '../relay-emails/entities/relay-email.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RelayEmail)
    private relayEmailRepository: Repository<RelayEmail>,
  ) {}

  async getDashboardStats() {
    const now = new Date();
    const days28Ago = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      usersLast28Days,
      usersLast7Days,
      totalRelayEmails,
      relayEmailsLast28Days,
      relayEmailsLast7Days,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({
        where: { createdAt: MoreThanOrEqual(days28Ago) },
      }),
      this.userRepository.count({
        where: { createdAt: MoreThanOrEqual(days7Ago) },
      }),
      this.relayEmailRepository.count(),
      this.relayEmailRepository.count({
        where: { createdAt: MoreThanOrEqual(days28Ago) },
      }),
      this.relayEmailRepository.count({
        where: { createdAt: MoreThanOrEqual(days7Ago) },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        last28Days: usersLast28Days,
        last7Days: usersLast7Days,
      },
      relayEmails: {
        total: totalRelayEmails,
        last28Days: relayEmailsLast28Days,
        last7Days: relayEmailsLast7Days,
      },
    };
  }
}
