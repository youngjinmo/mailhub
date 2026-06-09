import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RelayEmail } from '../../relay-emails/entities/relay-email.entity';

@Entity('email_forwarding_logs')
export class EmailForwardingLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: bigint;

  @Column({ type: 'bigint', name: 'user_id' })
  @Index('idx_user_id')
  userId: bigint;

  @Column({ type: 'bigint', name: 'relay_email_id' })
  @Index('idx_relay_email_id')
  relayEmailId: bigint;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'original_sender_hash',
  })
  originalSenderHash: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => RelayEmail, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'relay_email_id' })
  relayEmail: RelayEmail;
}
