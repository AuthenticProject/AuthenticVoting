import React from 'react';
import { Logo } from '../common/Logo';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import type { KioskStep } from '../../types/election';

interface KioskHeaderProps {
  title: string;
  subtitle: string;
  currentStep: KioskStep;
  onResetSession?: () => void;
}

export const KioskHeader: React.FC<KioskHeaderProps> = ({
  title,
  subtitle,
  currentStep,
}) => {
  return (
    <header className="relative z-10 w-full bg-navy-primary text-white border-b border-navy-light/50 px-6 py-3.5 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Branding & Event Identity */}
        <div className="flex items-center gap-3.5">
          <Logo size="sm" />
          <div className="leading-tight">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-gold-accent/20 text-gold-light px-2 py-0.5 rounded-full border border-gold-accent/40">
                <ShieldCheck className="w-3 h-3 text-gold-accent" />
                Resmi
              </span>
              {!isSupabaseConfigured && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/25 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40">
                  <AlertCircle className="w-3 h-3 text-amber-300" />
                  Mode Demo
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-300 font-medium hidden sm:block truncate max-w-xl">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Active Step Indicator (when inside voting flow) */}
        {currentStep !== 'welcome' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold">
              <span
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  currentStep === 'selection'
                    ? 'bg-gold-accent text-navy-900 font-bold shadow-sm'
                    : 'bg-navy-secondary text-slate-300'
                }`}
              >
                1. Pilih
              </span>
              <span className="text-slate-500">→</span>
              <span
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  currentStep === 'confirmation'
                    ? 'bg-gold-accent text-navy-900 font-bold shadow-sm'
                    : 'bg-navy-secondary text-slate-300'
                }`}
              >
                2. Konfirmasi
              </span>
              <span className="text-slate-500">→</span>
              <span
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  currentStep === 'success'
                    ? 'bg-success text-white font-bold'
                    : 'bg-navy-secondary text-slate-400'
                }`}
              >
                3. Selesai
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
