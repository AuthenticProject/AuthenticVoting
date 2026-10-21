import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { VoteKioskPage } from './pages/VoteKioskPage';
import { AdminPlaceholderPage } from './pages/AdminPlaceholderPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/vote" replace />} />
        <Route path="/vote" element={<VoteKioskPage />} />
        <Route path="/admin/*" element={<AdminPlaceholderPage />} />
        <Route path="*" element={<Navigate to="/vote" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
