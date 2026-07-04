import React from 'react';
import GlassCard from './GlassCard';

export function Skeleton({ width = '100%', height = 16, className = '' }) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          animation: 'kit-shimmer 1.8s ease-in-out infinite'
        }}
      />
      <style>{`@keyframes kit-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <GlassCard className={`p-5 ${className}`}>
      <div className="space-y-3">
        <Skeleton width="60%" height={14} />
        <Skeleton width="100%" height={20} />
        <Skeleton width="80%" height={20} />
      </div>
    </GlassCard>
  );
}

export default Skeleton;