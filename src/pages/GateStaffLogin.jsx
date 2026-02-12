import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#2c5282] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Shield className="w-12 h-12 text-[#1a365d]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Gate Entry</h1>
          <p className="text-blue-200">Central Newcastle RLFC</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="mb-6 p-4 bg-blue-50 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 text-sm">For Gate Staff Only</p>
              <p className="text-blue-700 text-xs mt-1">Use your club credentials to access the gate scanner</p>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-14 bg-[#1a365d] hover:bg-[#2c5282] text-lg font-semibold"
          >
            <LogIn className="w-5 h-5 mr-3" />
            {loading ? 'Signing In...' : 'Sign In with Club Account'}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Need access? Contact your admin
          </p>
        </div>
      </div>
    </div>
  );
}