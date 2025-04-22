const fs = require('fs');
const path = require('path');
const { PDFExtract } = require('pdf.js-extract');

// Initialize PDF extractor
const pdfExtract = new PDFExtract();

// Define the file path - replace with your PDF path
const pdfPath =
  process.argv[2] || 'src/modules/sales-comparables/sales-comparables.pdf';

// Function to process the PDF data
async function extractSalesComparables(filePath) {
  try {
    console.log(`Extracting data from ${filePath}...`);

    // Extract raw data from PDF
    const data = await pdfExtract.extract(filePath, {});

    // Process the data
    const salesComparables = processSalesComparables(data);

    // Output the result
    const outputPath = path.join(
      path.dirname(filePath),
      `${path.basename(filePath, path.extname(filePath))}-output.json`,
    );

    fs.writeFileSync(outputPath, JSON.stringify({ salesComparables }, null, 2));
    console.log(`Extraction complete! Output saved to ${outputPath}`);

    return { salesComparables };
  } catch (error) {
    console.error(`Error extracting PDF data: ${error.message}`);
    throw error;
  }
}

// Process extracted content into structured data
function processSalesComparables(data) {
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
    const rows = groupContentByRows(page.content);

    // Process each row
    for (const row of rows) {
      // Skip header rows and empty rows
      if (row.length < 5 || !isDataRow(row)) {
        continue;
      }

      try {
        // Extract and organize data from row
        const rowData = extractDataFromRow(row, columns);
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

// Group PDF content items into rows based on y-position
function groupContentByRows(content) {
  // Sort content by y-position
  const sortedContent = [...content].sort((a, b) => a.y - b.y);

  const rows = [];
  let currentRowY = -1;
  let currentRow = [];
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

// Check if a row contains data (vs headers)
function isDataRow(row) {
  // Check if the first cell contains a date format like "Jun-24"
  const firstCellText = row[0]?.str.trim();
  return !!firstCellText.match(/^\w{3}-\d{2}$/);
}

// Extract structured data from a row
function extractDataFromRow(row, columnNames) {
  // Extract text from row items
  const rowTexts = row.map((item) => item.str.trim());

  // Debug log
  // console.log('Processing row:', rowTexts.join(' | '));

  // Combine adjacent cells if necessary to match expected column count
  const mappedData = {};
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

// Run the extraction if this script is executed directly
if (require.main === module) {
  if (!pdfPath) {
    console.error('Please provide a path to the PDF file as an argument');
    console.log('Usage: node pdf-extractor.js path/to/your/file.pdf');
    process.exit(1);
  }

  extractSalesComparables(pdfPath)
    .then((result) => {
      console.log(
        `Successfully extracted ${result.salesComparables.length} records`,
      );
    })
    .catch((error) => {
      console.error('Extraction failed:', error);
      process.exit(1);
    });
}

module.exports = { extractSalesComparables };
