import React from "react";
import { Spinner, Center } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionCenter = motion(Center);

export default function Loader({ size = "xl", color = "blue.500" }) {
  return (
    <MotionCenter
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      height="200px"
    >
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color={color}
        size={size}
      />
    </MotionCenter>
  );
}
