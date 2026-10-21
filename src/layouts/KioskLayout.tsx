import React, { useState } from 'react';
import { KioskHeader } from '../components/kiosk/KioskHeader';
import type { Election, KioskStep } from '../types/election';
import { Maximize2, Minimize2, Settings2 } from 'lucide-react';

interface KioskLayoutProps {
  children: React.ReactNode;
  election: Election;
  currentStep: KioskStep;
  onResetSession: () => void;
  onStatusChange?: (status: Election['status']) => void;
}

export const KioskLayout: React.FC<KioskLayoutProps> = ({
  children,
  election,
  currentStep,
  onResetSession,
  onStatusChange,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDevControls, setShowDevControls] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {});
      }
    }
  };

  const isDev = !(typeof import.meta !== 'undefined' && import.meta.env?.PROD);

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-institutional-light">
      {/* Kiosk Header */}
      <KioskHeader
        title={election.title}
        subtitle={election.subtitle}
        currentStep={currentStep}
        onResetSession={onResetSession}
      />

      {/* Main Kiosk Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto sm:overflow-hidden relative flex flex-col">
        {children}
      </main>

      {/* Discreet QA & Fullscreen Kiosk Toolbar (Discrete in corner, non-intrusive for kiosk operators) */}
      <div className="absolute bottom-2 right-2 z-50 flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
        {isDev && showDevControls && onStatusChange && (
          <div className="flex items-center gap-1.5 bg-navy-primary/95 text-white p-1.5 rounded-xl text-[11px] shadow-lg border border-navy-light/40 backdrop-blur-md">
            <span className="text-gold-light font-bold px-1.5">Status:</span>
            <button
              onClick={() => onStatusChange('draft')}
              className={`px-2 py-0.5 rounded-md font-semibold ${
                election.status === 'draft' ? 'bg-amber-600 text-white' : 'hover:bg-navy-surface text-slate-300'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => onStatusChange('active')}
              className={`px-2 py-0.5 rounded-md font-semibold ${
                election.status === 'active' ? 'bg-emerald-600 text-white' : 'hover:bg-navy-surface text-slate-300'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => onStatusChange('closed')}
              className={`px-2 py-0.5 rounded-md font-semibold ${
                election.status === 'closed' ? 'bg-rose-600 text-white' : 'hover:bg-navy-surface text-slate-300'
              }`}
            >
              Ditutup
            </button>
          </div>
        )}

        {isDev && onStatusChange && (
          <button
            onClick={() => setShowDevControls(!showDevControls)}
            title="Pengaturan Mode Pengujian Status Acara"
            className="w-8 h-8 rounded-lg bg-navy-primary/70 text-slate-300 hover:text-white hover:bg-navy-primary flex items-center justify-center transition-colors shadow-sm"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Tablet Kiosk)'}
          className="w-8 h-8 rounded-lg bg-navy-primary/70 text-slate-300 hover:text-white hover:bg-navy-primary flex items-center justify-center transition-colors shadow-sm"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
