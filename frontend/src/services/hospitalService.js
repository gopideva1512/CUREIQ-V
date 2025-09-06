import { collection, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const hospitalService = {
  // Fetch all hospitals from 'Hospital' collection
  async getHospitals() {
    try {
      const hospitalsCollection = collection(db, 'Hospital');
      const hospitalsSnapshot = await getDocs(hospitalsCollection);
      return hospitalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      throw error;
    }
  },

  // Fetch specific hospital data
  async getHospitalData(hospitalId) {
    try {
      const hospitalDoc = doc(db, 'Hospital', hospitalId);
      const hospitalSnapshot = await getDoc(hospitalDoc);
      
      if (hospitalSnapshot.exists()) {
        return { id: hospitalSnapshot.id, ...hospitalSnapshot.data() };
      }
      throw new Error('Hospital not found');
    } catch (error) {
      console.error('Error fetching hospital data:', error);
      throw error;
    }
  },

  // Fetch hospital CSV data with real-time updates
  async getHospitalCsvData(hospitalId) {
    try {
      console.log(`Fetching CSV data for hospital: ${hospitalId}`);
      const csvCollection = collection(db, 'Hospital', hospitalId, 'csv_data');
      const csvSnapshot = await getDocs(csvCollection);
      
      const csvData = csvSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Fetched ${csvData.length} records for ${hospitalId}`);
      return csvData;
    } catch (error) {
      console.error('Error fetching CSV data:', error);
      throw error;
    }
  },

  // Set up real-time listener for CSV data changes
  listenToCsvData(hospitalId, callback) {
    const csvCollection = collection(db, 'Hospital', hospitalId, 'csv_data');
    
    const unsubscribe = onSnapshot(csvCollection, (snapshot) => {
      const csvData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Real-time update: ${csvData.length} records for ${hospitalId}`);
      callback(csvData);
    }, (error) => {
      console.error('Error in real-time listener:', error);
    });

    return unsubscribe;
  },

  // Comprehensive data processing for dashboard
  processCsvDataForDashboard(csvData) {
    if (!csvData || csvData.length === 0) {
      return {
        totalPatients: 0,
        readmissionRate: 0,
        avgCost: 0,
        diagnosisData: [],
        riskDistribution: [],
        ageDistribution: [],
        genderDistribution: [],
        admissionTypeData: [],
        lengthOfStayData: [],
        timeSeriesData: [],
        monthlyTrends: []
      };
    }

    const totalPatients = csvData.length;
    
    // Enhanced readmission detection
    const readmissions = csvData.filter(patient => {
      const readmitted = patient.readmitted_30_days || patient.readmitted || patient.readmission;
      return readmitted === true || readmitted === 1 || readmitted === '1' || 
             readmitted === 'yes' || readmitted === 'Yes' || readmitted === 'TRUE';
    });
    
    const readmissionRate = (readmissions.length / totalPatients) * 100;

    // Enhanced cost calculation
    const costs = csvData.map(patient => {
      const cost = patient.baseline_cost || patient.cost || patient.treatment_cost || 
                   patient.total_cost || patient.readmission_cost || 0;
      return parseFloat(cost) || 0;
    }).filter(cost => cost > 0);
    
    const avgCost = costs.length > 0 ? costs.reduce((sum, cost) => sum + cost, 0) / costs.length : 0;
    const maxCost = Math.max(...costs, 0);
    const minCost = Math.min(...costs, 0);

    // Diagnosis distribution
    const diagnosisCount = {};
    csvData.forEach(patient => {
      const diagnosis = patient.primary_diagnosis || patient.diagnosis || patient.condition || 'Unknown';
      diagnosisCount[diagnosis] = (diagnosisCount[diagnosis] || 0) + 1;
    });

    const diagnosisData = Object.entries(diagnosisCount)
      .map(([diagnosis, count]) => ({
        diagnosis: diagnosis.length > 20 ? diagnosis.substring(0, 20) + '...' : diagnosis,
        count,
        percentage: ((count / totalPatients) * 100).toFixed(1),
        color: this.getColorForDiagnosis(diagnosis)
      }))
      .sort((a, b) => b.count - a.count);

    // Risk distribution
    const riskCount = { Low: 0, Medium: 0, High: 0 };
    
    csvData.forEach(patient => {
      let risk = patient.risk_level || patient.riskLevel || patient.risk || 'Low';
      
      // Calculate risk based on multiple factors if not explicitly provided
      if (risk === 'Low' || risk === 'low') {
        const age = parseInt(patient.age) || 0;
        const lengthOfStay = parseInt(patient.length_of_stay) || 0;
        const numMedications = parseInt(patient.num_medications_prescribed) || 0;
        const isReadmitted = readmissions.includes(patient);
        
        if (isReadmitted || age > 75 || lengthOfStay > 10 || numMedications > 15) {
          risk = 'High';
        } else if (age > 60 || lengthOfStay > 5 || numMedications > 8) {
          risk = 'Medium';
        }
      }
      
      const normalizedRisk = risk.toString().charAt(0).toUpperCase() + risk.toString().slice(1).toLowerCase();
      
      if (riskCount.hasOwnProperty(normalizedRisk)) {
        riskCount[normalizedRisk] += 1;
      } else {
        riskCount.Low += 1;
      }
    });

    const riskDistribution = Object.entries(riskCount).map(([risk, count]) => ({
      name: `${risk} Risk`,
      value: count,
      percentage: ((count / totalPatients) * 100).toFixed(1),
      color: risk === 'High' ? '#E53E3E' : risk === 'Medium' ? '#D69E2E' : '#38A169'
    }));

    // Age distribution
    const ageGroups = { '18-30': 0, '31-50': 0, '51-65': 0, '66-80': 0, '80+': 0 };
    csvData.forEach(patient => {
      const age = parseInt(patient.age) || 0;
      if (age >= 18 && age <= 30) ageGroups['18-30']++;
      else if (age >= 31 && age <= 50) ageGroups['31-50']++;
      else if (age >= 51 && age <= 65) ageGroups['51-65']++;
      else if (age >= 66 && age <= 80) ageGroups['66-80']++;
      else if (age > 80) ageGroups['80+']++;
    });

    const ageDistribution = Object.entries(ageGroups).map(([ageGroup, count]) => ({
      ageGroup,
      count,
      percentage: ((count / totalPatients) * 100).toFixed(1)
    }));

    // Gender distribution
    const genderCount = {};
    csvData.forEach(patient => {
      const gender = patient.gender || 'Unknown';
      genderCount[gender] = (genderCount[gender] || 0) + 1;
    });

    const genderDistribution = Object.entries(genderCount).map(([gender, count]) => ({
      gender,
      count,
      percentage: ((count / totalPatients) * 100).toFixed(1),
      color: gender === 'Male' ? '#3182CE' : gender === 'Female' ? '#E53E3E' : '#718096'
    }));

    // Admission type distribution
    const admissionCount = {};
    csvData.forEach(patient => {
      const admissionType = patient.admission_type || 'Unknown';
      admissionCount[admissionType] = (admissionCount[admissionType] || 0) + 1;
    });

    const admissionTypeData = Object.entries(admissionCount).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / totalPatients) * 100).toFixed(1)
    }));

    // Length of stay distribution
    const losGroups = { '1-3 days': 0, '4-7 days': 0, '8-14 days': 0, '15+ days': 0 };
    csvData.forEach(patient => {
      const los = parseInt(patient.length_of_stay) || 0;
      if (los >= 1 && los <= 3) losGroups['1-3 days']++;
      else if (los >= 4 && los <= 7) losGroups['4-7 days']++;
      else if (los >= 8 && los <= 14) losGroups['8-14 days']++;
      else if (los > 14) losGroups['15+ days']++;
    });

    const lengthOfStayData = Object.entries(losGroups).map(([duration, count]) => ({
      duration,
      count,
      percentage: ((count / totalPatients) * 100).toFixed(1)
    }));

    // Monthly trends (if date data available)
    const monthlyData = this.generateMonthlyTrends(csvData);

    return {
      totalPatients,
      readmissionRate: readmissionRate.toFixed(1),
      readmissionCount: readmissions.length,
      avgCost: Math.round(avgCost),
      maxCost: Math.round(maxCost),
      minCost: Math.round(minCost),
      diagnosisData,
      riskDistribution,
      ageDistribution,
      genderDistribution,
      admissionTypeData,
      lengthOfStayData,
      monthlyTrends: monthlyData,
      // Additional metrics
      avgAge: this.calculateAvgAge(csvData),
      avgLengthOfStay: this.calculateAvgLOS(csvData),
      avgMedications: this.calculateAvgMedications(csvData),
      icuStayPercentage: this.calculateICUPercentage(csvData)
    };
  },

  calculateAvgAge(csvData) {
    const ages = csvData.map(p => parseInt(p.age) || 0).filter(age => age > 0);
    return ages.length > 0 ? (ages.reduce((sum, age) => sum + age, 0) / ages.length).toFixed(1) : 0;
  },

  calculateAvgLOS(csvData) {
    const los = csvData.map(p => parseInt(p.length_of_stay) || 0).filter(l => l > 0);
    return los.length > 0 ? (los.reduce((sum, l) => sum + l, 0) / los.length).toFixed(1) : 0;
  },

  calculateAvgMedications(csvData) {
    const meds = csvData.map(p => parseInt(p.num_medications_prescribed) || 0).filter(m => m > 0);
    return meds.length > 0 ? (meds.reduce((sum, m) => sum + m, 0) / meds.length).toFixed(1) : 0;
  },

  calculateICUPercentage(csvData) {
    const icuStays = csvData.filter(p => p.icu_stay_flag === 1 || p.icu_stay_flag === true || p.icu_stay_flag === '1');
    return ((icuStays.length / csvData.length) * 100).toFixed(1);
  },

  generateMonthlyTrends(csvData) {
    // Generate sample monthly data for the last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      admissions: Math.floor(Math.random() * 200) + 100,
      readmissions: Math.floor(Math.random() * 30) + 10,
      avgCost: Math.floor(Math.random() * 5000) + 10000
    }));
  },

  getColorForDiagnosis(diagnosis) {
    const colors = {
      'Heart Disease': '#E53E3E',
      'Heart': '#E53E3E',
      'Cardiac': '#E53E3E',
      'Cardiovascular': '#E53E3E',
      'Diabetes': '#DD6B20',
      'Pneumonia': '#4299E1',
      'Respiratory': '#4299E1',
      'Surgery': '#38A169',
      'Surgical': '#38A169',
      'Orthopedic': '#805AD5',
      'Neurological': '#3182CE',
      'Cancer': '#E53E3E',
      'Infection': '#D69E2E',
      'Other': '#718096',
      'Unknown': '#A0AEC0'
    };
    
    const diagnosisLower = diagnosis.toLowerCase();
    for (const [key, color] of Object.entries(colors)) {
      if (diagnosisLower.includes(key.toLowerCase())) {
        return color;
      }
    }
    
    return colors['Unknown'];
  }
};
