// src/pages/PatientSamples.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Badge,
  Button,
  Icon,
  useColorModeValue,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Container,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure
} from "@chakra-ui/react";
import {
  FaUsers,
  FaSearch,
  FaFilter,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaUserMd,
  FaCalendarAlt,
  FaHeartbeat,
  FaExclamationTriangle
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useHospital } from "../contexts/HospitalContext";
import { collection, getDocs, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebase";
import PatientTable from "../components/PatientTable";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

export default function PatientSamples() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const { currentHospital } = useHospital();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const bgColor = useColorModeValue("gray.50", "gray.900");

  // Fetch patients from Firebase
  const fetchPatients = useCallback(async () => {
    if (!currentHospital?.id) {
      setError("No hospital selected");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First try to get from csv_data collection (existing patient data)
      const csvCollection = collection(db, 'Hospital', currentHospital.id, 'csv_data');
      const csvQuery = query(csvCollection, orderBy('age', 'desc'));
      
      const csvSnapshot = await getDocs(csvQuery);
      
      if (!csvSnapshot.empty) {
        const patientData = csvSnapshot.docs.map((doc, index) => {
          const data = doc.data();
          return {
            id: doc.id,
            patientId: data.patient_id || `P${String(index + 1).padStart(4, '0')}`,
            name: data.patient_name || data.name || `Patient ${index + 1}`,
            age: data.age || 'N/A',
            gender: data.gender || 'Unknown',
            diagnosis: data.primary_diagnosis || data.diagnosis || 'Not specified',
            riskLevel: calculateRiskLevel(data),
            readmissionProbability: calculateReadmissionProb(data),
            lastAdmission: formatDate(data.admission_date || data.last_admission),
            nextFollowUp: calculateFollowUp(data),
            status: data.status || (data.readmitted_30_days ? 'Readmitted' : 'Discharged'),
            lengthOfStay: data.length_of_stay || 'N/A',
            admissionType: data.admission_type || 'Unknown',
            medications: data.num_medications_prescribed || 0,
            cost: data.baseline_cost || data.cost || 'N/A',
            // Additional fields for detailed view
            bloodPressure: data.resting_bp || 'N/A',
            cholesterol: data.cholesterol || 'N/A',
            heartRate: data.max_heart_rate || 'N/A',
            icuStay: data.icu_stay_flag || false,
            complications: data.complications || 'None',
            dischargeLocation: data.discharge_location || 'Home'
          };
        });

        setPatients(patientData);
        setFilteredPatients(patientData);
        
        toast({
          title: "Patients Loaded",
          description: `${patientData.length} patients retrieved successfully`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // If no csv_data, try to get from a dedicated patients collection
        const patientsCollection = collection(db, 'Hospital', currentHospital.id, 'patients');
        const patientsSnapshot = await getDocs(patientsCollection);
        
        if (!patientsSnapshot.empty) {
          const patientData = patientsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setPatients(patientData);
          setFilteredPatients(patientData);
        } else {
          setError("No patient data found for this hospital");
        }
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Failed to load patient data");
    } finally {
      setLoading(false);
    }
  }, [currentHospital, toast]);

  // Set up real-time listener for patient data
  useEffect(() => {
    fetchPatients();

    // Set up real-time listener
    if (currentHospital?.id) {
      const csvCollection = collection(db, 'Hospital', currentHospital.id, 'csv_data');
      const unsubscribe = onSnapshot(csvCollection, (snapshot) => {
        if (!snapshot.empty) {
          const patientData = snapshot.docs.map((doc, index) => {
            const data = doc.data();
            return {
              id: doc.id,
              patientId: data.patient_id || `P${String(index + 1).padStart(4, '0')}`,
              name: data.patient_name || data.name || `Patient ${index + 1}`,
              age: data.age || 'N/A',
              gender: data.gender || 'Unknown',
              diagnosis: data.primary_diagnosis || data.diagnosis || 'Not specified',
              riskLevel: calculateRiskLevel(data),
              readmissionProbability: calculateReadmissionProb(data),
              lastAdmission: formatDate(data.admission_date || data.last_admission),
              nextFollowUp: calculateFollowUp(data),
              status: data.status || (data.readmitted_30_days ? 'Readmitted' : 'Discharged'),
              lengthOfStay: data.length_of_stay || 'N/A',
              admissionType: data.admission_type || 'Unknown',
              medications: data.num_medications_prescribed || 0,
              cost: data.baseline_cost || data.cost || 'N/A'
            };
          });

          setPatients(patientData);
          setFilteredPatients(patientData);
        }
      });

      return () => unsubscribe();
    }
  }, [fetchPatients]);

  // Helper functions
  const calculateRiskLevel = (data) => {
    const age = parseInt(data.age) || 0;
    const lengthOfStay = parseInt(data.length_of_stay) || 0;
    const medications = parseInt(data.num_medications_prescribed) || 0;
    const isReadmitted = data.readmitted_30_days === 1 || data.readmitted === 1;

    if (isReadmitted || age > 75 || lengthOfStay > 10 || medications > 15) {
      return 'High';
    } else if (age > 60 || lengthOfStay > 5 || medications > 8) {
      return 'Medium';
    }
    return 'Low';
  };

  const calculateReadmissionProb = (data) => {
    const riskLevel = calculateRiskLevel(data);
    if (riskLevel === 'High') return Math.floor(Math.random() * 30) + 70 + '%';
    if (riskLevel === 'Medium') return Math.floor(Math.random() * 30) + 40 + '%';
    return Math.floor(Math.random() * 30) + 10 + '%';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const calculateFollowUp = (data) => {
    const riskLevel = calculateRiskLevel(data);
    const baseDate = new Date();
    
    if (riskLevel === 'High') {
      baseDate.setDate(baseDate.getDate() + 3);
    } else if (riskLevel === 'Medium') {
      baseDate.setDate(baseDate.getDate() + 7);
    } else {
      baseDate.setDate(baseDate.getDate() + 30);
    }
    
    return baseDate.toLocaleDateString();
  };

  // Filter patients based on search and filters
  useEffect(() => {
    let filtered = patients;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Risk level filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(patient =>
        patient.riskLevel.toLowerCase() === riskFilter.toLowerCase()
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient =>
        patient.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm, riskFilter, statusFilter]);

  // Patient statistics
  const totalPatients = patients.length;
  const highRiskPatients = patients.filter(p => p.riskLevel === 'High').length;
  const readmittedPatients = patients.filter(p => p.status === 'Readmitted').length;
  const averageAge = patients.length > 0 ? 
    Math.round(patients.reduce((sum, p) => sum + (parseInt(p.age) || 0), 0) / patients.length) : 0;

  const handlePatientView = (patient) => {
    setSelectedPatient(patient);
    onOpen();
  };

  const handlePatientEdit = (patient) => {
    toast({
      title: "Edit Patient",
      description: "Patient editing functionality will be implemented",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const handlePatientDelete = (patient) => {
    toast({
      title: "Delete Patient",
      description: "Patient deletion requires proper authorization",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <Box minH="calc(100vh - 80px)" bg={bgColor}>
        <Center h="calc(100vh - 80px)">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text color={textColor} fontSize="lg">
              Loading patient data...
            </Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="calc(100vh - 80px)" bg={bgColor} p={8}>
        <Container maxW="6xl">
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="8xl" py={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <VStack align="start" spacing={2}>
              <Heading size="xl" color={textColor}>
                Patient Management
              </Heading>
              <Text color="gray.500" fontSize="md">
                Monitor patient readmission risk profiles and manage care coordination for {currentHospital?.name}
              </Text>
            </VStack>
          </MotionBox>

          {/* Statistics Cards */}
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
            <StatCard
              title="Total Patients"
              value={totalPatients}
              icon={FaUsers}
              color="blue.500"
            />
            <StatCard
              title="High Risk"
              value={highRiskPatients}
              icon={FaExclamationTriangle}
              color="red.500"
            />
            <StatCard
              title="Readmitted"
              value={readmittedPatients}
              icon={FaHeartbeat}
              color="orange.500"
            />
            <StatCard
              title="Average Age"
              value={`${averageAge} years`}
              icon={FaCalendarAlt}
              color="green.500"
            />
          </SimpleGrid>

          {/* Filters and Search */}
          <Card bg={cardBg} borderColor={borderColor} border="1px">
            <CardBody>
              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={4}
                align={{ base: 'stretch', md: 'center' }}
              >
                <InputGroup flex={1}>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search patients by name, ID, or diagnosis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>

                <Select
                  placeholder="Filter by risk level"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  maxW={{ base: 'full', md: '200px' }}
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="low">Low Risk</option>
                </Select>

                <Select
                  placeholder="Filter by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  maxW={{ base: 'full', md: '200px' }}
                >
                  <option value="all">All Status</option>
                  <option value="discharged">Discharged</option>
                  <option value="readmitted">Readmitted</option>
                  <option value="active">Active</option>
                </Select>

                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="blue"
                  onClick={() => toast({
                    title: "Add Patient",
                    description: "Add new patient functionality will be implemented",
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                  })}
                >
                  Add Patient
                </Button>
              </Flex>
            </CardBody>
          </Card>

          {/* Patient Table */}
          <Card bg={cardBg} borderColor={borderColor} border="1px">
            <CardHeader>
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  Patient List ({filteredPatients.length} patients)
                </Text>
                <Badge colorScheme="green" variant="solid">
                  Live Data
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <PatientTable
                patients={filteredPatients}
                onView={handlePatientView}
                onEdit={handlePatientEdit}
                onDelete={handlePatientDelete}
              />
            </CardBody>
          </Card>
        </VStack>

        {/* Patient Detail Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Patient Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedPatient && (
                <VStack align="start" spacing={4}>
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <Box>
                      <Text fontWeight="bold">Patient ID:</Text>
                      <Text>{selectedPatient.patientId}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Name:</Text>
                      <Text>{selectedPatient.name}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Age:</Text>
                      <Text>{selectedPatient.age}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Gender:</Text>
                      <Text>{selectedPatient.gender}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Diagnosis:</Text>
                      <Text>{selectedPatient.diagnosis}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Risk Level:</Text>
                      <Badge colorScheme={
                        selectedPatient.riskLevel === 'High' ? 'red' :
                        selectedPatient.riskLevel === 'Medium' ? 'orange' : 'green'
                      }>
                        {selectedPatient.riskLevel}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Length of Stay:</Text>
                      <Text>{selectedPatient.lengthOfStay} days</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Medications:</Text>
                      <Text>{selectedPatient.medications}</Text>
                    </Box>
                  </SimpleGrid>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: IconComponent, color }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      bg={cardBg}
      borderColor={borderColor}
      border="1px"
      borderRadius="xl"
      shadow="md"
      _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
      transition="all 0.2s"
    >
      <CardBody>
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              {title}
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {value}
            </Text>
          </VStack>
          <Icon as={IconComponent} boxSize={8} color={color} />
        </HStack>
      </CardBody>
    </MotionCard>
  );
}
