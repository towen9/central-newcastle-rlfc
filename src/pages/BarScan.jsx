import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Beer, CheckCircle, XCircle, Scan, DollarSign, Award, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function BarScan() {
  const [qrId, setQrId] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [scannedMembership, setScannedMembership] = useState(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseData, setPurchaseData] = useState({
    item_description: '',
    original_amount: '',
    payment_method: 'card'
  });
  const queryClient = useQueryClient();

  // Get location from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('qrId');
    if (id) setQrId(id);
  }, []);

  // Fetch location QR details
  const { data: location } = useQuery({
    queryKey: ['clubQR', qrId],
    queryFn: async () => {
      const qrs = await base44.entities.ClubQRCode.filter({ qr_id: qrId });
      return qrs[0] || null;
    },
    enabled: !!qrId
  });

  // Fetch discount rules for location
  const { data: discountRules = [] } = useQuery({
    queryKey: ['locationDiscounts', location?.name],
    queryFn: () => base44.entities.LocationDiscount.filter({ location: location.name, is_active: true }),
    enabled: !!location?.name
  });

  useEffect(() => {
    if (location) setLocationData(location);
  }, [location]);

  // Process purchase mutation
  const processPurchase = useMutation({
    mutationFn: async (data) => {
      const now = new Date();
      const transaction = await base44.entities.Transaction.create({
        user_id: scannedMembership.user_id,
        membership_id: scannedMembership.id,
        member_name: scannedMembership.user_name,
        location: locationData.name,
        location_qr_id: locationData.qr_id,
        item_description: data.item_description,
        original_amount: parseFloat(data.original_amount),
        discount_amount: data.discount_amount,
        final_amount: data.final_amount,
        discount_reason: data.discount_reason,
        stamps_awarded: data.stamps_awarded,
        timestamp: now.toISOString(),
        hour_of_day: now.getHours(),
        day_of_week: now.toLocaleDateString('en-US', { weekday: 'long' }),
        transaction_type: 'food_drink',
        payment_method: data.payment_method
      });

      // Award stamps to membership
      if (data.stamps_awarded > 0) {
        await base44.entities.Membership.update(scannedMembership.id, {
          stamps: (scannedMembership.stamps || 0) + data.stamps_awarded
        });
      }

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['membership']);
      toast.success('Purchase recorded & stamps awarded!');
      setShowPurchaseForm(false);
      setScannedMembership(null);
      setPurchaseData({ item_description: '', original_amount: '', payment_method: 'card' });
    }
  });

  const handleMemberScan = async (memberQRData) => {
    try {
      const data = JSON.parse(memberQRData);
      const memberships = await base44.entities.Membership.filter({ qr_code_id: data.id, status: 'active' });
      
      if (memberships.length === 0) {
        toast.error('No active membership found');
        return;
      }

      setScannedMembership(memberships[0]);
      setShowPurchaseForm(true);
    } catch (error) {
      toast.error('Invalid QR code');
    }
  };

  const calculateDiscount = () => {
    const amount = parseFloat(purchaseData.original_amount) || 0;
    if (!scannedMembership || !discountRules.length || amount === 0) {
      return { discount: 0, final: amount, reason: '', stamps: 0 };
    }

    // Find applicable discount rule
    const rule = discountRules.find(r => 
      (!r.applicable_tiers || r.applicable_tiers.includes(scannedMembership.tier_name)) &&
      amount >= (r.minimum_purchase || 0)
    );

    if (!rule) {
      return { discount: 0, final: amount, reason: '', stamps: 0 };
    }

    const discount = rule.discount_type === 'percentage' 
      ? amount * (rule.discount_value / 100)
      : rule.discount_value;

    return {
      discount: discount,
      final: amount - discount,
      reason: `${rule.discount_value}${rule.discount_type === 'percentage' ? '%' : '$'} member discount`,
      stamps: rule.stamps_per_purchase || 0
    };
  };

  const handleSubmitPurchase = () => {
    const calc = calculateDiscount();
    processPurchase.mutate({
      item_description: purchaseData.item_description,
      original_amount: purchaseData.original_amount,
      discount_amount: calc.discount,
      final_amount: calc.final,
      discount_reason: calc.reason,
      stamps_awarded: calc.stamps,
      payment_method: purchaseData.payment_method
    });
  };

  if (!locationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Scan className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Loading scanner...</p>
        </div>
      </div>
    );
  }

  const discount = calculateDiscount();

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a365d] to-[#2c5282] pt-safe pb-8">
        <div className="px-6 py-6 text-center">
          <Beer className="w-12 h-12 text-white mx-auto mb-3" />
          <h1 className="text-white text-2xl font-bold mb-1">{locationData.name}</h1>
          <p className="text-blue-200 text-sm">Member Point of Sale</p>
        </div>
      </div>

      <div className="px-6 -mt-4">
        {!showPurchaseForm ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Scan className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Scan Member QR</h2>
            <p className="text-gray-500 mb-6">Ask member to show their digital membership pass</p>
            
            <div className="bg-amber-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800">
                💡 Member scans at Home screen → Show Digital Pass
              </p>
            </div>

            {/* Manual QR Input for testing */}
            <div className="pt-4 border-t border-gray-100">
              <Label className="text-left block mb-2">Or paste QR data (testing)</Label>
              <textarea
                className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                placeholder='{"type":"membership","id":"abc123","user_id":"xyz"}'
                onPaste={(e) => {
                  setTimeout(() => handleMemberScan(e.target.value), 100);
                }}
              />
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Member Info Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-bold">Active Member</span>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                    {scannedMembership.tier_name}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{scannedMembership.user_name}</h3>
                <p className="text-white/80 text-sm">ID: {scannedMembership.qr_code_id?.slice(0, 8)}</p>
                
                <div className="mt-4 pt-4 border-t border-white/20 flex justify-between">
                  <div>
                    <p className="text-white/70 text-xs">Current Stamps</p>
                    <p className="text-xl font-bold">{scannedMembership.stamps || 0}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs">Total Visits</p>
                    <p className="text-xl font-bold">{scannedMembership.total_checkins || 0}</p>
                  </div>
                </div>
              </div>

              {/* Purchase Form */}
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Process Purchase</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label>Item/Description</Label>
                    <Input
                      value={purchaseData.item_description}
                      onChange={(e) => setPurchaseData({...purchaseData, item_description: e.target.value})}
                      placeholder="e.g., 2x Beers, 1x Burger"
                    />
                  </div>

                  <div>
                    <Label>Original Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={purchaseData.original_amount}
                      onChange={(e) => setPurchaseData({...purchaseData, original_amount: e.target.value})}
                      placeholder="25.00"
                    />
                  </div>

                  {/* Discount Display */}
                  {discount.discount > 0 && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <div className="flex items-center gap-2 text-emerald-700 mb-2">
                        <Award className="w-5 h-5" />
                        <span className="font-semibold">Member Discount Applied</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Original:</span>
                          <span className="text-gray-900">${parseFloat(purchaseData.original_amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount ({discount.reason}):</span>
                          <span>-${discount.discount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-emerald-200">
                          <span>Final Amount:</span>
                          <span className="text-emerald-700">${discount.final.toFixed(2)}</span>
                        </div>
                      </div>
                      {discount.stamps > 0 && (
                        <div className="mt-3 pt-3 border-t border-emerald-200 text-center">
                          <p className="text-emerald-700 font-semibold">+{discount.stamps} Stamp{discount.stamps > 1 ? 's' : ''} will be awarded</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowPurchaseForm(false);
                        setScannedMembership(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmitPurchase}
                      disabled={!purchaseData.item_description || !purchaseData.original_amount}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Complete Sale
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}