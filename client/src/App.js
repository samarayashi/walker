import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Map from './components/Map';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/map"
              element={
                <PrivateRoute>
                  <Map />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/map" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 