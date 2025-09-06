import Papa from 'papaparse';

export const validateCsvFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push("No file selected");
    return { isValid: false, errors };
  }
  
  if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
    errors.push("File must be a CSV file (.csv)");
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    errors.push("File size must be less than 10MB");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const parseCsvFile = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => {
        return header.toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
          .trim();
      },
      complete: (results) => {
        resolve(results);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const standardizePatientData = (csvRow, rowIndex) => {
  return {
    // Standard fields mapping
    patient_id: csvRow.patient_id || csvRow.id || `csv_${Date.now()}_${rowIndex}`,
    patient_name: csvRow.patient_name || csvRow.name || `Patient ${rowIndex + 1}`,
    age: parseInt(csvRow.age) || null,
    gender: csvRow.gender || null,
    primary_diagnosis: csvRow.primary_diagnosis || csvRow.diagnosis || null,
    length_of_stay: parseInt(csvRow.length_of_stay) || null,
    num_medications_prescribed: parseInt(csvRow.num_medications_prescribed) || null,
    procedures_count: parseInt(csvRow.procedures_count) || null,
    admission_type: csvRow.admission_type || null,
    discharge_location: csvRow.discharge_location || null,
    
    // Risk factors
    readmitted_30_days: csvRow.readmitted_30_days || csvRow.readmitted || 0,
    
    // Metadata
    row_number: rowIndex + 1,
    source: 'csv_upload',
    created_at: new Date(),
    upload_timestamp: new Date().toISOString(),
    
    // Keep all original fields
    ...csvRow
  };
};
