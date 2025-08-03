/**
 * Convert an array of objects to CSV format
 * @param {Array<Object>} data - Array of objects to convert
 * @param {Array<string>} headers - Array of header names
 * @param {Object} fieldMap - Mapping of header names to object field paths
 * @returns {string} CSV formatted string
 */
export function convertToCSV(data, headers, fieldMap) {
  // Create CSV header row
  let csv = headers.join(',') + '\n';

  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      const field = fieldMap[header];
      let value = field.split('.').reduce((obj, key) => obj?.[key], item);
      
      // Handle null/undefined values
      if (value === null || value === undefined) {
        value = '';
      }
      
      // Format dates
      if (value instanceof Date) {
        value = value.toISOString();
      }
      
      // Handle numbers
      if (typeof value === 'number') {
        return value.toString();
      }
      
      // Escape strings containing commas or quotes
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }
      
      // Handle objects/arrays
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
    
    csv += row + '\n';
  });

  return csv;
}

/**
 * Format a date as YYYY-MM-DD
 * @param {Date} date 
 * @returns {string}
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Format a currency amount
 * @param {number} amount 
 * @returns {string}
 */
export function formatCurrency(amount) {
  return amount.toFixed(2);
} 