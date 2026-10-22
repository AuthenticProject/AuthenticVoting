import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-kiosk flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-navy-primary border-t-gold-accent rounded-full animate-spin" />
          <p className="text-sm font-bold text-navy-primary">Memeriksa sesi administrator...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // Derive dynamic page title
  const getPageTitle = (pathname: string): string => {
    if (pathname.includes('/admin/candidates')) return 'Manajemen Kandidat';
    if (pathname.includes('/admin/settings')) return 'Pengaturan Voting';
    if (pathname.includes('/admin/results')) return 'Hasil Akhir Pemilihan';
    return 'Dashboard Ikhtisar';
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-kiosk flex">
      {/* Sidebar Navigation */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Administrative Content Column - Scrollable */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        <AdminTopNav
          title={getPageTitle(location.pathname)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto pb-24">
          {children}
        </main>
      </div>
    </div>
  );
};
