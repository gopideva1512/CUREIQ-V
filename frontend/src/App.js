// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import theme from './theme';
import { HospitalProvider } from './contexts/HospitalContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PredictionForm from './pages/PredictionForm';
import PatientSamples from './pages/PatientSamples';
import CareCoordination from './pages/CareCoordination';
import Loader from './components/Loader';

// Protected Route Component
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <Loader />;
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      // Clear hospital selection on logout
      localStorage.removeItem('selectedHospital');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <ChakraProvider theme={theme}>
        <Loader />
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <HospitalProvider>
        <Router>
          <Navbar 
            isLoggedIn={!!user} 
            username={user?.email || ''} 
            onLogout={handleLogout} 
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/predict" element={
              <ProtectedRoute>
                <PredictionForm />
              </ProtectedRoute>
            } />
            <Route path="/patients" element={
              <ProtectedRoute>
                <PatientSamples />
              </ProtectedRoute>
            } />
            <Route path="/care" element={
              <ProtectedRoute>
                <CareCoordination />
              </ProtectedRoute>
            } />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </HospitalProvider>
    </ChakraProvider>
  );
}

export default App;
