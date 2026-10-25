import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ElectionProvider } from './context/ElectionContext';
import { VoteKioskPage } from './pages/VoteKioskPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminCandidatesPage } from './pages/admin/AdminCandidatesPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminResultsPage } from './pages/admin/AdminResultsPage';
import { AdminAnnouncementPage } from './pages/admin/AdminAnnouncementPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminKioskManagementPage } from './pages/admin/AdminKioskManagementPage';
import { AdminLayout } from './layouts/AdminLayout';

export function App() {
  return (
    <AuthProvider>
      <ElectionProvider>
        <BrowserRouter>
          <Routes>
            {/* Voter Kiosk Routes (Single Physical Tablet) */}
            <Route path="/" element={<Navigate to="/vote" replace />} />
            <Route path="/vote" element={<VoteKioskPage />} />

            {/* Administrator Authentication */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Dedicated Fullscreen Projector Announcement Routes (Phase 7) */}
            <Route path="/admin/announcement" element={<AdminAnnouncementPage />} />
            <Route path="/admin/announcement/:sessionId" element={<AdminAnnouncementPage />} />

            {/* Protected Administrator Dashboard */}
            <Route
              path="/admin"
              element={
                <AdminLayout>
                  <AdminOverviewPage />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/candidates"
              element={
                <AdminLayout>
                  <AdminCandidatesPage />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminLayout>
                  <AdminSettingsPage />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/kiosk"
              element={
                <AdminLayout>
                  <AdminKioskManagementPage />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/announcements"
              element={
                <AdminLayout>
                  <AdminAnnouncementsPage />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/results"
              element={
                <AdminLayout>
                  <AdminResultsPage />
                </AdminLayout>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/vote" replace />} />
          </Routes>
        </BrowserRouter>
      </ElectionProvider>
    </AuthProvider>
  );
}

export default App;
