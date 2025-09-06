import React from "react";
import { Box, Flex, Spacer, Button, Text, HStack, Avatar, Menu, MenuButton, MenuList, MenuItem, Icon, useColorModeValue } from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";
import { FaHospital, FaChartLine, FaUserMd, FaUsers, FaHandshake, FaSignOutAlt, FaUser } from "react-icons/fa";

const navItems = [
  { label: "Home", to: "/", icon: FaHospital },
  { label: "Dashboard", to: "/dashboard", icon: FaChartLine },
  { label: "Predict Risk", to: "/predict", icon: FaUserMd },
  { label: "Patients", to: "/patients", icon: FaUsers },
  { label: "Care Coordination", to: "/care", icon: FaHandshake }
];

export default function Navbar({ isLoggedIn, username, onLogout }) {
  const location = useLocation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box bg={bgColor} borderBottom="1px" borderColor={borderColor} shadow="sm" position="sticky" top={0} zIndex={10}>
      <Flex maxW="container.xl" mx="auto" align="center" px={4} py={3}>
        <Link to="/">
          <HStack spacing={3}>
            <Icon as={FaHospital} color="brand.500" boxSize={6} />
            <Text fontWeight={700} color="brand.600" fontSize="xl">
              CureIQ
            </Text>
            <Text fontSize="xs" color="gray.500" fontWeight={500}>
              Healthcare Analytics
            </Text>
          </HStack>
        </Link>
        <Spacer />
        {isLoggedIn && (
          <HStack spacing={1}>
            {navItems.map((item) => (
              <Button
                as={Link}
                key={item.to}
                to={item.to}
                variant={location.pathname === item.to ? "solid" : "ghost"}
                colorScheme="brand"
                size="sm"
                leftIcon={<Icon as={item.icon} />}
                borderRadius="lg"
                _hover={{
                  bg: location.pathname === item.to ? "brand.600" : "gray.100",
                  transform: "translateY(-1px)",
                }}
                transition="all 0.2s"
              >
                {item.label}
              </Button>
            ))}
          </HStack>
        )}
        <Spacer />
        {isLoggedIn ? (
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              borderRadius="full"
              _hover={{ bg: "gray.100" }}
            >
              <HStack spacing={2}>
                <Avatar size="sm" name={username} bg="brand.500" />
                <Text fontWeight={500} fontSize="sm" color="gray.700">
                  {username}
                </Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FaUser />}>
                Profile
              </MenuItem>
              <MenuItem icon={<FaSignOutAlt />} onClick={onLogout} color="red.500">
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Button as={Link} to="/login" colorScheme="brand" size="sm" borderRadius="lg">
            Login
          </Button>
        )}
      </Flex>
    </Box>
  );
}
