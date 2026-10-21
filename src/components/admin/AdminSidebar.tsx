import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  Award,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useElection } from '../../hooks/useElection';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { election } = useElection();

  const navItems = [
    {
      to: '/admin',
      end: true,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/admin/candidates',
      label: 'Kandidat',
      icon: Users,
    },
    {
      to: '/admin/settings',
      label: 'Pengaturan Voting',
      icon: Settings,
    },
    {
      to: '/admin/results',
      label: 'Hasil Akhir',
      icon: Award,
    },
  ];

  const statusBadge = {
    draft: { label: 'Draft', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    active: { label: 'Voting Aktif', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    closed: { label: 'Voting Ditutup', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  }[election.status];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-navy-primary text-white border-r border-navy-light/40">
      {/* Brand Header */}
      <div className="p-6 border-b border-navy-light/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo src={election.logo_url} size="sm" />
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-white leading-tight">
              E-Voting Admin
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                {statusBadge.label}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-secondary"
          aria-label="Tutup menu navigasi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Menu Utama
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-150
                ${
                  isActive
                    ? 'bg-gold-accent text-navy-900 font-extrabold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-navy-secondary'
                }
              `}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Quick Kiosk Link */}
      <div className="p-4 border-t border-navy-light/30 space-y-2">
        <Link
          to="/vote"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-navy-secondary hover:bg-navy-light text-gold-light text-xs font-bold border border-gold-accent/30 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Buka Bilik Suara (/vote)</span>
        </Link>
        <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-gold-accent" />
          <span>Sistem Pemilihan Resmi</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile/Tablet Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-navy-900/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Mobile/Tablet Drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </div>
    </>
  );
};
