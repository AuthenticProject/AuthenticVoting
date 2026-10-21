import React from 'react';
import { Menu, LogOut, UserCircle } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { useElection } from '../../hooks/useElection';

interface AdminTopNavProps {
  onToggleSidebar: () => void;
  title: string;
}

export const AdminTopNav: React.FC<AdminTopNavProps> = ({ onToggleSidebar, title }) => {
  const { user, logout } = useAuth();
  const { election } = useElection();

  const statusLabel = {
    draft: 'Draft (Belum Dimulai)',
    active: 'Voting Sedang Berlangsung',
    closed: 'Voting Telah Ditutup',
  }[election.status];

  const statusColor = {
    draft: 'bg-amber-100 text-amber-800 border-amber-300',
    active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    closed: 'bg-slate-200 text-slate-700 border-slate-300',
  }[election.status];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-navy-primary hover:bg-slate-100 transition-colors"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-navy-primary leading-tight">
            {title}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
              {statusLabel}
            </span>
            {isSupabaseConfigured ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-300">
                Supabase Terhubung
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-300">
                Mode Demo (Mock Data)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Administrator Profile & Logout Button */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user && (
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-navy-primary/10 text-navy-primary flex items-center justify-center font-bold">
              <UserCircle className="w-5 h-5 text-navy-primary" />
            </div>
            <div className="text-left text-xs leading-tight">
              <div className="font-extrabold text-navy-primary">{user.name}</div>
              <div className="text-slate-500 text-[11px] truncate max-w-[150px]">{user.email}</div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title="Keluar dari Panel Administrator"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
