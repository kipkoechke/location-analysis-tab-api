// @ts-ignore
import { Injectable } from '@nestjs/common';
import { PDFExtract } from 'pdf.js-extract';

@Injectable()
export class PdfExtractorService {
  private pdfExtract = new PDFExtract();

  /**
   * Extract sales comparables and related data from a PDF file
   * @param filePath - Path to the PDF file
   * @returns Structured data including sales comparables, demographics, proximity, supply pipeline, and zoning data
   */
  async extractSalesComparables(filePath: string): Promise<any> {
    try {
      const data = await this.pdfExtract.extract(filePath, {});
      const salesComparables = this.processSalesComparables(data);
      const demographicsData = this.extractDemographicsData(data);
      const proximityData = this.extractProximityData(data);
      const supplyPipelineData = this.extractSupplyPipelineData(data);
      const zoningData = this.extractZoningData(data);

      return {
        salesComparables,
        demographicsData,
        proximityData,
        supplyPipelineData,
        zoningData,
      };
    } catch (error) {
      throw new Error(`Failed to extract PDF data: ${error.message}`);
    }
  }

  /**
   * Process extracted content for sale comparable into structured data
   */
  private processSalesComparables(data: any): any[] {
    const salesComparables = [];
    const columns = [
      'date',
      'propertyName',
      'majorTenant',
      'boroughMarket',
      'sf',
      'pp',
      'ppsf',
      'capRate',
      'purchaser',
      'seller',
    ];

    for (const page of data.pages) {
      const rows = this.groupContentByRows(page.content);

      let i = 0;
      while (i < rows.length) {
        if (rows[i].length < 5 || !this.isDataRow(rows[i])) {
          i++;
          continue;
        }

        try {
          let continuationRow = null;
          if (
            i + 1 < rows.length &&
            !this.isDataRow(rows[i + 1]) &&
            rows[i + 1].length > 0
          ) {
            continuationRow = rows[i + 1];
          }

          const rowData = this.extractDataFromRow(
            rows[i],
            columns,
            continuationRow,
          );
          if (rowData) {
            salesComparables.push(rowData);
          }

          i += continuationRow ? 2 : 1;
        } catch (error) {
          console.error('Error processing row:', error);
          i++;
        }
      }
    }

    salesComparables.forEach((item) => {
      if ((!item.ppsf || item.ppsf === 0) && item.pp > 0 && item.sf > 0) {
        item.ppsf = Math.round(item.pp / item.sf);
      }
    });

    return salesComparables;
  }

  /**
   * Extract demographics data including population, income, consumer base, and affluence
   */
  private extractDemographicsData(data: any): any {
    const demographicsData = {
      population: {
        brooklyn: 0,
        percentageOfNYC: 0,
      },
      income: {
        averageHouseholdIncome: 0,
        averageAnnualSpending: 0,
      },
      consumerBase: {
        aggregateSpendingPower: 0,
        projectedHouseholds: 0,
      },
      affluence: {
        affluenceRanking: '',
      },
    };

    const allText = this.getAllTextContent(data);
    const brooklynPopulationMatch = allText.match(
      /brooklyn houses over\s*([\d.]+)\s*million residents/i,
    );
    if (brooklynPopulationMatch) {
      demographicsData.population.brooklyn =
        parseFloat(brooklynPopulationMatch[1]) * 1000000;
    }

    const nycPercentageMatch = allText.match(
      /(\d+)%\s*of new york city['']?s total population/i,
    );
    if (nycPercentageMatch) {
      demographicsData.population.percentageOfNYC = parseInt(
        nycPercentageMatch[1],
        10,
      );
    }

    const householdIncomeMatch =
      allText.match(/average household income.*?[\$\s]?([\d,]+)/i) ||
      allText.match(/household income.*?approximately\s*\$?([\d,]+)/i);

    if (householdIncomeMatch) {
      demographicsData.income.averageHouseholdIncome = parseInt(
        householdIncomeMatch[1].replace(/[\$,]/g, ''),
        10,
      );
    }

    const annualSpendingMatch =
      allText.match(/annual household spending.*?[\$\s]?([\d,]+)/i) ||
      allText.match(
        /including over\s*\$?([\d,]+)\s*in average annual household spending/i,
      );

    if (annualSpendingMatch) {
      demographicsData.income.averageAnnualSpending = parseInt(
        annualSpendingMatch[1].replace(/[\$,]/g, ''),
        10,
      );
    }

    const spendingPowerMatch =
      allText.match(/spending power.*?\$?([\d.]+)\s*billion/i) ||
      allText.match(
        /aggregate consumer spending power.*?over\s*\$?([\d.]+)\s*billion/i,
      );

    if (spendingPowerMatch) {
      demographicsData.consumerBase.aggregateSpendingPower =
        parseFloat(spendingPowerMatch[1]) * 1000000000;
    }

    const projectedHouseholdsMatch =
      allText.match(/projected.*?([\d.]+)\s*million households/i) ||
      allText.match(/over\s*([\d.]+)\s*million households projected/i);

    if (projectedHouseholdsMatch) {
      demographicsData.consumerBase.projectedHouseholds =
        parseFloat(projectedHouseholdsMatch[1]) * 1000000;
    }

    const affluenceMatch =
      allText.match(/(\d+) of the (\d+) most affluent zip codes/i) ||
      allText.match(/covers four of the five most affluent zip codes/i);

    if (affluenceMatch) {
      if (affluenceMatch[1] && affluenceMatch[2]) {
        demographicsData.affluence.affluenceRanking = `Serves ${affluenceMatch[1]} of the ${affluenceMatch[2]} most affluent zip codes in Brooklyn`;
      } else {
        demographicsData.affluence.affluenceRanking =
          'Covers 4 of the 5 most affluent zip codes in Brooklyn';
      }
    }

    return demographicsData;
  }

