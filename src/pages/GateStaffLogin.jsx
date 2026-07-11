import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useClub } from '@/contexts/ClubContext';
import { UtilityCard, UtilityButton, StatusBanner, UtilityHeader } from '@/components/ui-kit';

export default function GateStaffLogin() {
  const { club } = useClub();
  const t = club.theme;
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
    <div className="flex flex-col" style={{ minHeight: '100dvh', background: t.bg0, fontFamily: t.fontBody }}>
      <UtilityHeader title="Gate Entry" />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Logo & Title */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: t.navy, border: `3px solid ${t.gold}` }}>
              <Shield className="w-12 h-12" style={{ color: t.gold }} />
            </div>
            <h1 className="text-white text-2xl font-extrabold" style={{ fontFamily: t.fontDisplay }}>Gate Entry</h1>
            <p className="mt-2" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>{club.identity.club_name}</p>
          </div>

          {/* Login Card — solid opaque surface */}
          <UtilityCard>
            <div className="mb-6">
              <StatusBanner variant="warning" title="For Gate Staff Only" subtitle="Use your club credentials to access the gate scanner" />
            </div>

            <UtilityButton variant="primary" onClick={handleLogin} disabled={loading}>
              <LogIn className="w-5 h-5" />
              {loading ? 'Signing In...' : 'Sign In with Club Account'}
            </UtilityButton>

            <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Need access? Contact your admin
            </p>
          </UtilityCard>
        </div>
      </div>
    </div>
  );
}