import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AerosProvider } from './context/AerosContext';
import { SystemDashboard } from './components/SystemDashboard';
import { HospitalDashboard } from './components/HospitalDashboard';

export default function App() {
  return (
    <AerosProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/system" replace />} />
          <Route path="/system" element={<SystemDashboard />} />
          <Route path="/hospital" element={<HospitalDashboard />} />
          <Route path="*" element={<Navigate to="/system" replace />} />
        </Routes>
      </BrowserRouter>
    </AerosProvider>
  );
}
