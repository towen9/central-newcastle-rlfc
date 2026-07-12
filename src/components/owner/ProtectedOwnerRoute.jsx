import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function ProtectedOwnerRoute({ children }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/10 border-t-white/30 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.is_platform_owner) {
    return <Navigate to="/" replace />;
  }

  return children;
}