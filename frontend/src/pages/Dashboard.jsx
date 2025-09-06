import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Text,
  Badge,
  HStack,
  VStack,
  Card,
  CardBody,
  CardHeader,
  Icon,
  useColorModeValue,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Flex,
  Container,
  Divider,
  Button,
  useToast,
} from "@chakra-ui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  Cell,
} from "recharts";
import {
  FaDollarSign,
  FaCheckCircle,
  FaHeartbeat,
  FaHospital,
  FaUsers,
  FaCalendarAlt,
  FaSyncAlt,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useHospital } from "../contexts/HospitalContext";
import { hospitalService } from "../services/hospitalService";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

// Cost Savings Data Processing Function
const processCostSavingsData = (csvData) => {
  if (!csvData || csvData.length === 0) return { costSavingsData: [], costMetrics: {} };

  // Filter readmitted patients for cost analysis
  const readmittedPatients = csvData.filter(patient => patient.readmitted_30_days === 1);
  const nonReadmittedPatients = csvData.filter(patient => patient.readmitted_30_days === 0);

  // Calculate monthly cost savings data
  const costSavingsData = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  months.forEach((month, index) => {
    // Simulate monthly data distribution
    const monthlyReadmitted = readmittedPatients.filter((_, i) => i % 12 === index);
    const monthlyNonReadmitted = nonReadmittedPatients.filter((_, i) => i % 12 === index);
    
    const actualSavings = monthlyReadmitted.reduce((sum, patient) => sum + (patient.cost_savings || 0), 0) +
                         monthlyNonReadmitted.reduce((sum, patient) => sum + (patient.cost_savings || 0), 0);
    
    const baselineCosts = monthlyReadmitted.reduce((sum, patient) => sum + (patient.baseline_cost || 0), 0) +
                         monthlyNonReadmitted.reduce((sum, patient) => sum + (patient.baseline_cost || 0), 0);
    
    const targetSavings = baselineCosts * 0.15; // 15% target

    costSavingsData.push({
      month,
      actualSavings: Math.abs(actualSavings),
      targetSavings,
      baselineCosts,
      savingsRate: baselineCosts > 0 ? (Math.abs(actualSavings) / baselineCosts * 100).toFixed(1) : 0
    });
  });

  // Calculate overall cost metrics
  const totalActualSavings = csvData.reduce((sum, patient) => sum + Math.abs(patient.cost_savings || 0), 0);
  const totalBaselineCosts = csvData.reduce((sum, patient) => sum + (patient.baseline_cost || 0), 0);
  const totalTargetSavings = totalBaselineCosts * 0.15;
  const actualSavingsRate = totalBaselineCosts > 0 ? (totalActualSavings / totalBaselineCosts * 100) : 0;
  const targetAchievement = totalTargetSavings > 0 ? (totalActualSavings / totalTargetSavings * 100) : 0;

  // Readmission impact analysis
  const readmissionCostImpact = readmittedPatients.reduce((sum, patient) => 
    sum + (patient.readmission_cost || 0), 0);
  
  const costMetrics = {
    totalActualSavings,
    totalTargetSavings,
    actualSavingsRate: actualSavingsRate.toFixed(1),
    targetAchievement: targetAchievement.toFixed(1),
    readmissionCostImpact,
    potentialSavings: totalTargetSavings - totalActualSavings
  };

  return { costSavingsData, costMetrics };
};

