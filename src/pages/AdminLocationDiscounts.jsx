import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { Plus, Edit2, Trash2, Percent, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const defaultDiscount = {
  location: '',
  discount_type: 'percentage',
  discount_value: 10,
  minimum_purchase: 0,
  stamps_per_purchase: 1,
  is_active: true
};

export default function AdminLocationDiscounts() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(defaultDiscount);
  const queryClient = useQueryClient();

  const { data: discounts = [] } = useQuery({
    queryKey: ['locationDiscounts'],
    queryFn: () => base44.entities.LocationDiscount.list()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['clubQRs'],
    queryFn: () => base44.entities.ClubQRCode.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LocationDiscount.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['locationDiscounts']);
      setShowModal(false);
      setFormData(defaultDiscount);
      toast.success('Discount created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LocationDiscount.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['locationDiscounts']);
      setShowModal(false);
      setEditing(null);
      setFormData(defaultDiscount);
      toast.success('Discount updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LocationDiscount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['locationDiscounts']);
      toast.success('Discount deleted');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (discount) => {
    setEditing(discount);
    setFormData(discount);
    setShowModal(true);
  };

  return (
    <AdminLayout title="Location Discounts" currentPage="AdminLocationDiscounts">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">Configure member discounts and stamp rewards by location</p>
        <Button onClick={() => { setShowModal(true); setEditing(null); setFormData(defaultDiscount); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Discount Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {discounts.map((discount) => (
          <div key={discount.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{discount.location}</h3>
                  <p className="text-sm text-gray-500">
                    {discount.discount_value}{discount.discount_type === 'percentage' ? '%' : '$'} off
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => openEdit(discount)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(discount.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Min Purchase:</span>
                <span className="font-medium">${discount.minimum_purchase || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stamps/Purchase:</span>
                <span className="font-medium">{discount.stamps_per_purchase || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium ${discount.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {discount.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {discounts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Percent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No discount rules yet</h3>
          <p className="text-gray-500">Add your first discount rule</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Discount Rule' : 'Add Discount Rule'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Location</Label>
              <Select value={formData.location} onValueChange={(value) => setFormData({...formData, location: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <Select value={formData.discount_type} onValueChange={(value) => setFormData({...formData, discount_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value)})}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Purchase ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.minimum_purchase}
                  onChange={(e) => setFormData({...formData, minimum_purchase: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Stamps Per Purchase</Label>
                <Input
                  type="number"
                  value={formData.stamps_per_purchase}
                  onChange={(e) => setFormData({...formData, stamps_per_purchase: parseInt(e.target.value) || 0})}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label>Active</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editing ? 'Save Changes' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}