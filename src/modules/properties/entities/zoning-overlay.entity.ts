import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Property } from './property.entity';

@Entity()
export class ZoningOverlay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  zoneType: string; // 'zoning code' or 'municipal reference'

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  allowed: boolean;

  @Column({ nullable: true })
  referenceUrl: string;

  @ManyToOne(() => Property, (property) => property.zoningOverlays)
  property: Property;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
