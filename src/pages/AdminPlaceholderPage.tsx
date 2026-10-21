import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminPlaceholderPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-primary flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full bg-navy-secondary/80 border border-navy-light/40 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-gold-accent/20 border border-gold-accent/40 text-gold-accent flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Portal Administrasi</h2>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          Dashboard Admin, Otentikasi Supabase, dan Manajemen Hasil Pemilihan akan diintegrasikan pada <span className="font-semibold text-gold-light">Fase 2 & 3</span>.
        </p>
        <Link
          to="/vote"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gold-accent text-navy-900 font-bold hover:bg-gold-light transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Kiosk Voting</span>
        </Link>
      </div>
    </div>
  );
};
