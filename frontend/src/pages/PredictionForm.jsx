import React, { useState, useRef } from "react";
import {
  Box,
  Heading,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  HStack,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Select,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  useSteps,
  Badge,
  useToast,
  Container,
  Flex,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  FaUser,
  FaHeartbeat,
  FaLungs,
  FaThermometerHalf,
  FaPills,
  FaStethoscope,
  FaCalendarAlt,
  FaHospital,
  FaVial,
  FaBrain,
  FaWeight,
  FaEye,
  FaArrowRight,
  FaArrowLeft,
  FaBone,
  FaRadiation,
  FaUserMd,
  FaSyringe,
  FaXRay,
  FaFlask,
  FaHandHoldingMedical,
  FaUpload,
  FaFileUpload,
  FaCheck,
  FaSpinner,
  FaDatabase,
  FaFileCsv,
  FaTrash
} from "react-icons/fa";
import Papa from "papaparse";
import RiskResult from "../components/RiskResult";
import axios from "axios";
import { db } from "../firebase";
import { 
  doc, 
  setDoc, 
  updateDoc, 
  increment, 
  collection, 
  writeBatch 
} from "firebase/firestore";
import { useHospital } from "../contexts/HospitalContext";

const MotionCard = motion(Card);
const MotionBox = motion(Box);

// Disease configurations
const diseaseConfigs = {
  "Heart Disease": {
    icon: FaHeartbeat,
    color: "red.500",
    description: "Cardiovascular conditions including heart failure, coronary artery disease, and arrhythmias",
    parameters: [
      { name: "chest_pain_type", label: "Chest Pain Type", type: "select", options: ["None", "Typical Angina", "Atypical Angina", "Non-anginal", "Asymptomatic"], icon: FaHeartbeat },
      { name: "resting_bp", label: "Resting Blood Pressure", type: "number", placeholder: "120", unit: "mmHg", icon: FaThermometerHalf },
      { name: "cholesterol", label: "Serum Cholesterol", type: "number", placeholder: "200", unit: "mg/dl", icon: FaVial },
      { name: "max_heart_rate", label: "Maximum Heart Rate", type: "number", placeholder: "150", unit: "bpm", icon: FaHeartbeat },
      { name: "exercise_angina", label: "Exercise Induced Angina", type: "select", options: ["No", "Yes"], icon: FaStethoscope },
      { name: "st_depression", label: "ST Depression", type: "number", placeholder: "0.0", step: "0.1", icon: FaStethoscope }
    ]
  },
  "Diabetes": {
    icon: FaVial,
    color: "blue.500",
    description: "Diabetes mellitus and related metabolic disorders",
    parameters: [
      { name: "blood_glucose", label: "Blood Glucose Level", type: "number", placeholder: "100", unit: "mg/dl", icon: FaVial },
      { name: "hba1c", label: "HbA1c Level", type: "number", placeholder: "7.0", unit: "%", step: "0.1", icon: FaVial },
      { name: "bmi", label: "Body Mass Index", type: "number", placeholder: "25.0", unit: "kg/m²", step: "0.1", icon: FaWeight },
      { name: "insulin_dependent", label: "Insulin Dependent", type: "select", options: ["No", "Yes"], icon: FaPills },
      { name: "diabetic_complications", label: "Diabetic Complications", type: "select", options: ["None", "Retinopathy", "Nephropathy", "Neuropathy", "Multiple"], icon: FaEye },
      { name: "medication_adherence", label: "Medication Adherence", type: "select", options: ["Poor", "Fair", "Good", "Excellent"], icon: FaPills }
    ]
  },
  "Pneumonia": {
    icon: FaLungs,
    color: "orange.500",
    description: "Respiratory infections and pneumonia-related conditions",
    parameters: [
      { name: "oxygen_saturation", label: "Oxygen Saturation", type: "number", placeholder: "98", unit: "%", icon: FaLungs },
      { name: "respiratory_rate", label: "Respiratory Rate", type: "number", placeholder: "16", unit: "breaths/min", icon: FaLungs },
      { name: "temperature", label: "Body Temperature", type: "number", placeholder: "98.6", unit: "°F", step: "0.1", icon: FaThermometerHalf },
      { name: "white_blood_cells", label: "White Blood Cell Count", type: "number", placeholder: "7000", unit: "cells/μL", icon: FaVial },
      { name: "chest_xray_findings", label: "Chest X-ray Findings", type: "select", options: ["Normal", "Infiltrates", "Consolidation", "Pleural Effusion"], icon: FaXRay },
      { name: "antibiotic_response", label: "Response to Antibiotics", type: "select", options: ["Poor", "Partial", "Good", "Excellent"], icon: FaPills }
    ]
  },
  "Surgery": {
    icon: FaStethoscope,
    color: "purple.500",
    description: "Post-surgical recovery and complications assessment",
    parameters: [
      { name: "surgery_type", label: "Surgery Type", type: "select", options: ["Minor", "Major", "Emergency", "Elective"], icon: FaStethoscope },
      { name: "surgery_duration", label: "Surgery Duration", type: "number", placeholder: "120", unit: "minutes", icon: FaCalendarAlt },
      { name: "anesthesia_type", label: "Anesthesia Type", type: "select", options: ["Local", "Regional", "General"], icon: FaSyringe },
      { name: "complications", label: "Post-operative Complications", type: "select", options: ["None", "Minor", "Moderate", "Major"], icon: FaStethoscope },
      { name: "pain_level", label: "Pain Level (0-10)", type: "number", placeholder: "3", min: "0", max: "10", icon: FaThermometerHalf },
      { name: "wound_healing", label: "Wound Healing", type: "select", options: ["Normal", "Delayed", "Infection", "Dehiscence"], icon: FaStethoscope }
    ]
  }
};

