// src/contexts/HospitalContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const HospitalContext = createContext();

export function useHospital() {
  return useContext(HospitalContext);
}

export function HospitalProvider({ children }) {
  const [currentHospital, setCurrentHospital] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load saved hospital from localStorage on component mount
  useEffect(() => {
    const savedHospital = localStorage.getItem('selectedHospital');
    if (savedHospital) {
      try {
        const hospitalData = JSON.parse(savedHospital);
        setCurrentHospital(hospitalData);
      } catch (error) {
        console.error('Error parsing saved hospital:', error);
        localStorage.removeItem('selectedHospital');
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      // If user is logged out, clear hospital data
      if (!user) {
        setCurrentHospital(null);
        localStorage.removeItem('selectedHospital');
      }
    });

    return unsubscribe;
  }, []);

  // Enhanced setCurrentHospital function that saves to localStorage
  const handleSetCurrentHospital = (hospital) => {
    setCurrentHospital(hospital);
    
    if (hospital) {
      // Save hospital to localStorage when set
      localStorage.setItem('selectedHospital', JSON.stringify(hospital));
    } else {
      // Remove from localStorage when cleared
      localStorage.removeItem('selectedHospital');
    }
  };

  const value = {
    currentHospital,
    setCurrentHospital: handleSetCurrentHospital,
    user,
    loading
  };

  return (
    <HospitalContext.Provider value={value}>
      {!loading && children}
    </HospitalContext.Provider>
  );
}
