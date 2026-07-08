import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { isDemoAuthEnabled } from '@/lib/auth';
import { BRAND } from '@/utils/constants';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, usesSupabaseAuth } = useAuth();
  const { error: toastError, success } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(identifier, password);
    setLoading(false);

    if (result.ok) {
      success('Welcome back', usesSupabaseAuth ? 'Signed in securely' : 'Signed in');
      navigate('/', { replace: true });
      return;
    }

    toastError('Login failed', result.message ?? 'Invalid credentials');
  };

  const identifierLabel = usesSupabaseAuth ? 'Email' : 'Username';
  const identifierPlaceholder = usesSupabaseAuth ? 'you@marvelx.pk' : 'Enter username';
  const identifierAutoComplete = usesSupabaseAuth ? 'email' : 'username';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-primary)] p-4">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 20%, rgba(205,23,25,0.16) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(224,62,62,0.12) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 30%, rgba(205,23,25,0.18) 0%, transparent 50%), radial-gradient(circle at 20% 70%, rgba(168,18,22,0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 50%, rgba(205,23,25,0.14) 0%, transparent 55%), radial-gradient(circle at 10% 90%, rgba(224,62,62,0.12) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 20%, rgba(205,23,25,0.16) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(224,62,62,0.12) 0%, transparent 50%)',
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
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-xl font-bold text-white shadow-lg shadow-red-600/30"
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
              label={identifierLabel}
              type={usesSupabaseAuth ? 'email' : 'text'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={identifierPlaceholder}
              autoComplete={identifierAutoComplete}
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
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
          {usesSupabaseAuth
            ? 'Secured with Supabase Auth. Passwords are hashed server-side.'
            : isDemoAuthEnabled()
              ? 'Local demo mode only — not for production.'
              : 'Sign-in requires Supabase Auth configuration.'}
        </p>
      </motion.div>
    </div>
  );
}
