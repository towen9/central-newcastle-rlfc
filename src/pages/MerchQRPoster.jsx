import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const MERCH_QR_URL = `${window.location.origin}/MemberMerchStatus`;
const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg';

export default function MerchQRPoster() {
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(MERCH_QR_URL)}`;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <div className="mb-6 print:hidden">
        <Button onClick={() => window.print()} className="bg-[#1a365d] hover:bg-[#2c5282]">
          <Printer className="w-4 h-4 mr-2" />
          Print Poster
        </Button>
      </div>

      <div
        id="merch-poster"
        className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none print:max-w-none"
        style={{ aspectRatio: '210/297' }}
      >
        {/* Header */}
        <div className="bg-[#1a365d] px-8 py-8 text-center">
          <img src={LOGO} alt="Central Newcastle RLFC" className="w-24 h-24 object-contain bg-white rounded-full p-1.5 mx-auto mb-4" />
          <h1 className="text-white text-3xl font-extrabold tracking-tight">MERCH TENT</h1>
          <p className="text-blue-200 text-base mt-1">Central Newcastle RLFC</p>
        </div>

        {/* Callout */}
        <div className="bg-amber-400 px-6 py-3 text-center">
          <p className="text-amber-900 font-bold text-lg">🛍️ Members — Scan to check your discount!</p>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center px-8 py-8 bg-white">
          <div className="border-4 border-[#1a365d] rounded-2xl p-3">
            <img src={qrImageUrl} alt="Merch QR" className="w-56 h-56" />
          </div>
          <p className="text-gray-500 text-sm mt-4 font-semibold">Earn points on every purchase</p>
        </div>

        {/* Steps */}
        <div className="px-8 pb-6 space-y-3">
          <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
            <span className="text-2xl">1️⃣</span>
            <p className="text-gray-700 text-sm font-medium">Scan this QR code with your phone camera</p>
          </div>
          <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
            <span className="text-2xl">2️⃣</span>
            <p className="text-gray-700 text-sm font-medium">Log in to see your discount status &amp; points balance</p>
          </div>
          <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
            <span className="text-2xl">3️⃣</span>
            <p className="text-gray-700 text-sm font-medium">Show staff your screen &amp; earn points on every purchase</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#1a365d] px-6 py-3 text-center">
          <p className="text-blue-200 text-xs">Members earn 1 point per $1 spent on merchandise</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          #merch-poster { width: 100%; height: 100vh; border-radius: 0; box-shadow: none; max-width: none; aspect-ratio: auto; }
        }
      `}</style>
    </div>
  );
}