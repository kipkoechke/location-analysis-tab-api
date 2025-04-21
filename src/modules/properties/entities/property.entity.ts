import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DemographicTrend } from './demographic-trend.entity';
import { LandSaleComparable } from './land-sale-comparable.entity';
import { ProximityInsight } from './proximity-insight.entity';
import { SupplyPipeline } from './supply-pipeline.entity';
import { ZoningOverlay } from './zoning-overlay.entity';

@Entity()
export class Property {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  squareFeet: number;

  @Column({ nullable: true })
  omFileUrl: string;

  @OneToMany(() => LandSaleComparable, (comparable) => comparable.property)
  landSaleComparables: LandSaleComparable[];

  @OneToMany(() => SupplyPipeline, (supplyPipeline) => supplyPipeline.property)
  supplyPipelines: SupplyPipeline[];

  @OneToMany(
    () => ProximityInsight,
    (proximityInsight) => proximityInsight.property,
  )
  proximityInsights: ProximityInsight[];

  @OneToMany(() => ZoningOverlay, (zoningOverlay) => zoningOverlay.property)
  zoningOverlays: ZoningOverlay[];

  @OneToMany(
    () => DemographicTrend,
    (demographicTrend) => demographicTrend.property,
  )
  demographicTrends: DemographicTrend[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
