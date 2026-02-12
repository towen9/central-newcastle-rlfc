import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CanteenStaffLogin() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in as canteen staff
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user && (user.role === 'canteen_staff' || user.role === 'admin')) {
          window.location.href = '/BarScan';
        }
      } catch {
        // Not logged in, stay on this page
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await base44.auth.redirectToLogin();
    } catch (error) {
      toast.error('Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <ShoppingBag className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bar & Canteen</h1>
          <p className="text-amber-100">Central Newcastle RLFC</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="mb-6 p-4 bg-amber-50 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">For Bar & Canteen Staff Only</p>
              <p className="text-amber-700 text-xs mt-1">Use your club credentials to access the points scanner</p>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-lg font-semibold"
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