  /**
   * Extract proximity data including distances to key locations and strategic advantages
   */
  private extractProximityData(data: any): any {
    const proximityData = {
      distances: {
        downtownBrooklyn: 0,
        manhattan: 0,
        laguardiaAirport: 0,
        jfkAirport: 0,
        newarkAirport: 0,
        brooklynBatteryTunnel: '',
      },
      adjacentFacilities: [],
      strategicAdvantages: [],
    };

    let allText = '';
    for (const page of data.pages) {
      for (const item of page.content) {
        allText += ' ' + item.str.toLowerCase();
      }
    }

    const distancePage = data.pages.find((page) => {
      const pageText = page.content
        .map((item) => item.str.toLowerCase())
        .join(' ');
      return (
        pageText.includes('downtown brooklyn') &&
        pageText.includes('miles') &&
        pageText.includes('airport')
      );
    });

    if (distancePage) {
      const distanceText = distancePage.content
        .map((item) => item.str.toLowerCase())
        .join(' ');

      if (
        distanceText.includes('downtown brooklyn') &&
        distanceText.includes('4 miles')
      ) {
        proximityData.distances.downtownBrooklyn = 4;
      }

      if (
        distanceText.includes('manhattan') &&
        distanceText.includes('5 miles')
      ) {
        proximityData.distances.manhattan = 5;
      }

      if (
        distanceText.includes('laguardia airport') &&
        distanceText.includes('11 miles')
      ) {
        proximityData.distances.laguardiaAirport = 11;
      }

      if (
        distanceText.includes('jfk airport') &&
        distanceText.includes('20 miles')
      ) {
        proximityData.distances.jfkAirport = 20;
      }

      if (
        distanceText.includes('newark airport') &&
        distanceText.includes('20 miles')
      ) {
        proximityData.distances.newarkAirport = 20;
      }
    }

    if (
      allText.includes('less than five minutes from') ||
      allText.includes('five minutes from the brooklyn battery tunnel')
    ) {
      proximityData.distances.brooklynBatteryTunnel = 'less than 5 minutes';
    }

    if (allText.includes('red hook container terminal')) {
      proximityData.adjacentFacilities.push({
        name: 'Red Hook Container Terminal',
        description:
          'A 65-acre full-service container port with over 2,000 feet of deep water berth',
      });
    }

    const strategicAdvantages = [
      {
        keyword: "ideally located on brooklyn's waterfront",
        advantage:
          "Located on Brooklyn's waterfront in the coveted Red Hook logistics submarket",
      },
      {
        keyword: "minutes from brooklyn's 2.8 million consumers",
        advantage: "Minutes from Brooklyn's 2.8 million consumers",
      },
      {
        keyword: 'downtown manhattan',
        advantage: 'Five minutes from Downtown Manhattan',
      },
      {
        keyword: 'crucial northeast truck thoroughfares',
        advantage: 'Access to crucial Northeast truck thoroughfares',
      },
    ];

    strategicAdvantages.forEach((item) => {
      if (allText.includes(item.keyword)) {
        proximityData.strategicAdvantages.push(item.advantage);
      }
    });

    return proximityData;
  }

