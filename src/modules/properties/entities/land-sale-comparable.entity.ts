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
export class LandSaleComparable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: string;

  @Column()
  propertyName: string;

  @Column({ nullable: true })
  majorTenant: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  squareFeet: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerSF: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  capRate: number;

  @Column({ nullable: true })
  purchaser: string;

  @Column({ nullable: true })
  seller: string;

  @ManyToOne(() => Property, (property) => property.landSaleComparables)
  property: Property;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
