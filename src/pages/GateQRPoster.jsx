import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import clubConfig from '@/config/club.config';
import GoldButton from '@/components/ui-kit/GoldButton';

const t = clubConfig.theme;

export default function GateQRPoster() {
  const urlParams = new URLSearchParams(window.location.search);
  const qrId = urlParams.get('qr_id');

  const { data: qrCodes = [] } = useQuery({
    queryKey: ['clubQRCodes'],
    queryFn: () => base44.entities.ClubQRCode.list()
  });

  const qr = qrCodes.find(q => q.qr_id === qrId) || qrCodes.find(q => q.qr_type === 'checkin');

  const getQRImageUrl = (qrCode) => {
    const data = JSON.stringify({ type: qrCode.qr_type, id: qrCode.qr_id });
    return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(data)}`;
  };

  if (!qr) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100dvh', background: t.bg0 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No QR code found. Create one in Admin → QR Codes first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8" style={{ minHeight: '100dvh', background: t.bg0 }}>
      {/* Print button — hidden when printing */}
      <div className="mb-6 print:hidden">
        <GoldButton onClick={() => window.print()} style={{ fontSize: 16, padding: '12px 24px', minHeight: 48 }}>
          <Printer className="w-4 h-4" />
          Print Poster
        </GoldButton>
      </div>

      {/* Poster — print-friendly light surface */}
      <div
        id="gate-poster"
        className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none print:max-w-none"
        style={{ aspectRatio: '210/297' }}
      >
        {/* Header */}
        <div className="px-8 py-8 text-center" style={{ background: t.navy }}>
          <img
            src={clubConfig.identity.logo_url}
            alt={clubConfig.identity.club_name}
            className="w-24 h-24 object-contain bg-white rounded-full p-1.5 mx-auto mb-4"
          />
          <h1 className="text-white text-3xl font-extrabold tracking-tight">GATE ENTRY</h1>
          <p className="text-base mt-1" style={{ color: '#93c5fd' }}>{clubConfig.identity.club_name}</p>
        </div>

        {/* Instruction */}
        <div className="px-6 py-3 text-center" style={{ background: '#f59e0b' }}>
          <p className="font-bold text-lg" style={{ color: '#1a1303' }}>📱 Scan your member QR code here</p>
        </div>

        {/* QR Code — solid white opaque background with quiet-zone padding */}
        <div className="flex flex-col items-center justify-center px-8 py-8 bg-white">
          <div className="rounded-2xl p-6" style={{ background: 'white', border: `4px solid ${t.navy}` }}>
            <img
              src={getQRImageUrl(qr)}
              alt="Gate Entry QR"
              className="w-56 h-56"
            />
          </div>
          <p className="text-gray-400 text-xs mt-3 font-mono">{qr.qr_id}</p>
        </div>

        {/* Instructions */}
        <div className="px-8 pb-6 space-y-3">
          <div className="flex items-start gap-3 rounded-xl p-3" style={{ background: '#f9fafb' }}>
            <span className="text-2xl">1️⃣</span>
            <p className="text-gray-700 text-sm font-medium">Open the {clubConfig.identity.club_name} app on your phone</p>
          </div>
          <div className="flex items-start gap-3 rounded-xl p-3" style={{ background: '#f9fafb' }}>
            <span className="text-2xl">2️⃣</span>
            <p className="text-gray-700 text-sm font-medium">Tap your membership pass to show your QR code</p>
          </div>
          <div className="flex items-start gap-3 rounded-xl p-3" style={{ background: '#f9fafb' }}>
            <span className="text-2xl">3️⃣</span>
            <p className="text-gray-700 text-sm font-medium">Hold your screen up to the scanner at the gate</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 text-center" style={{ background: t.navy }}>
          <p className="text-xs" style={{ color: '#93c5fd' }}>No app? No entry. Download at centralfootball.com.au</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          #gate-poster {
            width: 100%;
            height: 100vh;
            border-radius: 0;
            box-shadow: none;
            max-width: none;
            aspect-ratio: auto;
          }
        }
      `}</style>
    </div>
  );
}