import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

export const AdminLoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email wajib diisi.');
      return;
    }

    if (!password) {
      setError('Kata sandi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const result = await login({ email, password });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Autentikasi gagal. Silakan periksa kembali email dan kata sandi.');
    } else {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  };

  // Helper to fill demo credentials during development
  const fillDemoCredentials = () => {
    setEmail('admin@pemilihan.id');
    setPassword('Panitia2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-navy-primary flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background radial institutional aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Institutional Card Container */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100 flex flex-col items-center">
          {/* Logo & Heading */}
          <Logo size="lg" className="mb-4" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-primary/5 border border-navy-primary/10 text-navy-primary text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-accent" />
            Panel Akses Terbatas
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-primary text-center">
            Administrator E-Voting
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 text-center mt-1 mb-6">
            Masuk untuk mengelola data pemilihan, kandidat, dan hasil resmi.
          </p>

          {/* Validation Alert */}
          {error && (
            <div className="w-full mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                Alamat Email Panitia
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pemilihan.id"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm font-medium outline-none transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm font-medium outline-none transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary-navy"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="mt-2 py-3.5 font-bold rounded-xl"
            >
              MASUK KE DASHBOARD
            </Button>
          </form>

          {/* Development Mock Auth Notice & One-Click Demo Helper */}
          <div className="w-full mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-3">
            <div className="w-full p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 text-center">
              <span className="font-bold">Mode Pengembangan (Fase 2):</span> Simulasi otentikasi aktif sebelum integrasi Supabase Auth pada Fase 3.
            </div>

            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-xs font-bold text-gold-dark hover:text-gold-accent flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-accent" />
              <span>Gunakan Akun Simulasi Panitia</span>
            </button>
          </div>
        </div>

        {/* Back to Kiosk link */}
        <div className="text-center mt-5">
          <Link
            to="/vote"
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            ← Kembali ke Bilik Suara (/vote)
          </Link>
        </div>
      </div>
    </div>
  );
};
