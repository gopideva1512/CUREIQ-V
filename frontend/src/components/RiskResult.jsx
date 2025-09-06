import React from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Progress,
  Card,
  CardBody,
  CardHeader,
  Heading,
  List,
  ListItem,
  ListIcon,
  Divider,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaUserMd,
  FaPhone,
  FaCalendarAlt,
  FaPills,
  FaHeartbeat,
  FaShieldAlt,
  FaClock,
  FaChartLine,
  FaExclamationTriangle
} from "react-icons/fa";

const MotionCard = motion(Card);

export default function RiskResult({ score, risk, confidence, disease_type }) {
  const getRiskColor = (riskLevel) => {
    if (riskLevel?.toLowerCase().includes("high")) {
      return { bg: "red.50", border: "red.400", text: "red.600", progress: "red" };
    } else if (riskLevel?.toLowerCase().includes("medium")) {
      return { bg: "orange.50", border: "orange.400", text: "orange.600", progress: "orange" };
    } else {
      return { bg: "green.50", border: "green.400", text: "green.600", progress: "green" };
    }
  };

  const getRecommendations = (riskLevel) => {
    if (riskLevel?.toLowerCase().includes("high")) {
      return [
        "Schedule immediate follow-up within 24-48 hours",
        "Initiate intensive care coordination program",
        "Arrange home health services assessment",
        "Implement medication reconciliation and education",
        "Establish telehealth monitoring protocol",
        "Contact patient within 24 hours post-discharge"
      ];
    } else if (riskLevel?.toLowerCase().includes("medium")) {
      return [
        "Schedule follow-up appointment within 1 week",
        "Provide comprehensive discharge education",
        "Initiate medication adherence monitoring",
        "Arrange community resource connections",
        "Schedule telephone check-in within 72 hours"
      ];
    } else {
      return [
        "Provide standard discharge instructions",
        "Schedule routine follow-up appointment",
        "Give patient self-care education materials",
        "Provide emergency contact information"
      ];
    }
  };

  const getInterventionPriority = (score) => {
    if (score >= 0.7) return "URGENT";
    if (score >= 0.4) return "MODERATE";
    return "ROUTINE";
  };

  const riskColors = getRiskColor(risk);
  const recommendations = getRecommendations(risk);
  const interventionPriority = getInterventionPriority(score);

  return (
    <VStack spacing={6} align="stretch">
      {/* Main Risk Assessment Card */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        bg={riskColors.bg}
        borderColor={riskColors.border}
        borderWidth="2px"
      >
        <CardHeader>
          <VStack align="start" spacing={2}>
            <HStack>
              <Icon as={FaHeartbeat} color={riskColors.text} />
              <Heading size="md" color={riskColors.text}>
                Dynamic AI Risk Assessment
              </Heading>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              Ensemble ML prediction with 75%+ accuracy
            </Text>
          </VStack>
        </CardHeader>

        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* Risk Level Display */}
            <Box textAlign="center">
              <Badge
                colorScheme={riskColors.progress}
                fontSize="2xl"
                p={4}
                borderRadius="lg"
              >
                {interventionPriority}
              </Badge>
              <Text mt={2} fontSize="lg" fontWeight="bold" color={riskColors.text}>
                {risk}
              </Text>
            </Box>

            {/* Key Metrics */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Stat textAlign="center" bg="white" p={4} borderRadius="md">
                <StatLabel>Readmission Probability</StatLabel>
                <StatNumber color={riskColors.text}>{(score * 100).toFixed(1)}%</StatNumber>
                <StatHelpText>Ensemble ML Prediction</StatHelpText>
              </Stat>
              
              <Stat textAlign="center" bg="white" p={4} borderRadius="md">
                <StatLabel>Confidence Level</StatLabel>
                <StatNumber color="blue.600">{confidence}</StatNumber>
                <StatHelpText>Model Certainty</StatHelpText>
              </Stat>
              
              <Stat textAlign="center" bg="white" p={4} borderRadius="md">
                <StatLabel>Primary Condition</StatLabel>
                <StatNumber fontSize="md" color="purple.600">{disease_type}</StatNumber>
                <StatHelpText>Patient Diagnosis</StatHelpText>
              </Stat>
            </SimpleGrid>

            {/* Risk Progress Bar */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold">Risk Score</Text>
                <Text fontWeight="bold">{(score * 100).toFixed(1)}%</Text>
              </HStack>
              <Progress
                value={score * 100}
                colorScheme={riskColors.progress}
                size="lg"
                borderRadius="md"
                bg="gray.100"
              />
              <HStack justify="space-between" mt={1} fontSize="xs" color="gray.500">
                <Text>Low Risk (0-40%)</Text>
                <Text>Medium Risk (40-70%)</Text>
                <Text>High Risk (70-100%)</Text>
              </HStack>
            </Box>
          </VStack>
        </CardBody>
      </MotionCard>

      {/* Recommendations Card */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CardHeader>
          <HStack>
            <Icon as={FaUserMd} color="blue.500" />
            <Heading size="md">Recommended Interventions</Heading>
          </HStack>
        </CardHeader>
        <CardBody>
          <List spacing={3}>
            {recommendations.map((rec, index) => (
              <ListItem key={index}>
                <ListIcon as={FaCheckCircle} color={riskColors.text} />
                {rec}
              </ListItem>
            ))}
          </List>
        </CardBody>
      </MotionCard>

      {/* Action Items Card */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <CardHeader>
          <HStack>
            <Icon as={FaClock} color="orange.500" />
            <Heading size="md">Immediate Action Items</Heading>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" p={3} bg="blue.50" borderRadius="md">
              <HStack>
                <Icon as={FaPhone} color="blue.500" />
                <Text>Care Coordinator Contact</Text>
              </HStack>
              <Badge colorScheme="blue">
                {score >= 0.7 ? "Within 2 hours" : score >= 0.4 ? "Within 24 hours" : "As needed"}
              </Badge>
            </HStack>
            
            <HStack justify="space-between" p={3} bg="green.50" borderRadius="md">
              <HStack>
                <Icon as={FaPills} color="green.500" />
                <Text>Medication Review</Text>
              </HStack>
              <Badge colorScheme="green">
                {score >= 0.7 ? "Today" : "Within 48 hours"}
              </Badge>
            </HStack>
            
            <HStack justify="space-between" p={3} bg="purple.50" borderRadius="md">
              <HStack>
                <Icon as={FaCalendarAlt} color="purple.500" />
                <Text>Follow-up Appointment</Text>
              </HStack>
              <Badge colorScheme="purple">
                {score >= 0.7 ? "24-48 hours" : score >= 0.4 ? "1 week" : "2 weeks"}
              </Badge>
            </HStack>
          </VStack>
        </CardBody>
      </MotionCard>

      {/* Model Information */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        bg="gray.50"
      >
        <CardHeader>
          <HStack>
            <Icon as={FaChartLine} color="gray.600" />
            <Heading size="md">Model Information</Heading>
          </HStack>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold" color="gray.700">Ensemble Methods:</Text>
              <Text fontSize="sm">• Logistic Regression</Text>
              <Text fontSize="sm">• Random Forest Classifier</Text>
              <Text fontSize="sm">• Gradient Boosting</Text>
            </VStack>
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold" color="gray.700">Dynamic Features:</Text>
              <Text fontSize="sm">• 38 clinical parameters</Text>
              <Text fontSize="sm">• Disease-specific factors</Text>
              <Text fontSize="sm">• Real-time prediction</Text>
            </VStack>
          </SimpleGrid>
        </CardBody>
      </MotionCard>
    </VStack>
  );
}
