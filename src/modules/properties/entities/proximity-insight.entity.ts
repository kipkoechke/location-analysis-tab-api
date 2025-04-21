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
export class ProximityInsight {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  category: string; // 'highway', 'port', 'tenant', 'rail', 'amenity'

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  distance: string;

  @Column({ nullable: true })
  travelTime: string;

  @ManyToOne(() => Property, (property) => property.proximityInsights)
  property: Property;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
