import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RelayEmail } from '../../relay-emails/entities/relay-email.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reply_mappings')
export class ReplyMapping {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: bigint;

  @Column({ type: 'varchar', length: 255, name: 'reply_address' })
  @Index('idx_reply_address')
  replyAddress: string;

  @Column({ type: 'bigint', name: 'relay_email_id' })
  relayEmailId: bigint;

  @Column({ type: 'text', name: 'original_sender_encrypted' })
  originalSenderEncrypted: string;

  @Column({ type: 'char', length: 64, name: 'original_sender_hash' })
  originalSenderHash: string;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: bigint;

  @Column({
    type: 'datetime',
    precision: 6,
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @Column({
    type: 'datetime',
    precision: 6,
    name: 'last_used_at',
    nullable: true,
  })
  lastUsedAt: Date | null;

  @ManyToOne(() => RelayEmail, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'relay_email_id' })
  relayEmail: RelayEmail;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
