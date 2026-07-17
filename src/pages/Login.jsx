import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Building2, ArrowRight, ShieldCheck } from 'lucide-react';
import { validatePassword } from '../utils/helpers';

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">ATS</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Run internal hiring<br />with clarity.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            A role-based applicant tracking system for openings, candidates, interviews, approvals, and onboarding handoff.
          </p>
          <div className="mt-8 flex items-center gap-2 text-slate-500 text-sm">
            <ShieldCheck size={15} className="text-primary-200" />
            <span>Secure · Role-based access · Real-time</span>
          </div>
        </div>
        <p className="text-slate-700 text-xs">© 2026 ATS. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 size={15} className="text-white" />
            </div>
            <span className="text-white font-bold">ATS</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [view, setView] = useState('login');
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [createForm, setCreateForm] = useState({ password: '', confirm: '' });
  const [createErrors, setCreateErrors] = useState([]);

  function handleLogin(e) {
    e.preventDefault();
    if (!form.username) return setError('Username is required.');
    if (!form.password) return setError('Password is required.');
    const result = login(form.username, form.password);
    if (result.error) return setError(result.error);
    navigate('/dashboard');
  }

  function handleForgot(e) {
    e.preventDefault();
    if (!forgotUsername) return;
    setForgotMsg(`A password reset link has been sent to the email associated with "${forgotUsername}".`);
  }

  function handleCreatePassword(e) {
    e.preventDefault();
    const errs = validatePassword(createForm.password);
    if (errs.length) return setCreateErrors(errs);
    if (createForm.password !== createForm.confirm) return setCreateErrors(['Passwords do not match.']);
    setCreateErrors([]);
    setView('login');
  }

  const pwdRules = [
    'Minimum 8 characters',
    'At least one uppercase letter',
    'At least one lowercase letter',
    'At least one number',
    'At least one special character',
  ];



  if (view === 'forgot') return (
    <Shell>
      <h2 className="text-2xl font-bold text-white mb-1">Forgot Password</h2>
      <p className="text-slate-400 text-sm mb-7">Enter your username to receive a reset link.</p>
      {forgotMsg ? (
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-emerald-400 text-sm">{forgotMsg}</p>
          </div>
          <button className="btn-primary btn w-full" onClick={() => { setView('create'); setForgotMsg(''); }}>
            Create New Password <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleForgot} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Username</label>
            <input className="input bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-primary" value={forgotUsername} onChange={e => setForgotUsername(e.target.value)} placeholder="Enter your username" />
          </div>
          <button className="btn-primary btn w-full" type="submit">Send Reset Link</button>
        </form>
      )}
      <button className="text-sm text-slate-500 hover:text-slate-300 mt-5 block transition-colors" onClick={() => setView('login')}>← Back to Login</button>
    </Shell>
  );

  if (view === 'create') return (
    <Shell>
      <h2 className="text-2xl font-bold text-white mb-1">Create Password</h2>
      <p className="text-slate-400 text-sm mb-7">Set a new secure password for your account.</p>
      <form onSubmit={handleCreatePassword} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">New Password</label>
          <input type="password" className="input bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-primary" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Confirm Password</label>
          <input type="password" className="input bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-primary" value={createForm.confirm} onChange={e => setCreateForm(f => ({ ...f, confirm: e.target.value }))} />
        </div>
        {createErrors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {createErrors.map((e, i) => <p key={i} className="text-red-400 text-xs">• {e}</p>)}
          </div>
        )}
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
          <p className="text-xs font-semibold text-slate-500 mb-2">Requirements</p>
          {pwdRules.map(r => <p key={r} className="text-xs text-slate-600">· {r}</p>)}
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" className="btn-ghost btn flex-1 text-slate-400 border border-slate-700" onClick={() => setView('login')}>Cancel</button>
          <button type="submit" className="btn-primary btn flex-1">Save Password</button>
        </div>
      </form>
    </Shell>
  );

  return (
    <Shell>
      <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
      <p className="text-slate-400 text-sm mb-7">Sign in to your ATS account.</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Username</label>
          <input
            className="input bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-primary"
            value={form.username}
            onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setError(''); }}
            placeholder="Enter your username"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              className="input bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-primary pr-10"
              value={form.password}
              onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError(''); }}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input type="checkbox" className="rounded bg-slate-900 border-slate-700" />
          Remember me
        </label>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button type="submit" className="btn-primary btn w-full py-2.5 mt-1">
          Sign In <ArrowRight size={15} />
        </button>
      </form>

      <button onClick={() => setView('forgot')} className="text-sm text-slate-500 hover:text-primary-200 mt-4 block text-center w-full transition-colors">
        Forgot your password?
      </button>

      {/* Demo credentials */}
      <div className="mt-7 pt-5 border-t border-slate-800">
        <p className="text-xs text-slate-600 text-center mb-3 uppercase tracking-wide font-semibold">Demo Credentials</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { role: 'Head HR', user: 'headhr', pass: 'password123' },
            { role: 'HR', user: 'hrdemo', pass: 'password123' },
            { role: 'Interviewer', user: 'interviewer', pass: 'password123' },
            { role: 'Receptionist', user: 'reception', pass: 'password123' },
            { role: 'IT', user: 'itdemo', pass: 'password123' },
          ].map(c => (
            <button
              key={c.role}
              type="button"
              onClick={() => { setForm({ username: c.user, password: c.pass }); setError(''); }}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl p-3 text-left transition-colors group"
            >
              <p className="text-xs font-semibold text-slate-400 group-hover:text-slate-300">{c.role}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">{c.user}</p>
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}
