import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  FormErrorMessage,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Text,
  useColorModeValue,
  Card,
  CardBody,
  SimpleGrid,
  useToast,
  Icon,
  Badge,
  Spinner,
  Center
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaHospital,
  FaCheckCircle
} from "react-icons/fa";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useHospital } from "../contexts/HospitalContext";

const MotionCard = motion(Card);

export default function Login({ onLogin }) {
  const [errorMsg, setErrorMsg] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  const navigate = useNavigate();
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const { setCurrentHospital } = useHospital();

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const hospitalsCollection = collection(db, 'Hospital');
      const hospitalsSnapshot = await getDocs(hospitalsCollection);
      const hospitalsList = hospitalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHospitals(hospitalsList);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setErrorMsg('Failed to load hospitals. Please try again.');
    } finally {
      setLoadingHospitals(false);
    }
  };

// src/pages/Login.jsx - Only modify the handleHospitalSelect function
const handleHospitalSelect = (hospital) => {
  setSelectedHospital(hospital);
  setCurrentHospital(hospital); // This now automatically saves to localStorage
  setShowLoginForm(true);
  setErrorMsg("");
};

  const formik = useFormik({
    initialValues: {
      email: "",
      password: ""
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Enter a valid email").required("Email required"),
      password: Yup.string().min(6, "Minimum 6 characters").required("Password required")
    }),
    onSubmit: async (values, actions) => {
      setErrorMsg("");
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        
        if (onLogin) onLogin(user);
        
        toast({
          title: "Login Successful",
          description: `Welcome to ${selectedHospital.name}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        navigate("/dashboard");
      } catch (error) {
        let errorMessage = "Login failed. Please try again.";
        
        switch (error.code) {
          case 'auth/invalid-credential':
            errorMessage = "Invalid email or password. Please check your credentials.";
            break;
          case 'auth/user-not-found':
            errorMessage = "No account found with this email address.";
            break;
          case 'auth/wrong-password':
            errorMessage = "Incorrect password. Please try again.";
            break;
          default:
            errorMessage = error.message;
        }
        
        setErrorMsg(errorMessage);
        actions.setSubmitting(false);
      }
    }
  });

  if (loadingHospitals) {
    return (
      <Center minH="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading hospitals...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" p={4}>
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        w="full"
        maxW="600px"
        bg={cardBg}
        shadow="xl"
        borderRadius="xl"
      >
        <CardBody p={8}>
          {!showLoginForm ? (
            // Hospital Selection View
            <VStack spacing={6}>
              <VStack spacing={4} textAlign="center">
                <Icon as={FaHospital} boxSize={12} color="blue.500" />
                <Heading size="lg">Select Your Hospital</Heading>
                <Text color="gray.600">
                  Choose your hospital to access the healthcare analytics dashboard
                </Text>
              </VStack>

              {errorMsg && (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  {errorMsg}
                </Alert>
              )}

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                {hospitals.map((hospital) => (
                  <MotionCard
                    key={hospital.id}
                    cursor="pointer"
                    onClick={() => handleHospitalSelect(hospital)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    border="2px"
                    borderColor="gray.200"
                    _hover={{ borderColor: "blue.400", shadow: "md" }}
                    transition="all 0.2s"
                  >
                    <CardBody textAlign="center" py={6}>
                      <VStack spacing={3}>
                        <Icon as={FaHospital} boxSize={8} color="blue.500" />
                        <VStack spacing={1}>
                          <Text fontWeight="bold" fontSize="lg">
                            {hospital.name}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {hospital.location || 'Healthcare Provider'}
                          </Text>
                        </VStack>
                        <Badge colorScheme="blue" variant="subtle">
                          Click to Login
                        </Badge>
                      </VStack>
                    </CardBody>
                  </MotionCard>
                ))}
              </SimpleGrid>
            </VStack>
          ) : (
            // Login Form View
            <VStack spacing={6}>
              <VStack spacing={4} textAlign="center">
                <HStack>
                  <Icon as={FaHospital} boxSize={8} color="blue.500" />
                  <VStack align="start" spacing={0}>
                    <Heading size="lg">{selectedHospital.name}</Heading>
                    <Text color="gray.600">Healthcare Login</Text>
                  </VStack>
                </HStack>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLoginForm(false)}
                  leftIcon={<Icon as={FaHospital} />}
                >
                  Change Hospital
                </Button>
              </VStack>

              {errorMsg && (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  {errorMsg}
                </Alert>
              )}

              <form onSubmit={formik.handleSubmit} style={{ width: '100%' }}>
                <VStack spacing={6} w="full">
                  <FormControl isInvalid={formik.errors.email && formik.touched.email}>
                    <FormLabel>Email Address</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Enter your hospital email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FormErrorMessage>{formik.errors.email}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={formik.errors.password && formik.touched.password}>
                    <FormLabel>Password</FormLabel>
                    <Input
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <FormErrorMessage>{formik.errors.password}</FormErrorMessage>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    isLoading={formik.isSubmitting}
                    loadingText="Signing In..."
                    leftIcon={<Icon as={FaCheckCircle} />}
                  >
                    Sign In to {selectedHospital.name}
                  </Button>
                </VStack>
              </form>
            </VStack>
          )}

          <VStack mt={8} spacing={2}>
            <Text fontSize="xs" color="gray.500" textAlign="center">
              © 2024 CureIQ Healthcare Analytics
            </Text>
          </VStack>
        </CardBody>
      </MotionCard>
    </Box>
  );
}
