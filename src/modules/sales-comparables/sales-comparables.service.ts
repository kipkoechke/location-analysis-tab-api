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

      // Process rows with potential multi-line entries
      let i = 0;
      while (i < rows.length) {
        // Skip header rows and empty rows
        if (rows[i].length < 5 || !this.isDataRow(rows[i])) {
          i++;
          continue;
        }

        try {
          // Check if the next row might be a continuation
          let continuationRow = null;
          if (
            i + 1 < rows.length &&
            !this.isDataRow(rows[i + 1]) &&
            rows[i + 1].length > 0
          ) {
            // The next row isn't a data row (doesn't start with a date) and has content
            // It might be a continuation of the current row
            continuationRow = rows[i + 1];
          }

          // Extract and organize data from row, passing the potential continuation row
          const rowData = this.extractDataFromRow(
            rows[i],
            columns,
            continuationRow,
          );
          if (rowData) {
            salesComparables.push(rowData);
          }

          // Skip the continuation row if we used it
          i += continuationRow ? 2 : 1;
        } catch (error) {
          console.error('Error processing row:', error);
          i++;
        }
      }
    }

    // Calculate PPSF for any records where it's missing or zero
    salesComparables.forEach((item) => {
      if ((!item.ppsf || item.ppsf === 0) && item.pp > 0 && item.sf > 0) {
        item.ppsf = Math.round(item.pp / item.sf);
      }
    });

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

  private extractDataFromRow(
    row: any[],
    columnNames: string[],
    continuationRow?: any[],
  ): any {
    // Extract text from row items
    const rowTexts = row.map((item) => item.str.trim());

    // Initialize result object
    const mappedData: Record<string, any> = {};

    // Store column positions for continuation row alignment
    const columnPositions: Record<string, number> = {};

    // Special handling for common patterns in the data
    // First, try to find the date (typically first column)
    const dateIndex = rowTexts.findIndex((text) => text.match(/^\w{3}-\d{2}$/));
    if (dateIndex !== -1) {
      mappedData['date'] = rowTexts[dateIndex];
      columnPositions['date'] = row[dateIndex].x;

      // Property name is typically after date
      mappedData['propertyName'] = rowTexts[dateIndex + 1] || '';
      columnPositions['propertyName'] = row[dateIndex + 1]?.x || 0;

      // Major tenant after property name
      mappedData['majorTenant'] = rowTexts[dateIndex + 2] || '';
      columnPositions['majorTenant'] = row[dateIndex + 2]?.x || 0;

      // Borough/market after major tenant
      mappedData['boroughMarket'] = rowTexts[dateIndex + 3] || '';
      columnPositions['boroughMarket'] = row[dateIndex + 3]?.x || 0;

      // Look for square footage (usually a large number with commas)
      const sfPattern = /^[\d,]+$/;
      const sfIndex = rowTexts.findIndex(
        (text, i) => i > dateIndex + 3 && sfPattern.test(text),
      );
      if (sfIndex !== -1) {
        mappedData['sf'] = parseInt(rowTexts[sfIndex].replace(/,/g, ''), 10);
        columnPositions['sf'] = row[sfIndex].x;

        // Purchase price usually follows SF and contains dollar signs or is a large number
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

          // PPSF is usually a 3-digit number that follows the purchase price
          const ppsfPattern = /^\d{2,3}$/;
          const ppsfIndex = rowTexts.findIndex(
            (text, i) => i > ppIndex && ppsfPattern.test(text),
          );
          if (ppsfIndex !== -1) {
            mappedData['ppsf'] = parseInt(rowTexts[ppsfIndex], 10);
            columnPositions['ppsf'] = row[ppsfIndex].x;
          } else {
            // Calculate PPSF if not found but we have PP and SF
            if (mappedData['pp'] && mappedData['sf']) {
              mappedData['ppsf'] = Math.round(
                mappedData['pp'] / mappedData['sf'],
              );
            } else {
              mappedData['ppsf'] = 0; // Default value
            }
          }

          // Cap rate usually follows PPSF and is a small decimal number, possibly with %
          const capRatePattern = /^[\d.]+%?$/;
          const capRateIndex = rowTexts.findIndex((text, i) => {
            if (i > (ppsfIndex !== -1 ? ppsfIndex : ppIndex)) {
              const num = parseFloat(text.replace('%', ''));
              return capRatePattern.test(text) && num < 10; // Cap rates are typically under 10%
            }
            return false;
          });

          if (capRateIndex !== -1) {
            mappedData['capRate'] = parseFloat(
              rowTexts[capRateIndex].replace('%', ''),
            );
            columnPositions['capRate'] = row[capRateIndex].x;

            // Purchaser typically follows cap rate
            mappedData['purchaser'] = rowTexts[capRateIndex + 1] || '';
            columnPositions['purchaser'] = row[capRateIndex + 1]?.x || 0;

            // Seller is typically the last item
            mappedData['seller'] = rowTexts.slice(capRateIndex + 2).join(', ');
            if (row[capRateIndex + 2]) {
              columnPositions['seller'] = row[capRateIndex + 2].x;
            }
          }
        }
      }
    }

    // Process continuation row if it exists
    if (continuationRow && continuationRow.length > 0) {
      // Define threshold for x-coordinate alignment
      const xThreshold = 10; // Adjust based on PDF layout

      // Array to track which continuation row items have been used
      const usedContinuationItems = new Array(continuationRow.length).fill(
        false,
      );

      // Check for text continuation for each column
      for (const column of columnNames) {
        // Skip numeric columns that shouldn't have continuation text
        if (['date', 'sf', 'pp', 'ppsf', 'capRate'].includes(column)) continue;

        // Only process columns that have established positions
        if (columnPositions[column]) {
          // Find continuation text that aligns with this column
          for (let i = 0; i < continuationRow.length; i++) {
            if (usedContinuationItems[i]) continue; // Skip already used items

            const item = continuationRow[i];
            if (Math.abs(item.x - columnPositions[column]) < xThreshold) {
              // This continuation item aligns with the current column
              if (mappedData[column]) {
                // Append to existing content
                mappedData[column] += ' ' + item.str.trim();
              } else {
                // Set new content
                mappedData[column] = item.str.trim();
              }
              usedContinuationItems[i] = true;
            }
          }
        }
      }

      // For any remaining continuation items that weren't aligned to specific columns,
      // add them to the 'notes' field or to the closest column
      const unusedItems = continuationRow.filter(
        (_, i) => !usedContinuationItems[i],
      );
      if (unusedItems.length > 0) {
        // Sort by x-position
        unusedItems.sort((a, b) => a.x - b.x);

        // Find the closest column for each unused item
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

          // If distance is too large, put in notes instead
          if (minDistance > xThreshold * 2) {
            closestColumn = 'notes';
          }

          // Add to the appropriate column
          if (closestColumn === 'notes') {
            mappedData['notes'] = mappedData['notes']
              ? mappedData['notes'] + ' ' + item.str.trim()
              : item.str.trim();
          } else if (!['sf', 'pp', 'ppsf', 'capRate'].includes(closestColumn)) {
            // Only append to non-numeric columns
            mappedData[closestColumn] = mappedData[closestColumn]
              ? mappedData[closestColumn] + ' ' + item.str.trim()
              : item.str.trim();
          }
        }
      }
    }

    // Fill in any missing columns with default values
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

    // Ensure PPSF is calculated if we have purchase price and square footage
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