// Common parameters for manual entry
const commonParameters = [
  { name: "patient_name", label: "Patient Name", type: "text", placeholder: "John Doe", icon: FaUser },
  { name: "patient_id", label: "Patient ID (Optional)", type: "text", placeholder: "P001", icon: FaUser },
  { name: "age", label: "Age", type: "number", placeholder: "65", unit: "years", icon: FaUser },
  { name: "gender", label: "Gender", type: "select", options: ["Male", "Female"], icon: FaUser },
  { name: "length_of_stay", label: "Length of Stay", type: "number", placeholder: "5", unit: "days", icon: FaCalendarAlt },
  { name: "num_medications_prescribed", label: "Number of Medications", type: "number", placeholder: "8", icon: FaPills },
  { name: "procedures_count", label: "Number of Procedures", type: "number", placeholder: "2", icon: FaStethoscope },
  { name: "admission_type", label: "Admission Type", type: "select", options: ["Emergency", "Elective", "Urgent"], icon: FaHospital },
  { name: "discharge_location", label: "Discharge Location", type: "select", options: ["Home", "Transfer", "SNF", "Home Health"], icon: FaHospital }
];

const steps = [
  { title: 'Disease Selection', description: 'Select primary condition' },
  { title: 'Patient Information', description: 'Basic patient data' },
  { title: 'Condition Parameters', description: 'Disease-specific data' },
  { title: 'Risk Assessment', description: 'View prediction results' }
];

