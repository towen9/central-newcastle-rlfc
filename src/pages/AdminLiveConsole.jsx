import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import FixtureSelector from '../components/liveconsole/FixtureSelector';
import LiveConsoleScreen from '../components/liveconsole/LiveConsoleScreen';

export default function AdminLiveConsole() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedFixture, setSelectedFixture] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthLoading(false); });
  }, []);

  if (authLoading) {
    return (
      <AdminLayout title="Live Console" currentPage="AdminLiveConsole">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-[#1a365d] rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <AdminLayout title="Live Console" currentPage="AdminLiveConsole">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Only</h2>
          <p className="text-gray-500">You don't have permission to access this page.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Live Console" currentPage="AdminLiveConsole">
      {!selectedFixture ? (
        <FixtureSelector onSelect={setSelectedFixture} />
      ) : (
        <LiveConsoleScreen
          fixture={selectedFixture}
          user={user}
          onChangeFixture={() => setSelectedFixture(null)}
        />
      )}
    </AdminLayout>
  );
}