import React from 'react';
import { Eye, X } from 'lucide-react';

export default function ActingAsBanner({ clubName, onExit }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 py-2"
      style={{ background: '#f59e0b', color: '#0a0a0a', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
    >
      <div className="flex items-center gap-2">
        <Eye className="w-3.5 h-3.5" />
        <p className="text-xs font-bold">Acting as {clubName}</p>
      </div>
      <button
        onClick={onExit}
        className="flex items-center gap-1 text-xs font-bold underline"
      >
        Exit <X className="w-3 h-3" />
      </button>
    </div>
  );
}