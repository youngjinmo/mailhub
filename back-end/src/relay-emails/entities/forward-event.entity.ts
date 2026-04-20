import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RelayEmail } from './relay-email.entity';

@Entity('forward_events')
export class ForwardEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: bigint;

  @Index('idx_forward_events_relay_email_id')
  @ManyToOne(() => RelayEmail, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'relay_email_id' })
  relayEmail: RelayEmail;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