  /**
   * Extract supply pipeline data including nearby developments,
   * construction timelines, and property type mix
   */
  private extractSupplyPipelineData(data: any): any {
    const supplyPipelineData = {
      nearbyDevelopments: [],
      constructionTimelines: [],
      propertyTypeMix: {
        industrial: '',
        residential: '',
        commercial: 0,
        mixed: '',
      },
      marketTrends: {
        vacancyRate: 0,
        averageTakingRents: 0,
        absorptionData: '',
        leaseVolume: '',
      },
      supplyConstraints: [],
    };

    const allText = this.getAllTextContent(data);

    const vacancyRateMatch = allText.match(
      /brooklyn submarket.*?approximately (\d+)% vacancy/i,
    );
    if (vacancyRateMatch) {
      supplyPipelineData.marketTrends.vacancyRate = parseInt(
        vacancyRateMatch[1],
        10,
      );
    }

    const takingRentsMatch = allText.match(
      /borough average taking rents continue to exceed \$(\d+) PSF/i,
    );
    if (takingRentsMatch) {
      supplyPipelineData.marketTrends.averageTakingRents = parseInt(
        takingRentsMatch[1],
        10,
      );
    }

    const absorptionMatch = allText.match(
      /posted year-to-date net absorption of ([\d,]+) SF/i,
    );
    if (absorptionMatch) {
      supplyPipelineData.marketTrends.absorptionData =
        absorptionMatch[1] + ' SF year-to-date net absorption';
    }

    const leaseVolumeMatch = allText.match(
      /over ([\d,]+) SF of Q\d+ \d{4} leasing volume in the Boroughs/i,
    );
    if (leaseVolumeMatch) {
      supplyPipelineData.marketTrends.leaseVolume =
        leaseVolumeMatch[1] + ' SF quarterly leasing volume';
    }

    const supplyConstraintPatterns = [
      {
        pattern:
          /Amazon last-mile use is exclusively permitted in ([A-Z\d]+) zones/i,
        result:
          'Amazon last-mile use exclusively permitted in specific zoning (M or C9 zones)',
      },
      {
        pattern:
          /Brooklyn's logistics inventory has declined by more than (\d+) MSF over the past decade/i,
        result:
          'Declining logistics inventory due to commercial/residential conversions',
      },
      {
        pattern:
          /Residential developers' willing to pay (\dX) premium for land sites/i,
        result: 'Residential developers paying premium (3X) for land sites',
      },
      {
        pattern:
          /New industrial permit, introduced in May 2024, mandates last-mile facilities/i,
        result:
          'New industrial permit requirements for last-mile facilities (introduced May 2024)',
      },
      {
        pattern:
          /Uncertainty of approval will discourage speculative industrial development/i,
        result:
          'Approval uncertainty discouraging speculative industrial development',
      },
    ];

    supplyConstraintPatterns.forEach((item) => {
      if (allText.match(item.pattern)) {
        supplyPipelineData.supplyConstraints.push(item.result);
      }
    });

    if (allText.includes('red hook container terminal')) {
      supplyPipelineData.nearbyDevelopments.push({
        name: 'Red Hook Container Terminal',
        type: 'Industrial/Logistics',
        status: 'Operational',
        details:
          'A 65-acre full-service container port with over 2,000 feet of deep water berth',
      });
    }

    if (
      allText.includes(
        "brooklyn's logistics inventory has declined by more than 6 msf",
      )
    ) {
      supplyPipelineData.propertyTypeMix.industrial =
        'Declining (lost 6+ MSF over past decade)';
      supplyPipelineData.propertyTypeMix.residential =
        'Increasing (converting former industrial sites)';
    }

    return supplyPipelineData;
  }

