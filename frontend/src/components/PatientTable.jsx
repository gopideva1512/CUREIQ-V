// src/components/PatientTable.jsx
import React from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  HStack,
  Text,
  Avatar,
  VStack,
  useColorModeValue,
  Box,
  IconButton,
  Tooltip
} from "@chakra-ui/react";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaMale,
  FaFemale,
  FaUser
} from "react-icons/fa";

export default function PatientTable({ patients, onView, onEdit, onDelete }) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'readmitted': return 'red';
      case 'discharged': return 'green';
      case 'active': return 'blue';
      default: return 'gray';
    }
  };

  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male': return FaMale;
      case 'female': return FaFemale;
      default: return FaUser;
    }
  };

  if (!patients || patients.length === 0) {
    return (
      <Box p={8} textAlign="center">
        <Text color="gray.500" fontSize="lg">
          No patients found matching the current filters
        </Text>
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Patient</Th>
            <Th>Age/Gender</Th>
            <Th>Diagnosis</Th>
            <Th>Risk Level</Th>
            <Th>Readmission Probability</Th>
            <Th>Last Admission</Th>
            <Th>Next Follow-up</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {patients.map((patient) => (
            <Tr 
              key={patient.id}
              _hover={{ bg: hoverBg }}
              transition="all 0.2s"
            >
              <Td>
                <HStack spacing={3}>
                  <Avatar 
                    size="sm" 
                    name={patient.name}
                    icon={<FaUser />}
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold" fontSize="sm">
                      {patient.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      ID: {patient.patientId}
                    </Text>
                  </VStack>
                </HStack>
              </Td>
              
              <Td>
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm">{patient.age} years</Text>
                  <HStack spacing={1}>
                    <Box as={getGenderIcon(patient.gender)} size="10px" />
                    <Text fontSize="xs" color="gray.500">
                      {patient.gender}
                    </Text>
                  </HStack>
                </VStack>
              </Td>
              
              <Td>
                <Text fontSize="sm" noOfLines={2} maxW="200px">
                  {patient.diagnosis}
                </Text>
              </Td>
              
              <Td>
                <Badge
                  colorScheme={getRiskColor(patient.riskLevel)}
                  variant="subtle"
                  px={2}
                  py={1}
                  borderRadius="md"
                  fontSize="xs"
                >
                  {patient.riskLevel}
                </Badge>
              </Td>
              
              <Td>
                <Text fontSize="sm" fontWeight="semibold">
                  {patient.readmissionProbability}
                </Text>
              </Td>
              
              <Td>
                <Text fontSize="sm">
                  {patient.lastAdmission}
                </Text>
              </Td>
              
              <Td>
                <Text fontSize="sm">
                  {patient.nextFollowUp}
                </Text>
              </Td>
              
              <Td>
                <Badge
                  colorScheme={getStatusColor(patient.status)}
                  variant="subtle"
                  px={2}
                  py={1}
                  borderRadius="md"
                  fontSize="xs"
                >
                  {patient.status}
                </Badge>
              </Td>
              
              <Td>
                <HStack spacing={1}>
                  <Tooltip label="View Details">
                    <IconButton
                      aria-label="View patient"
                      icon={<FaEye />}
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={() => onView(patient)}
                    />
                  </Tooltip>
                  
                  <Tooltip label="Edit Patient">
                    <IconButton
                      aria-label="Edit patient"
                      icon={<FaEdit />}
                      size="sm"
                      variant="ghost"
                      colorScheme="green"
                      onClick={() => onEdit(patient)}
                    />
                  </Tooltip>
                  
                  <Tooltip label="Delete Patient">
                    <IconButton
                      aria-label="Delete patient"
                      icon={<FaTrash />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => onDelete(patient)}
                    />
                  </Tooltip>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
