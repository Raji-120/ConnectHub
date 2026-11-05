import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MessageSquare, Lock, Mail, Eye, EyeOff, Loader2, Sparkles, Sun, Moon } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMsg(res.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setErrorMsg('');

    const res = await login(demoEmail, demoPassword);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setErrorMsg(res.error || 'Demo account not initialized yet. Please seed or register.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950 dark:bg-gray-950 text-gray-100 transition-colors duration-200 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[130px] pointer-events-none" />

      {/* Theme toggle in corner */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-full bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition shadow-lg"
        title="Toggle Theme"
      >
        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
      </button>

      <div className="w-full max-w-md z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-600/30 mb-4 ring-1 ring-white/20">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Welcome to ConnectHub
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Real-Time Communication & Collaboration Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-7 shadow-2xl">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-2.5">
              <span className="font-bold">!</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-gray-100 placeholder-gray-500 text-sm transition outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-gray-100 placeholder-gray-500 text-sm transition outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 font-semibold text-white shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Demo Sign-ins */}
          <div className="mt-6 pt-5 border-t border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Demo Credentials
              </span>
              <span className="text-[11px] text-gray-500">Click to auto-login</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('alex@connecthub.io', 'Password123!')}
                disabled={loading}
                className="p-2.5 text-left rounded-xl bg-gray-950/80 hover:bg-brand-950/40 border border-gray-800 hover:border-brand-500/50 transition group"
              >
                <div className="text-xs font-semibold text-gray-200 group-hover:text-brand-300">
                  Alex Turner
                </div>
                <div className="text-[11px] text-gray-500 truncate">alex@connecthub.io</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('sarah@connecthub.io', 'Password123!')}
                disabled={loading}
                className="p-2.5 text-left rounded-xl bg-gray-950/80 hover:bg-brand-950/40 border border-gray-800 hover:border-brand-500/50 transition group"
              >
                <div className="text-xs font-semibold text-gray-200 group-hover:text-brand-300">
                  Sarah Connor
                </div>
                <div className="text-[11px] text-gray-500 truncate">sarah@connecthub.io</div>
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-brand-400 hover:text-brand-300 font-semibold transition hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
