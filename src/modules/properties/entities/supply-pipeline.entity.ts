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
export class SupplyPipeline {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  developmentName: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  completionDate: string;

  @Column({ nullable: true })
  propertyType: string;

  @Column({ nullable: true })
  squareFeet: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  vacancyRate: number;

  @Column({ nullable: true })
  netAbsorption: string;

  @Column({ nullable: true })
  leasingVolume: string;

  @Column({ nullable: true })
  inventoryChanges: string;

  @ManyToOne(() => Property, (property) => property.supplyPipelines)
  property: Property;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
