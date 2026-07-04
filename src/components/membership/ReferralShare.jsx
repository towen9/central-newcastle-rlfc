import React, { useState } from 'react';
import { Share2, Copy, CheckCircle2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import clubConfig from '@/config/club.config';

export default function ReferralShare({ membership, user }) {
  const [copied, setCopied] = useState(false);

  if (!membership || membership.status !== 'active') return null;

  const referralCode = membership.qr_code_id ? 
    `REF-${membership.qr_code_id.substring(0, 8).toUpperCase()}` : 
    `REF-${user?.id?.substring(0, 8).toUpperCase()}`;

  const referralUrl = `${window.location.origin}/JoinMembership?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Join ${clubConfig.identity.club_name}`,
        text: `🏉 Join me as a member at ${clubConfig.identity.club_name}! Use my link to sign up:`,
        url: referralUrl,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a365d] to-[#2b6cb0] rounded-2xl p-5 mb-6 text-white">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white">Refer a Mate</h3>
          <p className="text-blue-200 text-xs">Share your link — top referrers win prizes at season end!</p>
        </div>
      </div>

      <div className="bg-white/10 rounded-xl p-3 mb-3">
        <p className="text-xs text-blue-200 mb-1">Your referral code</p>
        <p className="font-mono font-bold text-white text-sm">{referralCode}</p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleCopy}
          variant="outline"
          className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
          size="sm"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
        <Button
          onClick={handleShare}
          className="flex-1 bg-white text-[#1a365d] hover:bg-blue-50"
          size="sm"
        >
          <Share2 className="w-4 h-4 mr-1" />
          Share
        </Button>
      </div>
    </div>
  );
}