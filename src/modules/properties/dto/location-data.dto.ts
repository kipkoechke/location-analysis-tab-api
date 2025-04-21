export class LocationDataResponseDto {
  supplyPipeline: {
    vacancyRate?: number;
    netAbsorption?: string;
    leasingVolume?: string;
    inventoryChanges?: string;
    nearbyDevelopments: any[];
  };

  landSaleComparables: Array<{
    date: string;
    propertyName: string;
    majorTenant: string;
    location: string;
    squareFeet: number;
    price: number;
    pricePerSF: number;
    capRate: number;
    purchaser: string;
    seller: string;
  }>;

  demographicTrends: {
    population: {
      total?: number;
      percentOfNYC?: number;
      projectedHouseholds2028?: number;
    };
    incomeData: {
      averageHouseholdIncome?: number;
      annualHouseholdSpending?: number;
      aggregateSpendingPower?: number;
    };
    workforceComposition: any;
  };

  proximityInsights: {
    highways: Array<{ name: string; distance: string }>;
    ports: Array<{ name: string; description?: string; distance: string }>;
    majorTenants: Array<{
      name: string;
      location: string;
      description?: string;
    }>;
    rail: Array<{ name: string; distance: string }>;
    amenities: Array<{ type: string; name: string; distance: string }>;
  };

  zoningOverlays: {
    zones: Array<{ code: string; description: string; allowed: boolean }>;
    municipalReferences: Array<{
      name: string;
      description: string;
      url: string;
    }>;
  };
}
