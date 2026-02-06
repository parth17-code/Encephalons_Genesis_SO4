import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './utils/auth';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import SecretaryDashboard from './pages/SecretaryDashboard';
import ProofUpload from './pages/ProofUpload';
import AdminDashboard from './pages/AdminDashboard';
import AdminSocieties from './pages/AdminSocieties';
import AdminProofs from './pages/AdminProofs';
import ResidentSummary from './pages/ResidentSummary';
import Heatmap from './pages/Heatmap';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Secretary Routes */}
        <Route
          path="/secretary/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SECRETARY']}>
              <SecretaryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/secretary/upload-proof"
          element={
            <ProtectedRoute allowedRoles={['SECRETARY']}>
              <ProofUpload />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['BMC_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/societies"
          element={
            <ProtectedRoute allowedRoles={['BMC_ADMIN']}>
              <AdminSocieties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/proofs"
          element={
            <ProtectedRoute allowedRoles={['BMC_ADMIN']}>
              <AdminProofs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/heatmap"
          element={
            <ProtectedRoute allowedRoles={['BMC_ADMIN']}>
              <Heatmap />
            </ProtectedRoute>
          }
        />

        {/* Resident Routes */}
        <Route
          path="/resident/summary"
          element={
            <ProtectedRoute allowedRoles={['RESIDENT', 'SECRETARY']}>
              <ResidentSummary />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;