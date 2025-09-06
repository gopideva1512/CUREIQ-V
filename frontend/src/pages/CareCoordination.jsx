// src/pages/CareCoordination.jsx
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
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  List,
  ListItem,
  Divider,
  useColorModeValue,
  Grid,
  GridItem,
  Avatar,
  Tag,
  TagLabel,
  TagLeftIcon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Center,
  Spinner,
  Container,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Flex
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FaUserMd,
  FaNurse,
  FaPhone,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaHandshake,
  FaUsers,
  FaChartLine,
  FaBell,
  FaEnvelope,
  FaVideo,
  FaHome,
  FaPills,
  FaHeartbeat,
  FaPlus,
  FaCircle,
  FaEdit,
  FaTrash
} from "react-icons/fa";
import { collection, getDocs, onSnapshot, query, orderBy, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useHospital } from "../contexts/HospitalContext";
import { db } from "../firebase";

const MotionCard = motion(Card);

export default function CareCoordination() {
  const [careTasks, setCareTasks] = useState([]);
  const [careTeam, setCareTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  
  const { currentHospital } = useHospital();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const bgColor = useColorModeValue("gray.50", "gray.900");

  // Fetch care tasks from Firebase
  const fetchCareTasks = useCallback(async () => {
    if (!currentHospital?.id) {
      setError("No hospital selected");
      return;
    }

    try {
      // Try to fetch from care_tasks collection first
      const careTasksCollection = collection(db, 'Hospital', currentHospital.id, 'care_tasks');
      const careTasksQuery = query(careTasksCollection, orderBy('dueDate', 'asc'));
      
      const careTasksSnapshot = await getDocs(careTasksQuery);
      
      if (!careTasksSnapshot.empty) {
        const tasksData = careTasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCareTasks(tasksData);
      } else {
        // If no care_tasks collection exists, create sample data from CSV data
        const csvCollection = collection(db, 'Hospital', currentHospital.id, 'csv_data');
        const csvSnapshot = await getDocs(csvCollection);
        
        if (!csvSnapshot.empty) {
          const patientData = csvSnapshot.docs.slice(0, 8).map((doc, index) => {
            const data = doc.data();
            const priority = calculateTaskPriority(data);
            const taskType = getTaskType(index);
            
            return {
              id: doc.id,
              patient: data.patient_name || data.name || `Patient ${index + 1}`,
              task: getTaskDescription(taskType, data),
              priority: priority,
              status: getTaskStatus(data),
              assignedTo: getAssignedPerson(taskType),
              dueDate: generateDueDate(priority),
              type: taskType,
              patientAge: data.age || 'N/A',
              diagnosis: data.primary_diagnosis || data.diagnosis || 'General Care',
              riskLevel: calculateRiskLevel(data)
            };
          });
          
          setCareTasks(patientData);
        }
      }
    } catch (err) {
      console.error("Error fetching care tasks:", err);
      setError("Failed to load care tasks");
    }
  }, [currentHospital]);

  // Fetch care team from Firebase
  const fetchCareTeam = useCallback(async () => {
    if (!currentHospital?.id) return;

    try {
      // Try to fetch from care_team collection
      const careTeamCollection = collection(db, 'Hospital', currentHospital.id, 'care_team');
      const careTeamSnapshot = await getDocs(careTeamCollection);
      
      if (!careTeamSnapshot.empty) {
        const teamData = careTeamSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCareTeam(teamData);
      } else {
        // Create default care team if none exists
        const defaultTeam = [
          {
            id: 'team1',
            name: "Dr. Sarah Johnson",
            role: "Primary Care Physician",
            specialty: "Internal Medicine",
            availability: "Available",
            avatar: "SJ",
            phone: "+1-555-0101",
            email: "dr.johnson@hospital.com"
          },
          {
            id: 'team2',
            name: "Nurse Mike Williams",
            role: "Care Coordinator",
            specialty: "Patient Navigation",
            availability: "Available",
            avatar: "MW",
            phone: "+1-555-0102",
            email: "m.williams@hospital.com"
          },
          {
            id: 'team3',
            name: "Dr. Lisa Chen",
            role: "Cardiologist",
            specialty: "Cardiology",
            availability: "In Session",
            avatar: "LC",
            phone: "+1-555-0103",
            email: "dr.chen@hospital.com"
          },
          {
            id: 'team4',
            name: "Social Worker Amy",
            role: "Social Worker",
            specialty: "Patient Support",
            availability: "Available",
            avatar: "AS",
            phone: "+1-555-0104",
            email: "a.social@hospital.com"
          }
        ];
        setCareTeam(defaultTeam);
      }
    } catch (err) {
      console.error("Error fetching care team:", err);
    }
  }, [currentHospital]);

  // Set up real-time listeners
  useEffect(() => {
    if (!currentHospital?.id) {
      setError("No hospital selected");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Real-time listener for care tasks
    const careTasksCollection = collection(db, 'Hospital', currentHospital.id, 'care_tasks');
    const unsubscribeTasks = onSnapshot(careTasksCollection, 
      (snapshot) => {
        if (!snapshot.empty) {
          const tasksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCareTasks(tasksData);
        } else {
          // Fallback to generating from CSV data
          fetchCareTasks();
        }
      },
      (error) => {
        console.error("Real-time tasks error:", error);
        fetchCareTasks(); // Fallback
      }
    );

    // Real-time listener for care team
    const careTeamCollection = collection(db, 'Hospital', currentHospital.id, 'care_team');
    const unsubscribeTeam = onSnapshot(careTeamCollection,
      (snapshot) => {
        if (!snapshot.empty) {
          const teamData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCareTeam(teamData);
        } else {
          fetchCareTeam(); // Fallback
        }
      },
      (error) => {
        console.error("Real-time team error:", error);
        fetchCareTeam(); // Fallback
      }
    );

    setLoading(false);

    return () => {
      unsubscribeTasks();
      unsubscribeTeam();
    };
  }, [currentHospital, fetchCareTasks, fetchCareTeam]);

  // Helper functions for generating sample data
  const calculateTaskPriority = (data) => {
    const age = parseInt(data.age) || 0;
    const lengthOfStay = parseInt(data.length_of_stay) || 0;
    const isReadmitted = data.readmitted_30_days === 1;
    
    if (isReadmitted || age > 75 || lengthOfStay > 10) return "High";
    if (age > 60 || lengthOfStay > 5) return "Medium";
    return "Low";
  };

  const calculateRiskLevel = (data) => {
    return calculateTaskPriority(data);
  };

  const getTaskType = (index) => {
    const types = ["appointment", "medication", "assessment", "education", "follow-up"];
    return types[index % types.length];
  };

  const getTaskDescription = (type, data) => {
    const descriptions = {
      appointment: "Follow-up Appointment",
      medication: "Medication Review",
      assessment: "Home Health Assessment", 
      education: "Family Education Session",
      "follow-up": "Post-Discharge Follow-up"
    };
    return descriptions[type] || "Care Coordination Task";
  };

  const getTaskStatus = (data) => {
    const statuses = ["Pending", "In Progress", "Scheduled", "Completed"];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getAssignedPerson = (type) => {
    const assignments = {
      appointment: "Dr. Johnson",
      medication: "Nurse Williams", 
      assessment: "Care Coordinator",
      education: "Social Worker",
      "follow-up": "Dr. Chen"
    };
    return assignments[type] || "Care Team";
  };

  const generateDueDate = (priority) => {
    const baseDate = new Date();
    const daysToAdd = priority === "High" ? 1 : priority === "Medium" ? 3 : 7;
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    return baseDate.toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "red";
      case "medium": return "orange";
      case "low": return "green";
      default: return "gray";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed": return "green";
      case "in progress": return "blue";
      case "pending": return "yellow";
      case "scheduled": return "purple";
      default: return "gray";
    }
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case "appointment": return FaCalendarAlt;
      case "medication": return FaPills;
      case "assessment": return FaHome;
      case "education": return FaUsers;
      case "follow-up": return FaHeartbeat;
      default: return FaHandshake;
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    onOpen();
  };

  const handleAddTask = () => {
    toast({
      title: "Add New Task",
      description: "Task creation functionality will be implemented",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Calculate statistics
  const completedTasks = careTasks.filter(task => task.status?.toLowerCase() === "completed").length;
  const totalTasks = careTasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const highPriorityTasks = careTasks.filter(task => task.priority?.toLowerCase() === "high").length;

  if (loading) {
    return (
      <Box minH="calc(100vh - 80px)" bg={bgColor}>
        <Center h="calc(100vh - 80px)">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text color={textColor} fontSize="lg">
              Loading care coordination data...
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
          <VStack align="start" spacing={2}>
            <Heading size="xl" color={textColor}>
              Care Coordination Center
            </Heading>
            <Text color="gray.500" fontSize="md">
              Streamline patient care coordination and team collaboration for {currentHospital?.name}
            </Text>
          </VStack>

          {/* Key Metrics */}
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
            <StatCard
              title="Active Tasks"
              value={totalTasks}
              icon={FaHandshake}
              color="blue.500"
              subtitle="Care coordination tasks"
            />
            <StatCard
              title="Tasks Completed"
              value={completedTasks}
              icon={FaCheckCircle}
              color="green.500"
              subtitle={`${completionRate.toFixed(1)}% completion rate`}
            />
            <StatCard
              title="Care Team Members"
              value={careTeam.length}
              icon={FaUsers}
              color="purple.500"
              subtitle="Available for coordination"
            />
            <StatCard
              title="High Priority Tasks"
              value={highPriorityTasks}
              icon={FaExclamationTriangle}
              color="red.500"
              subtitle="Require immediate attention"
            />
          </SimpleGrid>

          {/* Main Content Grid */}
          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
            {/* Care Tasks */}
            <Card bg={cardBg} borderColor={borderColor} border="1px">
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md" color={textColor}>
                    Care Tasks
                  </Heading>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    leftIcon={<FaPlus />}
                    onClick={handleAddTask}
                  >
                    Add Task
                  </Button>
                </Flex>
                <Text color="gray.500" fontSize="sm" mt={1}>
                  Track and manage patient care coordination tasks
                </Text>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="stretch" spacing={3}>
                  {careTasks.length === 0 ? (
                    <Center py={8}>
                      <Text color="gray.500">No care tasks available</Text>
                    </Center>
                  ) : (
                    careTasks.map((task) => (
                      <MotionCard
                        key={task.id}
                        cursor="pointer"
                        onClick={() => handleTaskClick(task)}
                        whileHover={{ scale: 1.02, boxShadow: "md" }}
                        whileTap={{ scale: 0.98 }}
                        bg={cardBg}
                        border="1px"
                        borderColor={borderColor}
                        borderRadius="lg"
                        p={4}
                        _hover={{ borderColor: "blue.300" }}
                      >
                        <HStack justify="space-between" align="start">
                          <HStack spacing={3}>
                            <Icon as={getTaskIcon(task.type)} color="blue.400" boxSize={5} />
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold" color={textColor} noOfLines={1}>
                                {task.task}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                Patient: {task.patient}
                              </Text>
                            </VStack>
                          </HStack>
                          <VStack align="end" spacing={1}>
                            <Badge
                              colorScheme={getPriorityColor(task.priority)}
                              variant="subtle"
                              fontSize="xs"
                            >
                              {task.priority} Priority
                            </Badge>
                            <Badge
                              colorScheme={getStatusColor(task.status)}
                              variant="subtle"
                              fontSize="xs"
                            >
                              {task.status}
                            </Badge>
                          </VStack>
                        </HStack>
                        
                        <HStack mt={3} spacing={4} fontSize="sm" color="gray.600">
                          <Text>
                            <strong>Assigned:</strong> {task.assignedTo}
                          </Text>
                          <Text>
                            <strong>Due:</strong> {task.dueDate}
                          </Text>
                        </HStack>
                      </MotionCard>
                    ))
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Care Team & Quick Actions */}
            <VStack spacing={6}>
              {/* Care Team */}
              <Card bg={cardBg} borderColor={borderColor} border="1px" w="full">
                <CardHeader>
                  <Heading size="md" color={textColor}>
                    Care Team
                  </Heading>
                  <Text color="gray.500" fontSize="sm" mt={1}>
                    Available team members for coordination
                  </Text>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="stretch" spacing={4}>
                    {careTeam.length === 0 ? (
                      <Center py={4}>
                        <Text color="gray.500">No care team members available</Text>
                      </Center>
                    ) : (
                      careTeam.map((member) => (
                        <HStack key={member.id} spacing={3} align="center">
                          <Avatar name={member.name} size="md" />
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontWeight="semibold" color={textColor}>
                              {member.name}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {member.role}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {member.specialty}
                            </Text>
                          </VStack>
                          <Tag
                            colorScheme={
                              member.availability?.toLowerCase() === "available" ? "green" : "orange"
                            }
                            size="sm"
                          >
                            <TagLeftIcon as={FaCircle} />
                            <TagLabel>{member.availability || "Unknown"}</TagLabel>
                          </Tag>
                        </HStack>
                      ))
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <Card bg={cardBg} borderColor={borderColor} border="1px" w="full">
                <CardHeader>
                  <Heading size="md" color={textColor}>
                    Quick Actions
                  </Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="stretch" spacing={3}>
                    <Button
                      colorScheme="blue"
                      variant="outline"
                      size="sm"
                      leftIcon={<FaPhone />}
                      justifyContent="start"
                      onClick={() => toast({
                        title: "Schedule Call",
                        description: "Call scheduling functionality will be implemented",
                        status: "info",
                        duration: 3000,
                        isClosable: true,
                      })}
                    >
                      Schedule Call
                    </Button>
                    
                    <Button
                      colorScheme="green"
                      variant="outline"
                      size="sm"
                      leftIcon={<FaVideo />}
                      justifyContent="start"
                      onClick={() => toast({
                        title: "Start Telehealth",
                        description: "Telehealth functionality will be implemented",
                        status: "info",
                        duration: 3000,
                        isClosable: true,
                      })}
                    >
                      Start Telehealth
                    </Button>
                    
                    <Button
                      colorScheme="purple"
                      variant="outline"
                      size="sm"
                      leftIcon={<FaEnvelope />}
                      justifyContent="start"
                      onClick={() => toast({
                        title: "Send Message",
                        description: "Messaging functionality will be implemented",
                        status: "info",
                        duration: 3000,
                        isClosable: true,
                      })}
                    >
                      Send Message
                    </Button>
                    
                    <Button
                      colorScheme="orange"
                      variant="outline"
                      size="sm"
                      leftIcon={<FaCalendarAlt />}
                      justifyContent="start"
                      onClick={() => toast({
                        title: "Schedule Meeting",
                        description: "Meeting scheduling functionality will be implemented",
                        status: "info",
                        duration: 3000,
                        isClosable: true,
                      })}
                    >
                      Schedule Meeting
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* Alerts */}
              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                <Box>
                  <AlertTitle>Live Data!</AlertTitle>
                  <AlertDescription>
                    Care coordination data is now fetched dynamically from Firebase and updates in real-time.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </SimpleGrid>
        </VStack>

        {/* Task Detail Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Task Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedTask && (
                <VStack align="start" spacing={4}>
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <Box>
                      <Text fontWeight="bold">Task:</Text>
                      <Text>{selectedTask.task}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Patient:</Text>
                      <Text>{selectedTask.patient}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Priority:</Text>
                      <Badge colorScheme={getPriorityColor(selectedTask.priority)}>
                        {selectedTask.priority}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Status:</Text>
                      <Badge colorScheme={getStatusColor(selectedTask.status)}>
                        {selectedTask.status}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Assigned To:</Text>
                      <Text>{selectedTask.assignedTo}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Due Date:</Text>
                      <Text>{selectedTask.dueDate}</Text>
                    </Box>
                    {selectedTask.diagnosis && (
                      <Box>
                        <Text fontWeight="bold">Diagnosis:</Text>
                        <Text>{selectedTask.diagnosis}</Text>
                      </Box>
                    )}
                    {selectedTask.riskLevel && (
                      <Box>
                        <Text fontWeight="bold">Risk Level:</Text>
                        <Badge colorScheme={getPriorityColor(selectedTask.riskLevel)}>
                          {selectedTask.riskLevel}
                        </Badge>
                      </Box>
                    )}
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

// StatCard Component
function StatCard({ title, value, icon: IconComponent, color, subtitle }) {
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
            <Text fontSize="xs" color="gray.400">
              {subtitle}
            </Text>
          </VStack>
          <Icon as={IconComponent} boxSize={8} color={color} />
        </HStack>
      </CardBody>
    </MotionCard>
  );
}
