import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';

// Auth Flow Pages
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import CompleteProfile from './pages/CompleteProfile';

// Feature Pages
import OrganDonation from './pages/OrganDonation';
import AIAssistant from './pages/AIAssistant';

// Dashboards
import DonorDashboard from './dashboards/DonorDashboard';
import RequesterDashboard from './dashboards/RequesterDashboard';
import HospitalDashboard from './dashboards/HospitalDashboard';
import BloodBankDashboard from './dashboards/BloodBankDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased">
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Auth Flow */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Feature Pages (accessible when logged in or public) */}
          <Route path="/organ-donation" element={<OrganDonation />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />

          {/* Protected Role Dashboards */}
          <Route 
            path="/dashboard/donor" 
            element={
              <ProtectedRoute allowedRoles={['donor']}>
                <DonorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/requester" 
            element={
              <ProtectedRoute allowedRoles={['requester']}>
                <RequesterDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/hospital" 
            element={
              <ProtectedRoute allowedRoles={['hospital', 'admin']}>
                <HospitalDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/bloodbank" 
            element={
              <ProtectedRoute allowedRoles={['bloodbank', 'admin']}>
                <BloodBankDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
