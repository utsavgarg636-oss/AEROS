import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AerosProvider } from './context/AerosContext';
import { MainLayout } from './components/MainLayout';

export default function App() {
  return (
    <AerosProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/system" replace />} />
          <Route path="/system" element={<MainLayout />} />
          <Route path="/hospital" element={<MainLayout />} />
          <Route path="/status" element={<MainLayout />} />
          <Route path="/events" element={<MainLayout />} />
          <Route path="*" element={<Navigate to="/system" replace />} />
        </Routes>
      </BrowserRouter>
    </AerosProvider>
  );
}
