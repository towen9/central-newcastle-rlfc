import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import clubConfig from '@/config/club.config';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';

const t = clubConfig.theme;

export default function GateStaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in as gate staff
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user && (user.role === 'gate_staff' || user.role === 'admin')) {
          window.location.href = '/GateScan';
        }
      } catch {
        // Not logged in, stay on this page
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.auth.redirectToLogin();
    } catch (error) {
      toast.error('Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-6" style={{ minHeight: '100dvh', background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: t.navy, border: `2px solid ${t.gold}` }}>
            <Shield className="w-12 h-12" style={{ color: t.gold }} />
          </div>
          <Eyebrow color={t.gold}>Gate Entry</Eyebrow>
          <h1 className="text-white text-3xl font-bold mt-1" style={{ fontFamily: t.fontDisplay }}>Gate Entry</h1>
          <p className="mt-2" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody, fontSize: 16 }}>{clubConfig.identity.club_name}</p>
        </div>

        {/* Login Card — solid opaque surface */}
        <div className="rounded-2xl p-8" style={{ background: t.bg1, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: t.navy, border: `1px solid ${t.gold}33` }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: t.gold }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: t.gold }}>For Gate Staff Only</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Use your club credentials to access the gate scanner</p>
            </div>
          </div>

          <GoldButton
            onClick={handleLogin}
            fullWidth
            disabled={loading}
            style={{ fontSize: 18, padding: '16px 24px', minHeight: 56, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'Signing In...' : 'Sign In with Club Account'}
          </GoldButton>

          <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Need access? Contact your admin
          </p>
        </div>
      </div>
    </div>
  );
}