import React from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Icon,
  Button,
  useColorModeValue,
  VStack,
  HStack,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import {
  FaHospital,
  FaHeartbeat,
  FaUserMd,
  FaChartPie,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const features = [
  {
    icon: FaHospital,
    title: "Hospital Readmission Insights",
    desc: "Predict and prevent costly 30-day readmissions using real-time clinical data and advanced AI algorithms.",
    color: "blue.400",
  },
  {
    icon: FaHeartbeat,
    title: "Smart Risk Scoring",
    desc: "Instant risk evaluation for every patient at discharge with personalized intervention recommendations.",
    color: "red.400",
  },
  {
    icon: FaUserMd,
    title: "Care Coordination",
    desc: "Seamless integration with EHRs to help doctors and care teams manage post-discharge patient care.",
    color: "green.400",
  },
  {
    icon: FaChartPie,
    title: "Live Dashboards",
    desc: "Powerful data visualizations and analytics for validation and evidence-based decision support.",
    color: "purple.400",
  },
];

const benefits = [
  "Reduce 30-day readmissions by 15%",
  "Minimize Medicare penalties under HRRP",
  "Improve patient outcomes and satisfaction",
  "Optimize resource allocation and costs",
  "Enhance care team coordination",
  "Provide evidence-based interventions",
];

export default function Landing() {
  const cardBg = useColorModeValue("white", "gray.800");

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Hero Section with Rich Gradient & Hospital Illustration */}
      <Box
        position="relative"
        h="100vh"
        bgGradient="linear(to-r, teal.500, blue.600, purple.700)"
        overflow="hidden"
      >
        {/* Subtle hospital illustration overlay */}
        <Box
          as="img"
          src="/assets/hospital-bg.svg" // put your illustration in public/assets
          alt="hospital theme"
          opacity={0.08}
          position="absolute"
          w="100%"
          h="100%"
          objectFit="cover"
          top="0"
          left="0"
          zIndex={-1}
        />

        {/* Dark overlay for contrast */}
        <Box
          bg="blackAlpha.600"
          w="100%"
          h="100%"
          position="absolute"
          top="0"
          left="0"
          zIndex={0}
        />

        {/* Hero Content */}
        <VStack
          spacing={6}
          position="relative"
          zIndex={1}
          textAlign="center"
          justify="center"
          h="100%"
          px={6}
        >
          <Badge colorScheme="pink" variant="solid" fontSize="sm" px={3} py={1}>
            AI-Powered Healthcare Analytics
          </Badge>
          <Heading
            size="4xl"
            fontWeight="bold"
            fontFamily="Poppins, sans-serif"
            color="white"
            textShadow="3px 3px 15px rgba(0,0,0,0.7)"
          >
            CureIQ
          </Heading>
          <Text fontSize="xl" maxW="3xl" color="gray.200">
            Transform hospital readmission management with advanced AI. Predict,
            prevent, and optimize patient care through data-driven insights and
            real-time risk assessment.
          </Text>
          <HStack spacing={4}>
            <Button
              as={Link}
              to="/dashboard"
              size="lg"
              bgGradient="linear(to-r, teal.400, blue.500)"
              color="white"
              rightIcon={<FaArrowRight />}
              _hover={{ transform: "scale(1.05)", boxShadow: "2xl" }}
              transition="all 0.3s"
            >
              Explore Dashboard
            </Button>
            <Button
              as={Link}
              to="/predict"
              size="lg"
              variant="outline"
              borderColor="white"
              color="white"
              _hover={{
                bg: "whiteAlpha.200",
                transform: "scale(1.05)",
                boxShadow: "2xl",
              }}
              transition="all 0.3s"
            >
              Try Risk Assessment
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Stats Section */}
      <Box maxW="7xl" mx="auto" px={6} py={16}>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} mb={16}>
          {[
            { num: "15%", label: "Reduction in Readmissions", color: "green.400" },
            { num: "$2.4M", label: "Cost Savings", color: "blue.400" },
            { num: "87%", label: "Prediction Accuracy", color: "purple.400" },
            { num: "2,847", label: "Patients Monitored", color: "orange.400" },
          ].map((stat, i) => (
            <MotionBox
              key={i}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Card bg={cardBg} shadow="xl" borderTop="6px solid" borderColor={stat.color}>
                <CardBody textAlign="center">
                  <Stat>
                    <StatNumber fontSize="3xl" color={stat.color}>
                      {stat.num}
                    </StatNumber>
                    <StatLabel>{stat.label}</StatLabel>
                    <StatHelpText>Validated AI results</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </MotionBox>
          ))}
        </SimpleGrid>

        {/* Features */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} mb={16}>
          {features.map((item, index) => (
            <MotionBox
              key={index}
              whileHover={{ y: -10, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                bgGradient={`linear(to-br, ${item.color}, pink.300)`}
                color="white"
                h="full"
              >
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <Icon as={item.icon} w={8} h={8} />
                    <Heading size="md">{item.title}</Heading>
                    <Text>{item.desc}</Text>
                  </VStack>
                </CardBody>
              </Card>
            </MotionBox>
          ))}
        </SimpleGrid>

        {/* Benefits & Risk Categories */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8} mb={16}>
          <Card bg={cardBg} shadow="xl">
            <CardHeader>
              <Heading size="md">Key Benefits</Heading>
            </CardHeader>
            <CardBody>
              <List spacing={3}>
                {benefits.map((benefit, index) => (
                  <ListItem key={index}>
                    <ListIcon as={FaCheckCircle} color="green.400" />
                    {benefit}
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>

          <Card bgGradient="linear(to-r, orange.100, red.100)" shadow="xl">
            <CardHeader>
              <Heading size="md">Risk Categories</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box p={4} borderLeft="4px" borderColor="red.500" bg="red.50" rounded="md">
                  <HStack justify="space-between">
                    <Text fontWeight="bold">High Risk</Text>
                    <Badge colorScheme="red">Immediate Action</Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Requires intensive follow-up and care coordination
                  </Text>
                </Box>
                <Box p={4} borderLeft="4px" borderColor="orange.500" bg="orange.50" rounded="md">
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Medium Risk</Text>
                    <Badge colorScheme="orange">Monitor Closely</Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Standard follow-up with enhanced monitoring
                  </Text>
                </Box>
                <Box p={4} borderLeft="4px" borderColor="green.500" bg="green.50" rounded="md">
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Low Risk</Text>
                    <Badge colorScheme="green">Routine Care</Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Standard discharge protocol with basic follow-up
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Call to Action */}
        <Box
          bgGradient="linear(to-r, teal.500, blue.600)"
          color="white"
          borderRadius="2xl"
          p={12}
          textAlign="center"
          shadow="2xl"
        >
          <VStack spacing={4}>
            <Heading size="lg">Ready to Transform Your Readmission Management?</Heading>
            <Text fontSize="lg">
              Join leading healthcare institutions using CureIQ to improve
              patient outcomes and reduce costs.
            </Text>
            <Button
              as={Link}
              to="/login"
              size="lg"
              bg="white"
              color="teal.600"
              _hover={{ bg: "gray.100", transform: "scale(1.05)" }}
              transition="all 0.3s"
            >
              Get Started Today
            </Button>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