  /**
   * Extract zoning overlay data including zoning codes and municipal references
   */
  private extractZoningData(data: any): any {
    const zoningData = {
      zoningCode: '',
      allowedUses: [],
      restrictions: [],
      recentChanges: [],
      municipalReferences: [],
    };

    const allText = this.getAllTextContent(data);

    const zoningCodeMatch = allText.match(
      /amazon last-mile use is exclusively permitted in ([A-Z\d]+) zones/i,
    );
    if (zoningCodeMatch) {
      zoningData.zoningCode = zoningCodeMatch[1];
      zoningData.allowedUses.push('Amazon last-mile distribution facilities');
    }

    const recentZoningChanges = [
      {
        pattern: /new industrial permit, introduced in May 2024/i,
        change: 'New industrial permit requirements introduced in May 2024',
      },
      {
        pattern: /mandates last-mile facilities to apply for a special permit/i,
        change: 'Special permit required for last-mile facilities',
      },
    ];

    recentZoningChanges.forEach((item) => {
      if (allText.match(item.pattern)) {
        zoningData.recentChanges.push(item.change);
      }
    });

    if (allText.includes('special permit from the city planning commission')) {
      zoningData.restrictions.push(
        'Last-mile facilities require special permit from City Planning Commission',
      );
    }

    zoningData.municipalReferences = [
      {
        name: 'NYC Department of City Planning',
        url: 'https://www.nyc.gov/site/planning/zoning/zoning-overview.page',
      },
      {
        name: 'NYC Zoning & Land Use Map (ZoLa)',
        url: 'https://zola.planning.nyc.gov/',
      },
      {
        name: 'Brooklyn Community Board 6 (Red Hook)',
        url: 'https://www1.nyc.gov/site/brooklyncb6/index.page',
      },
    ];

    return zoningData;
  }

  private getAllTextContent(data: any): string {
    let allText = '';
    for (const page of data.pages) {
      const pageText = page.content
        .map((item) => item.str.toLowerCase())
        .join(' ');
      allText += ' ' + pageText;
    }
    return allText;
  }

  private groupContentByRows(content: any[]): any[][] {
    const sortedContent = [...content].sort((a, b) => a.y - b.y);

    const rows: any[][] = [];
    let currentRowY = -1;
    let currentRow: any[] = [];
    const yThreshold = 5;

    for (const item of sortedContent) {
      if (item.str.trim() === '') continue;

      if (currentRowY === -1 || Math.abs(item.y - currentRowY) > yThreshold) {
        if (currentRow.length > 0) {
          currentRow.sort((a, b) => a.x - b.x);
          rows.push(currentRow);
        }
        currentRow = [item];
        currentRowY = item.y;
      } else {
        currentRow.push(item);
      }
    }

    if (currentRow.length > 0) {
      currentRow.sort((a, b) => a.x - b.x);
      rows.push(currentRow);
    }

    return rows;
  }

  private isDataRow(row: any[]): boolean {
    const firstCellText = row[0]?.str.trim();
    return !!firstCellText.match(/^\w{3}-\d{2}$/);
  }

