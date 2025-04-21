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
export class DemographicTrend {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  category: string; // 'population', 'income', 'workforce'

  @Column({ nullable: true })
  metricName: string;

  @Column({ nullable: true })
  metricValue: string;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  radius: string;

  @ManyToOne(() => Property, (property) => property.demographicTrends)
  property: Property;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
