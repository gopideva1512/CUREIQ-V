import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  List,
  ListItem,
  ListIcon,
  Button,
  useDisclosure
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { CheckCircleIcon } from "@chakra-ui/icons";
import axios from "axios";

export default function FeatureModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    if (isOpen && features.length === 0) {
      axios.get("/api/heart/features").then(res => setFeatures(res.data.features || []));
    }
  }, [isOpen, features.length]);

  return (
    <>
      <Button size="sm" variant="outline" colorScheme="blue" onClick={onOpen}>
        Show ML Features
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} motionPreset="slideInBottom">
        <ModalOverlay />
        <ModalContent as={motion.div} initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <ModalHeader>Required Features for CureIQ Model</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <List spacing={3}>
              {features.map((feat, idx) => (
                <ListItem
                  as={motion.div}
                  key={feat}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * idx }}
                  fontWeight={feat.startsWith("age") ? "bold" : undefined}
                >
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  {feat}
                </ListItem>
              ))}
            </List>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
