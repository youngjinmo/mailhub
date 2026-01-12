import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';
import { RelayEmail } from '../../relay-emails/entities/relay-email.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: bigint;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_username')
  username: string;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
    name: 'subscription_tier',
  })
  subscriptionTier: SubscriptionTier;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;

  @UpdateDateColumn({ name: 'last_logined_at', type: 'datetime' })
  lastLoginedAt: Date;

  @OneToMany(() => RelayEmail, (relayEmail) => relayEmail.user)
  relayEmails: RelayEmail[];
}
