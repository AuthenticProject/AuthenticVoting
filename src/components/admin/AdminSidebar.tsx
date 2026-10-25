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
  Trophy,
  Tablet,
  Tv,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useElection } from '../../hooks/useElection';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { election, announcementSessions } = useElection();

  const sections: NavSection[] = [
    {
      title: 'Dashboard',
      items: [
        {
          to: '/admin',
          end: true,
          label: 'Overview & Monitoring',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Pemilihan',
      items: [
        {
          to: '/admin/candidates',
          label: 'Kandidat',
          icon: Users,
        },
        {
          to: '/admin/settings',
          label: 'Pengaturan Pemilihan',
          icon: Settings,
        },
        {
          to: '/admin/kiosk',
          label: 'Tablet Voting',
          icon: Tablet,
        },
      ],
    },
    {
      title: 'Pengumuman',
      items: [
        {
          to: '/admin/announcements',
          label: 'Manajemen Acara',
          icon: Trophy,
        },
        {
          to: announcementSessions.length > 0 ? `/admin/announcement/${announcementSessions[0].id}` : '/admin/announcement',
          label: 'Presentasi Proyektor',
          icon: Tv,
        },
      ],
    },
    {
      title: 'Hasil',
      items: [
        {
          to: '/admin/results',
          label: 'Hasil Lengkap & Ekspor',
          icon: Award,
        },
      ],
    },
  ];

  const statusBadge = {
    draft: { label: 'Draft', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    active: { label: 'Voting Aktif', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    closed: { label: 'Voting Ditutup', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  }[election.status];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1C1C1E] text-white border-r border-[#29292D]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#29292D] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo src={election.logo_url} size="sm" />
          <div>
            <h2 className="text-sm font-black tracking-tight text-white leading-tight">
              Pemilihan Jenderal 5102
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
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

      {/* Navigation Links Sections */}
      <nav className="flex-1 p-3.5 space-y-4 overflow-y-auto">
        {sections.map((sec, secIdx) => (
          <div key={secIdx}>
            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              {sec.title}
            </div>
            <div className="space-y-1 mt-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-150
                      ${
                        isActive
                          ? 'bg-gold-accent text-navy-primary font-black shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-[#29292D]'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Quick Kiosk Link */}
      <div className="p-4 border-t border-[#29292D] space-y-2">
        <Link
          to="/vote"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#29292D] hover:bg-[#353539] text-gold-accent text-xs font-bold border border-gold-accent/30 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Buka Bilik Suara (/vote)</span>
        </Link>
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-gold-accent" />
          <span>Kiosk Tablet Tunggal</span>
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
