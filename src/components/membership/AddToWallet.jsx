import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * AddToWallet — puts the membership card into Apple Wallet / Google Wallet.
 *
 * The pass barcode carries Membership.qr_code_id, the same value the in-app
 * QR encodes, so GateScan and processScan treat a wallet card exactly like
 * the app QR. No scanner changes.
 */
export default function AddToWallet({ membership, compact = false }) {
  const [links, setLinks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const isApple =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);

  useEffect(() => {
    let cancelled = false;

    async function issue() {
      try {
        setLoading(true);
        setFailed(false);
        const res = await base44.functions.invoke('wallet-pass', {
          action: 'issue',
          membership_id: membership.id,
        });
        if (!cancelled) setLinks(res.data || null);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (membership?.id) issue();
    return () => {
      cancelled = true;
    };
  }, [membership?.id]);

  // Nothing configured yet, or the call failed — stay silent rather than
  // showing a broken button. The in-app QR above still works.
  if (failed) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Preparing your wallet card…
      </div>
    );
  }

  const appleUrl = links?.apple_url;
  const googleUrl = links?.google_url;
  if (!appleUrl && !googleUrl) return null;

  const AppleButton = () =>
    appleUrl ? (
      <a
        href={appleUrl}
        className="flex-1 inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-black px-4 text-white transition-opacity hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M16.36 12.7c.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.54.02-2.96.9-3.75 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.35 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.78.74 3 .72 1.24-.02 2.02-1.12 2.78-2.23.88-1.28 1.24-2.52 1.26-2.58-.03-.01-2.41-.93-2.43-3.7zM14.2 5.9c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.68-1.09 1.77-.95 2.81 1.02.08 2.05-.52 2.68-1.28z" />
        </svg>
        <span className="text-left leading-tight">
          <span className="block text-[9px] uppercase tracking-wide opacity-70">Add to</span>
          <span className="block text-xs font-semibold">Apple Wallet</span>
        </span>
      </a>
    ) : null;

  const GoogleButton = () =>
    googleUrl ? (
      <a
        href={googleUrl}
        className="flex-1 inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-[#1a73e8] px-4 text-white transition-opacity hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M21 7H5a2 2 0 0 1 0-4h13v2H5v.02L21 5v2zm0 2H3v10a2 2 0 0 0 2 2h16a1 1 0 0 0 1-1v-2h-7a3 3 0 0 1 0-6h7V10a1 1 0 0 0-1-1zm-6 5a1 1 0 0 0 0 2h7v-2h-7z" />
        </svg>
        <span className="text-left leading-tight">
          <span className="block text-[9px] uppercase tracking-wide opacity-80">Add to</span>
          <span className="block text-xs font-semibold">Google Wallet</span>
        </span>
      </a>
    ) : null;

  const buttons = isApple
    ? [<AppleButton key="a" />, <GoogleButton key="g" />]
    : [<GoogleButton key="g" />, <AppleButton key="a" />];

  return (
    <div className="space-y-2">
      {!compact && (
        <p className="text-xs text-gray-500 text-center">
          Keep it in your phone — no app to open at the gate.
        </p>
      )}
      <div className="flex gap-2">{buttons}</div>
    </div>
  );
}