// Custom label component for the pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="14"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { currentHospital } = useHospital();
  const unsubscribeRef = useRef(null);
  const toast = useToast();

  // All useColorModeValue hooks at the top level
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const greenBg = useColorModeValue("green.50", "green.900");
  const blueBg = useColorModeValue("blue.50", "blue.900");
  const purpleBg = useColorModeValue("purple.50", "purple.900");
  const orangeBg = useColorModeValue("orange.50", "orange.900");

  // Process CSV data and update state
  const processAndSetData = useCallback((csvData) => {
    if (!csvData || csvData.length === 0) {
      setError(`No data found for ${currentHospital?.name || "selected hospital"}`);
      setDashboardData(null);
      setLoading(false);
      return;
    }

    try {
      // Process standard dashboard data
      const processedData = hospitalService.processCsvDataForDashboard(csvData);
      
      // Process cost savings data
      const { costSavingsData, costMetrics } = processCostSavingsData(csvData);
      
      setDashboardData({
        ...processedData,
        costSavingsData,
        costMetrics,
        hospitalName: currentHospital.name,
        hospitalLocation: currentHospital.location || "",
        lastUpdated: new Date().toLocaleString(),
        dataSourceCount: csvData.length,
        costSavingsTargetPercent: 15,
      });

      setError(null);
      setLastRefresh(new Date().toLocaleString());
    } catch (err) {
      console.error("Error processing CSV data:", err);
      setError("Error processing hospital data");
    } finally {
      setLoading(false);
    }
  }, [currentHospital]);

  // Setup data fetching w/ listener and connection tracking
  const setupDataFetching = useCallback(async () => {
    if (!currentHospital?.id) {
      setError("No hospital selected");
      setLoading(false);
      return;
    }

    if (isConnected && unsubscribeRef.current) {
      console.log("Already connected to hospital:", currentHospital.id);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        setIsConnected(false);
      }

      const initialData = await hospitalService.getHospitalCsvData(currentHospital.id);
      processAndSetData(initialData);

      unsubscribeRef.current = hospitalService.listenToCsvData(currentHospital.id, processAndSetData);

      if (!isConnected && initialData && initialData.length > 0) {
        toast({
          title: "Dashboard Connected",
          description: `Real-time data monitoring for ${currentHospital.name}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setIsConnected(true);
      }
    } catch (err) {
      console.error("Error setting up data fetching:", err);
      setError(`Failed to load data for ${currentHospital?.name}. ${err.message}`);
      setLoading(false);
      setIsConnected(false);
    }
  }, [currentHospital, processAndSetData, toast, isConnected]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    if (!currentHospital?.id) return;
    setLoading(true);
    try {
      const freshData = await hospitalService.getHospitalCsvData(currentHospital.id);
      processAndSetData(freshData);
      toast({
        title: "Data Refreshed",
        description: "Dashboard data has been updated",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [currentHospital, processAndSetData, toast]);

  useEffect(() => {
    if (currentHospital?.id) {
      setupDataFetching();
    } else {
      setIsConnected(false);
      setDashboardData(null);
      setError("No hospital selected");
      setLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        setIsConnected(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHospital?.id]);

  // Loading state UI
  if (loading && !dashboardData) {
    return (
      <Box minH="calc(100vh - 80px)" bg={bgColor}>
        <Center h="calc(100vh - 80px)">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text color={textColor} fontSize="lg">
              Loading {currentHospital?.name || "hospital"} dashboard...
            </Text>
            <Text color="gray.500" fontSize="sm">
              Setting up real-time data connection
            </Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  // Error state UI
  if (error && !dashboardData) {
    return (
      <Box minH="calc(100vh - 80px)" bg={bgColor} p={8}>
        <Container maxW="6xl">
          <Alert status="error" borderRadius="lg" mb={4}>
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Dashboard Error</Text>
              <Text fontSize="sm">{error}</Text>
            </Box>
          </Alert>

          <Card bg={cardBg} mt={4}>
            <CardBody>
              <VStack spacing={4}>
                <Icon as={FaHospital} boxSize={12} color="red.400" />
                <Text textAlign="center" color={textColor}>
                  Unable to load dashboard data for {currentHospital?.name}
                </Text>
                <VStack align="start" spacing={2} fontSize="sm" color="gray.600">
                  <Text>• Ensure hospital data exists in Firestore</Text>
                  <Text>• Check Firebase connection</Text>
                  <Text>• Verify CSV data at: /Hospital/{currentHospital?.id}/csv_data</Text>
                </VStack>
                <Button colorScheme="blue" onClick={handleRefresh} leftIcon={<FaSyncAlt />}>
                  Retry
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  // Main dashboard layout
  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="8xl" py={6}>
        <VStack spacing={6} align="stretch">
          {/* Header Section */}
          <MotionBox initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <VStack align="start" spacing={2}>
                <HStack>
                  <Icon as={FaHospital} boxSize={8} color="blue.500" />
                  <VStack align="start" spacing={0}>
                    <Heading size="xl" color={textColor}>
                      {dashboardData?.hospitalName}
                    </Heading>
                    <Text color="gray.500" fontSize="md">
                      Healthcare Analytics Dashboard
                    </Text>
                    {dashboardData?.hospitalLocation && (
                      <Text color="gray.400" fontSize="sm">
                        📍 {dashboardData.hospitalLocation}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </VStack>

              <VStack align="end" spacing={1}>
                <HStack>
                  <Badge colorScheme="green" variant="solid" px={3} py={1} borderRadius="md">
                    Live Data
                  </Badge>
                  <Button size="sm" leftIcon={<FaSyncAlt />} onClick={handleRefresh} isLoading={loading} variant="outline">
                    Refresh
                  </Button>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  Updated: {lastRefresh || dashboardData?.lastUpdated}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Records: {dashboardData?.dataSourceCount?.toLocaleString()}
                </Text>
              </VStack>
            </Flex>
          </MotionBox>

          <Divider borderColor={borderColor} />

          {/* Key Metrics Grid */}
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4, xl: 8 }} spacing={4}>
            <MetricCard
              title="Total Patients"
              value={dashboardData?.totalPatients?.toLocaleString()}
              icon={FaUsers}
              color="blue.500"
              subtitle="Active records"
              cardBg={cardBg}
              borderColor={borderColor}
            />
            <MetricCard
              title="Readmission Rate"
              value={`${dashboardData?.readmissionRate}%`}
              icon={FaCheckCircle}
              color="red.500"
              subtitle={`${dashboardData?.readmissionCount} readmissions`}
              cardBg={cardBg}
              borderColor={borderColor}
            />
            <MetricCard
              title="Avg. Cost"
              value={`$${dashboardData?.avgCost?.toLocaleString()}`}
              icon={FaDollarSign}
              color="green.500"
              subtitle="Per patient"
              cardBg={cardBg}
              borderColor={borderColor}
            />
            <MetricCard
              title="Total Savings"
              value={`$${dashboardData?.costMetrics?.totalActualSavings?.toLocaleString()}`}
              icon={FaDollarSign}
              color="green.600"
              subtitle="Achieved"
              cardBg={cardBg}
              borderColor={borderColor}
            />
            <MetricCard
              title="Savings Rate"
              value={`${dashboardData?.costMetrics?.actualSavingsRate}%`}
              icon={FaChartLine}
              color="purple.500"
              subtitle="Actual vs baseline"
              cardBg={cardBg}
              borderColor={borderColor}
            />
            <MetricCard
              title="Target Achievement"
              value={`${dashboardData?.costMetrics?.targetAchievement}%`}
              icon={dashboardData?.costMetrics?.targetAchievement >= 100 ? FaArrowUp : FaArrowDown}
              color={dashboardData?.costMetrics?.targetAchievement >= 100 ? "green.500" : "orange.500"}
              subtitle="Of 15% target"
              cardBg={cardBg}
              borderColor={borderColor}
            />
            <MetricCard
              title="Avg. Age"
              value={`${dashboardData?.avgAge} years`}
              icon={FaCalendarAlt}
              color="purple.500"
              subtitle="Patient average"
              cardBg={cardBg}
              borderColor={borderColor}
            />
            <MetricCard
              title="ICU Stay Rate"
              value={`${dashboardData?.icuStayPercentage}%`}
              icon={FaHeartbeat}
              color="pink.500"
              subtitle="Critical care"
              cardBg={cardBg}
              borderColor={borderColor}
            />
          </SimpleGrid>

          {/* First Row of Charts - Diagnosis and Risk Distribution */}
          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
            {/* Patient Distribution by Diagnosis */}
            <ChartCard
              title="Patient Distribution by Diagnosis"
              subtitle={`Top conditions treated at ${dashboardData?.hospitalName}`}
              cardBg={cardBg}
              borderColor={borderColor}
              textColor={textColor}
            >
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={dashboardData?.diagnosisData?.slice(0, 8)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <XAxis
                    dataKey="diagnosis"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={11}
                    interval={0}
                  />
                  <YAxis fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: cardBg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {dashboardData?.diagnosisData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Risk Distribution - Enhanced Attractive Pie Chart */}
            <ChartCard
              title="Risk Distribution"
              subtitle="Patient risk levels based on readmission probability"
              cardBg={cardBg}
              borderColor={borderColor}
              textColor={textColor}
            >
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <defs>
                    <linearGradient id="highRiskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="mediumRiskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFD93D" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="lowRiskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <Pie
                    data={[
                      {
                        name: "High Risk",
                        value: Math.round((dashboardData?.readmissionCount || 0) * 0.6),
                        color: "url(#highRiskGradient)",
                        description: "Patients with high readmission probability"
                      },
                      {
                        name: "Medium Risk", 
                        value: Math.round((dashboardData?.totalPatients || 0) * 0.25),
                        color: "url(#mediumRiskGradient)",
                        description: "Patients with moderate readmission risk"
                      },
                      {
                        name: "Low Risk",
                        value: Math.round((dashboardData?.totalPatients || 0) * 0.65),
                        color: "url(#lowRiskGradient)", 
                        description: "Patients with low readmission risk"
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={130}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="none"
                    paddingAngle={2}
                  >
                    <Cell fill="url(#highRiskGradient)" />
                    <Cell fill="url(#mediumRiskGradient)" />
                    <Cell fill="url(#lowRiskGradient)" />
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value.toLocaleString()} patients`, 
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: cardBg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: "20px",
                      fontSize: "12px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </SimpleGrid>

          {/* Second Row - Full Width Cost Savings Analysis Chart */}
          <SimpleGrid columns={{ base: 1 }} spacing={6}>
            <ChartCard
              title="Cost Savings Analysis - Post Readmission Impact"
              subtitle={`Monthly cost savings vs 15% target - Actual savings: $${dashboardData?.costMetrics?.totalActualSavings?.toLocaleString()}`}
              cardBg={cardBg}
              borderColor={borderColor}
              textColor={textColor}
            >
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart
                  data={dashboardData?.costSavingsData || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                  />
                  <YAxis 
                    yAxisId="left"
                    fontSize={12}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}K`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    fontSize={12}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Savings Rate %') return `${value}%`;
                      return `$${Number(value).toLocaleString()}`;
                    }}
                    contentStyle={{
                      backgroundColor: cardBg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="actualSavings"
                    name="Actual Savings"
                    fill="#38A169"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="targetSavings"
                    name="Target Savings (15%)"
                    fill="#3182CE"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="savingsRate"
                    name="Savings Rate %"
                    stroke="#E53E3E"
                    strokeWidth={3}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </SimpleGrid>

          {/* Third Row - Length of Stay and Monthly Trends */}
          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
            <ChartCard
              title="Length of Stay Distribution"
              subtitle="Hospital stay duration patterns affecting costs"
              cardBg={cardBg}
              borderColor={borderColor}
              textColor={textColor}
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData?.lengthOfStayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="duration" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Monthly Admission Trends"
              subtitle="Admission patterns impacting cost savings"
              cardBg={cardBg}
              borderColor={borderColor}
              textColor={textColor}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData?.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="admissions"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Total Admissions"
                  />
                  <Line
                    type="monotone"
                    dataKey="readmissions"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Readmissions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </SimpleGrid>

          {/* Cost Savings Insights */}
          <Card bg={cardBg} shadow="lg" borderRadius="xl" border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color={textColor}>
                Cost Savings Insights
              </Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <VStack align="start" p={4} bg={greenBg} borderRadius="md">
                  <Text fontSize="sm" color="gray.600" fontWeight="semibold">Potential Additional Savings</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">
                    ${dashboardData?.costMetrics?.potentialSavings?.toLocaleString()}
                  </Text>
                  <Text fontSize="xs" color="gray.500">If 15% target achieved</Text>
                </VStack>
                
                <VStack align="start" p={4} bg={blueBg} borderRadius="md">
                  <Text fontSize="sm" color="gray.600" fontWeight="semibold">Avg Cost per Readmission</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                    ${((dashboardData?.costMetrics?.readmissionCostImpact || 0) / (dashboardData?.readmissionCount || 1)).toLocaleString()}
                  </Text>
                  <Text fontSize="xs" color="gray.500">Additional cost burden</Text>
                </VStack>
                
                <VStack align="start" p={4} bg={purpleBg} borderRadius="md">
                  <Text fontSize="sm" color="gray.600" fontWeight="semibold">ROI on Interventions</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                    {((dashboardData?.costMetrics?.totalActualSavings || 0) / 100000 * 100).toFixed(1)}%
                  </Text>
                  <Text fontSize="xs" color="gray.500">Return on investment</Text>
                </VStack>
                
                <VStack align="start" p={4} bg={orangeBg} borderRadius="md">
                  <Text fontSize="sm" color="gray.600" fontWeight="semibold">Target Gap</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                    {(100 - parseFloat(dashboardData?.costMetrics?.targetAchievement || 0)).toFixed(1)}%
                  </Text>
                  <Text fontSize="xs" color="gray.500">Below 15% target</Text>
                </VStack>
              </SimpleGrid>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

function MetricCard({ title, value, icon: IconComponent, color, subtitle, cardBg, borderColor }) {
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      bg={cardBg}
      shadow="md"
      borderRadius="xl"
      border="1px"
      borderColor={borderColor}
      _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
      transition="all 0.2s"
    >
      <CardBody p={4}>
        <Stat>
          <HStack justify="space-between" mb={2}>
            <StatLabel
              fontSize="sm"
              color="gray.600"
              fontWeight="medium"
              noOfLines={1}
            >
              {title}
            </StatLabel>
            <Icon as={IconComponent} color={color} boxSize={4} />
          </HStack>
          <StatNumber fontSize="2xl" fontWeight="bold" mb={1} noOfLines={1}>
            {value}
          </StatNumber>
          <StatHelpText fontSize="xs" color="gray.500" m={0}>
            {subtitle}
          </StatHelpText>
        </Stat>
      </CardBody>
    </MotionCard>
  );
}

function ChartCard({ title, subtitle, children, cardBg, borderColor, textColor }) {
  return (
    <MotionCard
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      bg={cardBg}
      shadow="lg"
      borderRadius="xl"
      border="1px"
      borderColor={borderColor}
    >
      <CardHeader pb={2}>
        <VStack align="start" spacing={1}>
          <Heading size="md" color={textColor}>
            {title}
          </Heading>
          <Text fontSize="sm" color="gray.500">
            {subtitle}
          </Text>
        </VStack>
      </CardHeader>
      <CardBody pt={0}>{children}</CardBody>
    </MotionCard>
  );
}
