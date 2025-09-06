import React from "react";
import { motion } from "framer-motion";
import { Box } from "@chakra-ui/react";

export default function AnimatedCard({ children, ...rest }) {
  return (
    <Box
      as={motion.div}
      whileHover={{ scale: 1.045, boxShadow: "0 10px 24px rgba(33,111,255,0.11)" }}
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      borderRadius="md"
      bg="white"
      shadow="base"
      p={5}
      {...rest}
    >
      {children}
    </Box>
  );
}
