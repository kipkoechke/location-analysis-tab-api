import { Injectable } from '@nestjs/common';
import { PDFExtract } from 'pdf.js-extract';

@Injectable()
export class PdfExtractorService {
  private pdfExtract = new PDFExtract();

  async extractSalesComparables(filePath: string): Promise<any> {
    try {
      // Extract raw data from PDF
      const data = await this.pdfExtract.extract(filePath, {});

      // Process the extracted content
      const salesComparables = this.processSalesComparables(data);

      return { salesComparables };
    } catch (error) {
      throw new Error(`Failed to extract PDF data: ${error.message}`);
    }
  }

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

    // Process each page
    for (const page of data.pages) {
      // Group content by rows based on y-position
      const rows = this.groupContentByRows(page.content);

      // Process each row
      for (const row of rows) {
        // Skip header rows and empty rows
        if (row.length < 5 || !this.isDataRow(row)) {
          continue;
        }

        try {
          // Extract and organize data from row
          const rowData = this.extractDataFromRow(row, columns);
          if (rowData) {
            salesComparables.push(rowData);
          }
        } catch (error) {
          console.error('Error processing row:', error);
        }
      }
    }

    return salesComparables;
  }

  private groupContentByRows(content: any[]): any[][] {
    // Sort content by y-position
    const sortedContent = [...content].sort((a, b) => a.y - b.y);

    const rows: any[][] = [];
    let currentRowY = -1;
    let currentRow: any[] = [];
    const yThreshold = 5; // Adjust based on PDF spacing

    for (const item of sortedContent) {
      if (item.str.trim() === '') continue;

      // Check if we're on a new row
      if (currentRowY === -1 || Math.abs(item.y - currentRowY) > yThreshold) {
        if (currentRow.length > 0) {
          // Sort items in the row by x-position
          currentRow.sort((a, b) => a.x - b.x);
          rows.push(currentRow);
        }
        currentRow = [item];
        currentRowY = item.y;
      } else {
        currentRow.push(item);
      }
    }

    // Add the last row
    if (currentRow.length > 0) {
      currentRow.sort((a, b) => a.x - b.x);
      rows.push(currentRow);
    }

    return rows;
  }

  private isDataRow(row: any[]): boolean {
    // Check if the first cell contains a date format like "Jun-24"
    const firstCellText = row[0]?.str.trim();
    return !!firstCellText.match(/^\w{3}-\d{2}$/);
  }

  private extractDataFromRow(row: any[], columnNames: string[]): any {
    // Extract text from row items
    const rowTexts = row.map((item) => item.str.trim());

    // Combine adjacent cells if necessary to match expected column count
    const mappedData: Record<string, any> = {};
    let currentColIndex = 0;
    let currentTextIndex = 0;

    while (
      currentColIndex < columnNames.length &&
      currentTextIndex < rowTexts.length
    ) {
      const column = columnNames[currentColIndex];
      let value = rowTexts[currentTextIndex];

      // Handle special case for date column
      if (column === 'date' && !value.match(/^\w{3}-\d{2}$/)) {
        currentTextIndex++;
        continue;
      }

      // Try to parse numeric values
      if (['sf', 'pp', 'ppsf', 'capRate'].includes(column)) {
        if (column === 'sf') {
          mappedData[column] = parseInt(value.replace(/,/g, ''), 10) || 0;
        } else if (column === 'pp') {
          // Handle price formatting like $100,500,000
          value = value.replace(/[$,]/g, '');
          mappedData[column] = parseInt(value, 10) || 0;
        } else if (column === 'ppsf') {
          mappedData[column] = parseInt(value, 10) || 0;
        } else if (column === 'capRate') {
          // Handle percentage format
          value = value.replace(/%/g, '');
          mappedData[column] = parseFloat(value) || 0;
        }
      } else {
        mappedData[column] = value;
      }

      currentColIndex++;
      currentTextIndex++;
    }

    // Ensure all required columns are present
    if (Object.keys(mappedData).length < columnNames.length / 2) {
      return null; // Skip rows with too few columns
    }

    return mappedData;
  }
}