export default function PredictionForm() {
  // Manual prediction state
  const [selectedDisease, setSelectedDisease] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedPatientId, setSavedPatientId] = useState(null);

  // CSV upload state
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvStats, setCsvStats] = useState({});
  const fileInputRef = useRef(null);

  // UI state
  const [activeTab, setActiveTab] = useState(0);

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const { currentHospital } = useHospital();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Color mode values
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const lightTextColor = useColorModeValue("gray.600", "gray.400");

  // Manual Prediction Functions
  const getValidationSchema = () => {
    const schema = {
      patient_name: Yup.string().required("Patient name is required"),
    };

    commonParameters.forEach(({ name, type }) => {
      if (name === "patient_name" || name === "patient_id") return;
      if (type === "number") {
        schema[name] = Yup.number().required("Required").min(0, "Must be positive");
      } else {
        schema[name] = Yup.string().required("Required");
      }
    });

    if (selectedDisease && diseaseConfigs[selectedDisease]) {
      diseaseConfigs[selectedDisease].parameters.forEach(({ name, type }) => {
        if (type === "number") {
          schema[name] = Yup.number().required("Required");
        } else {
          schema[name] = Yup.string().required("Required");
        }
      });
    }

    return Yup.object(schema);
  };

  const getInitialValues = () => {
    const values = {
      primary_diagnosis: selectedDisease,
      patient_name: "",
      patient_id: ""
    };

    commonParameters.forEach(({ name }) => {
      if (!values[name]) values[name] = "";
    });

    if (selectedDisease && diseaseConfigs[selectedDisease]) {
      diseaseConfigs[selectedDisease].parameters.forEach(({ name }) => {
        values[name] = "";
      });
    }

    return values;
  };

  const generatePatientId = (inputId, hospitalId) => {
    if (inputId && inputId.trim()) {
      return inputId.trim();
    }
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${hospitalId}_${timestamp}_${random}`;
  };

  const calculateRiskLevel = (predictionResult) => {
    const score = predictionResult.score || predictionResult.probability || 0;
    if (score >= 0.7) return "High";
    if (score >= 0.4) return "Medium";
    return "Low";
  };

  const formatPatientDataForFirestore = (formValues, predictionResult, patientId) => {
    const riskLevel = calculateRiskLevel(predictionResult);
    const currentDate = new Date();

    return {
      patient_id: patientId,
      patient_name: formValues.patient_name,
      name: formValues.patient_name,
      age: parseInt(formValues.age) || 0,
      gender: formValues.gender,
      primary_diagnosis: selectedDisease,
      diagnosis: selectedDisease,
      length_of_stay: parseInt(formValues.length_of_stay) || 0,
      admission_type: formValues.admission_type,
      discharge_location: formValues.discharge_location,
      num_medications_prescribed: parseInt(formValues.num_medications_prescribed) || 0,
      procedures_count: parseInt(formValues.procedures_count) || 0,
      risk_level: riskLevel,
      riskLevel: riskLevel,
      readmission_probability: predictionResult.score || 0,
      readmission_risk_score: predictionResult.score || 0,
      prediction_confidence: predictionResult.confidence || "Medium",
      model_version: "ensemble_v1.0",
      disease_specific_params: {},
      created_at: currentDate,
      admission_date: currentDate.toISOString().split('T')[0],
      last_updated: currentDate,
      status: "Active",
      source: "prediction_form",
      all_input_parameters: formValues,
      prediction_result: predictionResult
    };
  };

  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema: getValidationSchema(),
    enableReinitialize: true,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);
      try {
        if (!currentHospital || !currentHospital.id) {
          throw new Error("No hospital selected. Please select a hospital first.");
        }

        console.log("Calling prediction API with values:", values);
        const response = await axios.post("http://localhost:8000/predict", values);
        const predictionResult = response.data;
        console.log("Prediction result:", predictionResult);

        setResult(predictionResult);
        const patientId = generatePatientId(values.patient_id, currentHospital.id);
        setSavedPatientId(patientId);

        const patientData = formatPatientDataForFirestore(values, predictionResult, patientId);

        if (selectedDisease && diseaseConfigs[selectedDisease]) {
          diseaseConfigs[selectedDisease].parameters.forEach(({ name }) => {
            if (values[name] !== undefined) {
              patientData.disease_specific_params[name] = values[name];
              patientData[name] = values[name];
            }
          });
        }

        console.log("Saving patient data to Firestore:", patientData);
        const patientDocRef = doc(db, "Hospital", currentHospital.id, "csv_data", patientId);
        await setDoc(patientDocRef, patientData);

        const hospitalDocRef = doc(db, "Hospital", currentHospital.id);
        await updateDoc(hospitalDocRef, {
          total_records: increment(1),
          last_updated: new Date()
        });

        console.log("Patient data saved successfully");
        toast({
          title: "Patient Data Saved",
          description: `Patient ${values.patient_name} (ID: ${patientId}) has been saved successfully`,
          status: "success",
          duration: 4000,
          isClosable: true,
        });

        setActiveStep(3);
      } catch (error) {
        console.error("Prediction or saving error:", error);
        let errorMessage = "Failed to get prediction or save data. Please try again.";
        if (error.response?.data?.detail) {
          errorMessage = `Prediction API Error: ${error.response.data.detail}`;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        setResult(null);
        toast({
          title: "Error",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    },
  });

  // CSV Processing Functions
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file (.csv)",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setCsvFile(file);
    parseCsvFile(file);
  };

  const parseCsvFile = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        return header.toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
          .trim();
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error("CSV parsing errors:", results.errors);
          toast({
            title: "CSV Parsing Error",
            description: "Some rows could not be parsed correctly",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
        }

        const cleanedData = cleanCsvData(results.data);
        setCsvData(cleanedData);
        setCsvPreview(cleanedData.slice(0, 5));
        generateCsvStats(cleanedData);
        
        toast({
          title: "CSV File Loaded",
          description: `${cleanedData.length} records found`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        toast({
          title: "File Reading Error",
          description: "Failed to read CSV file",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    });
  };

  const cleanCsvData = (rawData) => {
    return rawData.map((row, index) => {
      const cleanRow = {};
      
      Object.keys(row).forEach(key => {
        let value = row[key];
        
        if (value === '' || value === null || value === undefined) {
          value = null;
        }
        
        if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            value = numValue;
          }
        }
        
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase().trim();
          if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
            value = 1;
          } else if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
            value = 0;
          }
        }
        
        cleanRow[key] = value;
      });
      
      cleanRow.row_number = index + 1;
      cleanRow.created_at = new Date();
      cleanRow.source = 'csv_upload';
      cleanRow.upload_timestamp = new Date().toISOString();
      
      return cleanRow;
    });
  };

  const generateCsvStats = (data) => {
    const stats = {
      totalRecords: data.length,
      columnCount: Object.keys(data[0] || {}).length,
      columns: {},
      dataTypes: {}
    };

    if (data.length > 0) {
      Object.keys(data[0]).forEach(column => {
        const values = data.map(row => row[column]).filter(val => val !== null);
        
        stats.columns[column] = {
          nonNullCount: values.length,
          nullCount: data.length - values.length,
          uniqueValues: new Set(values).size
        };

        const sampleValue = values[0];
        if (typeof sampleValue === 'number') {
          stats.dataTypes[column] = 'numeric';
        } else if (typeof sampleValue === 'string') {
          stats.dataTypes[column] = 'text';
        } else {
          stats.dataTypes[column] = 'mixed';
        }
      });
    }

    setCsvStats(stats);
  };

  const uploadCsvToFirestore = async () => {
    if (!csvData.length) {
      toast({
        title: "No Data to Upload",
        description: "Please select and parse a CSV file first",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!currentHospital?.id) {
      toast({
        title: "No Hospital Selected",
        description: "Please select a hospital before uploading",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploadingCsv(true);
    setUploadProgress(0);

    try {
      const csvCollection = collection(db, 'Hospital', currentHospital.id, 'csv_data');
      const chunkSize = 400;
      const chunks = [];
      
      for (let i = 0; i < csvData.length; i += chunkSize) {
        chunks.push(csvData.slice(i, i + chunkSize));
      }

      let uploadedCount = 0;
      
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const currentBatch = writeBatch(db);
        
        chunk.forEach((record) => {
          const docId = record.patient_id || 
                       record.id || 
                       `csv_${Date.now()}_${Math.floor(Math.random() * 1000)}_${uploadedCount}`;
          
          const docRef = doc(csvCollection, docId);
          currentBatch.set(docRef, {
            ...record,
            patient_id: docId,
            hospital_id: currentHospital.id,
            upload_batch: new Date().toISOString(),
            batch_number: chunkIndex + 1
          });
          
          uploadedCount++;
        });

        await currentBatch.commit();
        
        const progress = (uploadedCount / csvData.length) * 100;
        setUploadProgress(progress);
        
        if (chunkIndex < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const hospitalDocRef = doc(db, "Hospital", currentHospital.id);
      await updateDoc(hospitalDocRef, {
        total_records: increment(csvData.length),
        last_csv_upload: new Date(),
        last_updated: new Date()
      });

      toast({
        title: "CSV Upload Successful",
        description: `${uploadedCount} records uploaded to ${currentHospital.name}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setCsvFile(null);
      setCsvData([]);
      setCsvPreview([]);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error("CSV upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload CSV data to Firestore",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploadingCsv(false);
    }
  };

  const clearCsvData = () => {
    setCsvFile(null);
    setCsvData([]);
    setCsvPreview([]);
    setCsvStats({});
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast({
      title: "CSV Data Cleared",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  // Manual prediction helper functions
  const handleDiseaseSelect = (disease) => {
    setSelectedDisease(disease);
    setActiveStep(1);
    setResult(null);
    setError(null);
    setSavedPatientId(null);
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const renderParameterInput = (param) => {
    const { name, label, type, options, placeholder, unit, step, min, max, icon } = param;

    return (
      <FormControl key={name} isInvalid={formik.errors[name] && formik.touched[name]}>
        <FormLabel>
          <HStack>
            <Icon as={icon} color="blue.500" />
            <Text>{label}</Text>
            {unit && <Text fontSize="sm" color="gray.500">({unit})</Text>}
          </HStack>
        </FormLabel>
        {type === "select" ? (
          <Select
            name={name}
            value={formik.values[name]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={`Select ${label}`}
          >
            {options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            name={name}
            type={type}
            placeholder={placeholder}
            value={formik.values[name]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            step={step}
            min={min}
            max={max}
          />
        )}
        <FormErrorMessage>{formik.errors[name]}</FormErrorMessage>
      </FormControl>
    );
  };

  return (
    <Container maxW="7xl" py={8}>
      {/* Header */}
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4}>AI-Powered Risk Assessment</Heading>
          <Text fontSize="lg" color="gray.600">
            Choose between individual patient prediction or bulk CSV upload processing
          </Text>
          {currentHospital && (
            <Badge colorScheme="blue" fontSize="sm" mt={2}>
              📍 {currentHospital.name}
            </Badge>
          )}
        </Box>

        {/* Tabs for switching between modes */}
        <Tabs 
          index={activeTab} 
          onChange={setActiveTab} 
          variant="enclosed" 
          colorScheme="blue"
        >
          <TabList>
            <Tab>
              <HStack>
                <Icon as={FaUser} />
                <Text>Individual Prediction</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <Icon as={FaFileCsv} />
                <Text>CSV Bulk Upload</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Individual Prediction Tab */}
            <TabPanel>
              {/* Progress Stepper */}
              <Box mb={8}>
                <Stepper index={activeStep} colorScheme="blue">
                  {steps.map((step, index) => (
                    <Step key={index}>
                      <StepIndicator>
                        <StepStatus
                          complete={<StepIcon />}
                          incomplete={<StepNumber />}
                          active={<StepNumber />}
                        />
                      </StepIndicator>
                      <Box flexShrink="0">
                        <StepTitle>{step.title}</StepTitle>
                        <StepDescription>{step.description}</StepDescription>
                      </Box>
                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert status="error" mb={6} borderRadius="md">
                  <AlertIcon />
                  <AlertTitle>Error!</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Step Content */}
              <AnimatePresence mode="wait">
                {/* Step 1: Disease Selection */}
                {activeStep === 0 && (
                  <MotionBox
                    key="step1"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VStack spacing={6} align="stretch">
                      <Box textAlign="center">
                        <Heading size="lg" mb={2}>Select Primary Medical Condition</Heading>
                        <Text color={lightTextColor}>
                          Choose the primary diagnosis to customize assessment parameters
                        </Text>
                      </Box>

                      <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
                        {Object.entries(diseaseConfigs).map(([disease, config]) => (
                          <MotionCard
                            key={disease}
                            cursor="pointer"
                            onClick={() => handleDiseaseSelect(disease)}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            border="2px"
                            borderColor={selectedDisease === disease ? "blue.500" : borderColor}
                            bg={selectedDisease === disease ? "blue.50" : cardBg}
                            _hover={{ borderColor: "blue.300", shadow: "xl" }}
                            transition="all 0.2s"
                            borderRadius="xl"
                            overflow="hidden"
                            position="relative"
                          >
                            <CardBody p={6}>
                              <VStack spacing={4} align="start">
                                <HStack>
                                  <Icon as={config.icon} color={config.color} boxSize={8} />
                                  <Heading size="md">{disease}</Heading>
                                </HStack>
                                <Text fontSize="sm" color={lightTextColor}>
                                  {config.description}
                                </Text>
                                {selectedDisease === disease && (
                                  <Badge colorScheme="blue" alignSelf="end">
                                    ✓ Selected
                                  </Badge>
                                )}
                              </VStack>
                            </CardBody>
                          </MotionCard>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  </MotionBox>
                )}

                {/* Step 2: Patient Information */}
                {activeStep === 1 && selectedDisease && (
                  <MotionBox
                    key="step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VStack spacing={6} align="stretch">
                      <Box textAlign="center">
                        <Heading size="lg" mb={2}>Patient Information</Heading>
                        <Text color={lightTextColor}>
                          Basic patient demographics and hospital stay details
                        </Text>
                        <Badge colorScheme="blue" mt={2}>
                          📋 {selectedDisease}
                        </Badge>
                      </Box>

                      <Card bg={cardBg} borderColor={borderColor}>
                        <CardBody p={6}>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            {commonParameters.map(renderParameterInput)}
                          </SimpleGrid>
                        </CardBody>
                      </Card>

                      <HStack justify="space-between">
                        <Button
                          onClick={handlePrevious}
                          variant="outline"
                          size="lg"
                          leftIcon={<FaArrowLeft />}
                        >
                          Previous
                        </Button>
                        <Button
                          onClick={handleNext}
                          size="lg"
                          rightIcon={<FaArrowRight />}
                        >
                          Next: Condition Parameters
                        </Button>
                      </HStack>
                    </VStack>
                  </MotionBox>
                )}

                {/* Step 3: Disease-Specific Parameters */}
                {activeStep === 2 && selectedDisease && (
                  <MotionBox
                    key="step3"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VStack spacing={6} align="stretch">
                      <Box textAlign="center">
                        <Heading size="lg" mb={2}>{selectedDisease} Parameters</Heading>
                        <Text color={lightTextColor}>
                          Condition-specific clinical parameters for accurate risk assessment
                        </Text>
                      </Box>

                      <Card bg={cardBg} borderColor={borderColor}>
                        <CardBody p={6}>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            {diseaseConfigs[selectedDisease].parameters.map(renderParameterInput)}
                          </SimpleGrid>
                        </CardBody>
                      </Card>

                      <HStack justify="space-between">
                        <Button
                          onClick={handlePrevious}
                          variant="outline"
                          size="lg"
                          leftIcon={<FaArrowLeft />}
                        >
                          Previous
                        </Button>
                        <Button
                          onClick={formik.handleSubmit}
                          size="lg"
                          colorScheme="blue"
                          isLoading={loading}
                          loadingText="Generating..."
                          rightIcon={<FaHeartbeat />}
                        >
                          Generate Risk Assessment
                        </Button>
                      </HStack>
                    </VStack>
                  </MotionBox>
                )}

                {/* Step 4: Results */}
                {activeStep === 3 && result && (
                  <MotionBox
                    key="step4"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VStack spacing={6} align="stretch">
                      {savedPatientId && (
                        <Alert status="success" borderRadius="md">
                          <AlertIcon />
                          <VStack align="start" flex={1} spacing={1}>
                            <AlertTitle>Patient Data Saved Successfully! 🎉</AlertTitle>
                            <AlertDescription>
                              Patient {formik.values.patient_name} (ID: {savedPatientId})
                              has been saved to {currentHospital?.name} database and will appear in your dashboard.
                            </AlertDescription>
                          </VStack>
                        </Alert>
                      )}

                      <RiskResult
                        score={result.score}
                        risk={result.risk}
                        confidence={result.confidence}
                        disease_type={selectedDisease}
                      />

                      <Button
                        onClick={() => {
                          setActiveStep(0);
                          setSelectedDisease("");
                          setResult(null);
                          setSavedPatientId(null);
                          formik.resetForm();
                        }}
                        size="lg"
                        variant="outline"
                        colorScheme="blue"
                        borderRadius="full"
                        px={8}
                        leftIcon={<FaArrowLeft />}
                      >
                        🔄 Start New Assessment
                      </Button>
                    </VStack>
                  </MotionBox>
                )}
              </AnimatePresence>
            </TabPanel>

            {/* CSV Upload Tab */}
            <TabPanel>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                bg={cardBg}
                borderColor={borderColor}
                borderWidth="2px"
                borderRadius="xl"
              >
                <CardBody p={6}>
                  <HStack justify="space-between" mb={4}>
                    <HStack>
                      <Icon as={FaFileCsv} color="blue.500" boxSize={6} />
                      <Heading size="md">CSV Bulk Upload</Heading>
                    </HStack>
                    <Badge colorScheme="blue" variant="subtle">
                      Batch Processing
                    </Badge>
                  </HStack>

                  <Text color="gray.600" mb={6}>
                    Upload a CSV file with patient data for bulk risk assessment and storage in Firestore.
                  </Text>

                  {/* File Upload Area */}
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Select CSV File</FormLabel>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        display="none"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        leftIcon={<FaFileUpload />}
                        variant="outline"
                        size="lg"
                        w="full"
                        h="60px"
                        borderStyle="dashed"
                        _hover={{ borderColor: "blue.400", bg: "blue.50" }}
                      >
                        Choose CSV File or Drag & Drop
                      </Button>
                    </FormControl>

                    {/* File Info */}
                    {csvFile && (
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <VStack align="start" flex={1} spacing={1}>
                          <Text fontWeight="bold">{csvFile.name}</Text>
                          <Text fontSize="sm">
                            Size: {(csvFile.size / 1024 / 1024).toFixed(2)} MB | 
                            Records: {csvData.length}
                          </Text>
                        </VStack>
                      </Alert>
                    )}

                    {/* CSV Statistics */}
                    {csvStats.totalRecords && (
                      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Card bg="blue.50" borderColor="blue.200">
                          <CardBody textAlign="center" p={4}>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                              {csvStats.totalRecords}
                            </Text>
                            <Text fontSize="sm" color="blue.500">Total Records</Text>
                          </CardBody>
                        </Card>
                        <Card bg="green.50" borderColor="green.200">
                          <CardBody textAlign="center" p={4}>
                            <Text fontSize="2xl" fontWeight="bold" color="green.600">
                              {csvStats.columnCount}
                            </Text>
                            <Text fontSize="sm" color="green.500">Columns</Text>
                          </CardBody>
                        </Card>
                        <Card bg="purple.50" borderColor="purple.200">
                          <CardBody textAlign="center" p={4}>
                            <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                              {Object.values(csvStats.dataTypes || {}).filter(type => type === 'numeric').length}
                            </Text>
                            <Text fontSize="sm" color="purple.500">Numeric Fields</Text>
                          </CardBody>
                        </Card>
                        <Card bg="orange.50" borderColor="orange.200">
                          <CardBody textAlign="center" p={4}>
                            <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                              {Object.values(csvStats.dataTypes || {}).filter(type => type === 'text').length}
                            </Text>
                            <Text fontSize="sm" color="orange.500">Text Fields</Text>
                          </CardBody>
                        </Card>
                      </SimpleGrid>
                    )}

                    {/* Action Buttons */}
                    {csvData.length > 0 && (
                      <HStack spacing={4}>
                        <Button
                          leftIcon={<FaEye />}
                          variant="outline"
                          onClick={onOpen}
                        >
                          Preview Data
                        </Button>
                        <Button
                          leftIcon={<FaDatabase />}
                          colorScheme="blue"
                          onClick={uploadCsvToFirestore}
                          isLoading={uploadingCsv}
                          loadingText="Uploading..."
                          flex={1}
                        >
                          Upload to Firestore
                        </Button>
                        <Button
                          leftIcon={<FaTrash />}
                          variant="outline"
                          colorScheme="red"
                          onClick={clearCsvData}
                        >
                          Clear
                        </Button>
                      </HStack>
                    )}

                    {/* Upload Progress */}
                    {uploadingCsv && (
                      <VStack spacing={2}>
                        <Progress 
                          value={uploadProgress} 
                          w="full" 
                          colorScheme="blue"
                          borderRadius="md"
                        />
                        <Text fontSize="sm" color="gray.600">
                          Uploading: {Math.round(uploadProgress)}% complete
                        </Text>
                      </VStack>
                    )}
                  </VStack>
                </CardBody>
              </MotionCard>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* CSV Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            CSV Data Preview
            <Badge ml={2} colorScheme="blue">
              Showing first 5 rows of {csvData.length} records
            </Badge>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {csvPreview.length > 0 && (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      {Object.keys(csvPreview[0]).slice(0, 10).map((column) => (
                        <Th key={column}>{column.replace(/_/g, ' ').toUpperCase()}</Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {csvPreview.map((row, index) => (
                      <Tr key={index}>
                        {Object.entries(row).slice(0, 10).map(([key, value]) => (
                          <Td key={key}>
                            {value !== null ? String(value) : 
                              <Badge colorScheme="gray" variant="subtle">NULL</Badge>
                            }
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
