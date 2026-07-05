import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { BRAND } from '@/utils/constants';

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'Admin — full access' },
  { username: 'sales', password: 'sales123', role: 'Salesperson — showroom ops' },
  { username: 'ppf_manager', password: 'ppf123', role: 'PPF Manager — studio only' },
] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { error: toastError, success } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    window.setTimeout(() => {
      const ok = login(username.trim(), password);
      setLoading(false);

      if (ok) {
        success('Welcome back', `Signed in as ${username}`);
        navigate('/', { replace: true });
      } else {
        toastError('Login failed', 'Invalid username or password');
      }
    }, 400);
  };

  const fillDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-primary)] p-4">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.18) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(129,140,248,0.14) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 30%, rgba(99,102,241,0.2) 0%, transparent 50%), radial-gradient(circle at 20% 70%, rgba(165,180,252,0.12) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 50%, rgba(79,70,229,0.16) 0%, transparent 55%), radial-gradient(circle at 10% 90%, rgba(129,140,248,0.14) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.18) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(129,140,248,0.14) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 24 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/30"
          >
            MX
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {BRAND.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{BRAND.tagline}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]/80 p-6 shadow-[var(--shadow-lift)] backdrop-blur-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 border-t border-[var(--border-secondary)] pt-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Demo accounts
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => fillDemo(account.username, account.password)}
                  className="flex w-full items-center justify-between rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-left transition-colors hover:border-accent/40 hover:bg-[var(--bg-hover)]"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {account.username}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">{account.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
          Mock authentication for demo purposes only
        </p>
      </motion.div>
    </div>
  );
}