  private extractDataFromRow(
    row: any[],
    columnNames: string[],
    continuationRow?: any[],
  ): any {
    const rowTexts = row.map((item) => item.str.trim());

    const mappedData: Record<string, any> = {};

    const columnPositions: Record<string, number> = {};

    const dateIndex = rowTexts.findIndex((text) => text.match(/^\w{3}-\d{2}$/));
    if (dateIndex !== -1) {
      mappedData['date'] = rowTexts[dateIndex];
      columnPositions['date'] = row[dateIndex].x;
      mappedData['propertyName'] = rowTexts[dateIndex + 1] || '';
      columnPositions['propertyName'] = row[dateIndex + 1]?.x || 0;
      mappedData['majorTenant'] = rowTexts[dateIndex + 2] || '';
      columnPositions['majorTenant'] = row[dateIndex + 2]?.x || 0;
      mappedData['boroughMarket'] = rowTexts[dateIndex + 3] || '';
      columnPositions['boroughMarket'] = row[dateIndex + 3]?.x || 0;
      const sfPattern = /^[\d,]+$/;
      const sfIndex = rowTexts.findIndex(
        (text, i) => i > dateIndex + 3 && sfPattern.test(text),
      );
      if (sfIndex !== -1) {
        mappedData['sf'] = parseInt(rowTexts[sfIndex].replace(/,/g, ''), 10);
        columnPositions['sf'] = row[sfIndex].x;

        const ppPattern = /^[$]?[\d,]+$/;
        const ppIndex = rowTexts.findIndex(
          (text, i) => i > sfIndex && ppPattern.test(text),
        );
        if (ppIndex !== -1) {
          mappedData['pp'] = parseInt(
            rowTexts[ppIndex].replace(/[$,]/g, ''),
            10,
          );
          columnPositions['pp'] = row[ppIndex].x;

          const ppsfPattern = /^\d{2,3}$/;
          const ppsfIndex = rowTexts.findIndex(
            (text, i) => i > ppIndex && ppsfPattern.test(text),
          );
          if (ppsfIndex !== -1) {
            mappedData['ppsf'] = parseInt(rowTexts[ppsfIndex], 10);
            columnPositions['ppsf'] = row[ppsfIndex].x;
          } else {
            if (mappedData['pp'] && mappedData['sf']) {
              mappedData['ppsf'] = Math.round(
                mappedData['pp'] / mappedData['sf'],
              );
            } else {
              mappedData['ppsf'] = 0;
            }
          }

          const capRatePattern = /^[\d.]+%?$/;
          const capRateIndex = rowTexts.findIndex((text, i) => {
            if (i > (ppsfIndex !== -1 ? ppsfIndex : ppIndex)) {
              const num = parseFloat(text.replace('%', ''));
              return capRatePattern.test(text) && num < 10;
            }
            return false;
          });

          if (capRateIndex !== -1) {
            mappedData['capRate'] = parseFloat(
              rowTexts[capRateIndex].replace('%', ''),
            );
            columnPositions['capRate'] = row[capRateIndex].x;
            mappedData['purchaser'] = rowTexts[capRateIndex + 1] || '';
            columnPositions['purchaser'] = row[capRateIndex + 1]?.x || 0;
            mappedData['seller'] = rowTexts.slice(capRateIndex + 2).join(', ');
            if (row[capRateIndex + 2]) {
              columnPositions['seller'] = row[capRateIndex + 2].x;
            }
          }
        }
      }
    }

    if (continuationRow && continuationRow.length > 0) {
      const xThreshold = 10;

      const usedContinuationItems = new Array(continuationRow.length).fill(
        false,
      );

      for (const column of columnNames) {
        if (['date', 'sf', 'pp', 'ppsf', 'capRate'].includes(column)) continue;

        if (columnPositions[column]) {
          for (let i = 0; i < continuationRow.length; i++) {
            if (usedContinuationItems[i]) continue;

            const item = continuationRow[i];
            if (Math.abs(item.x - columnPositions[column]) < xThreshold) {
              if (mappedData[column]) {
                mappedData[column] += ' ' + item.str.trim();
              } else {
                mappedData[column] = item.str.trim();
              }
              usedContinuationItems[i] = true;
            }
          }
        }
      }

      const unusedItems = continuationRow.filter(
        (_, i) => !usedContinuationItems[i],
      );
      if (unusedItems.length > 0) {
        unusedItems.sort((a, b) => a.x - b.x);

        for (const item of unusedItems) {
          let closestColumn = 'notes';
          let minDistance = Infinity;

          for (const [column, position] of Object.entries(columnPositions)) {
            const distance = Math.abs(item.x - position);
            if (distance < minDistance) {
              minDistance = distance;
              closestColumn = column;
            }
          }

          if (minDistance > xThreshold * 2) {
            closestColumn = 'notes';
          }

          if (closestColumn === 'notes') {
            mappedData['notes'] = mappedData['notes']
              ? mappedData['notes'] + ' ' + item.str.trim()
              : item.str.trim();
          } else if (!['sf', 'pp', 'ppsf', 'capRate'].includes(closestColumn)) {
            mappedData[closestColumn] = mappedData[closestColumn]
              ? mappedData[closestColumn] + ' ' + item.str.trim()
              : item.str.trim();
          }
        }
      }
    }

    columnNames.forEach((column) => {
      if (!mappedData[column]) {
        if (['sf', 'pp', 'ppsf'].includes(column)) {
          mappedData[column] = 0;
        } else if (column === 'capRate') {
          mappedData[column] = 0;
        } else {
          mappedData[column] = '';
        }
      }
    });

    if (
      mappedData['ppsf'] === 0 &&
      mappedData['pp'] > 0 &&
      mappedData['sf'] > 0
    ) {
      mappedData['ppsf'] = Math.round(mappedData['pp'] / mappedData['sf']);
    }

    return mappedData;
  }
}
