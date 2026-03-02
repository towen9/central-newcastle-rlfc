import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function PlayerPassRegistration() {
  const [user, setUser] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    player_number: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          full_name: userData.full_name || '',
          email: userData.email || ''
        }));
      } catch (error) {
        // Not logged in, that's ok
      }
    };
    loadUser();
  }, []);

  const registrationMutation = useMutation({
    mutationFn: async (data) => {
      // Find the Player Pass tier
      const tiers = await base44.entities.MembershipTier.filter({ name: '2026 Player Pass' });
      if (!tiers || tiers.length === 0) {
        throw new Error('Player Pass tier not found. Please contact admin.');
      }
      const tier = tiers[0];

      // Create pending membership
      const qrCodeId = `PLAYER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const membershipData = {
        user_id: user?.id || 'pending',
        user_email: data.email,
        user_name: data.full_name,
        tier_id: tier.id,
        tier_name: tier.name,
        start_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date('2026-12-31').toISOString().split('T')[0],
        status: 'pending',
        qr_code_id: qrCodeId,
        stamps: 0,
        points: 0,
        total_checkins: 0
      };

      // Create the membership
      await base44.entities.Membership.create(membershipData);

      // Send notification email to admin
      try {
        await base44.integrations.Core.SendEmail({
          to: 'admin@centralrlfc.com',
          subject: '🏉 New Player Pass Application',
          body: `
            A new player pass application has been submitted:
            
            Name: ${data.full_name}
            Email: ${data.email}
            Phone: ${data.phone}
            Player Number: ${data.player_number}
            
            Please review and approve in the Admin Dashboard > Members section.
          `
        });
      } catch (emailError) {
        console.error('Failed to send admin notification', emailError);
      }

      return membershipData;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Application submitted! Awaiting admin approval.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit application');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    registrationMutation.mutate(formData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your 2026 Player Pass application has been submitted for admin approval. 
            You'll receive an email once it's been reviewed.
          </p>
          <Link to={createPageUrl('Home')}>
            <Button className="w-full bg-[#1a365d] hover:bg-[#2c5282]">
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#1a365d] pt-safe">
        <div className="px-5 py-6">
          <Link to={createPageUrl('Home')}>
            <button className="flex items-center gap-2 text-blue-200 mb-4">
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </Link>
          <h1 className="text-white text-2xl font-bold mb-2">2026 Player Pass</h1>
          <p className="text-blue-200">Register for your player pass</p>
        </div>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            🏉 This pass is for Central Newcastle RLFC players (Men's & Women's). 
            Your application will be reviewed by admin before activation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-5">
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0400 000 000"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={registrationMutation.isPending}
            className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6"
          >
            {registrationMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </form>

        <div className="mt-6 bg-gray-100 rounded-xl p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> This is a free pass for registered players. 
            Admin approval is required before your pass becomes active.
          </p>
        </div>
      </div>
    </div>
  );
}