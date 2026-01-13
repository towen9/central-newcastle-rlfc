import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Gift, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from '../components/admin/AdminLayout';
import { toast } from 'sonner';

const defaultReward = {
  title: '',
  description: '',
  stamps_required: 5,
  reward_type: 'voucher',
  expiry_days: 30,
  is_active: true,
  sort_order: 0
};

export default function AdminRewards() {
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [formData, setFormData] = useState(defaultReward);
  const queryClient = useQueryClient();

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.Reward.list('stamps_required')
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['allRewardRedemptions'],
    queryFn: () => base44.entities.RewardRedemption.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Reward.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rewards']);
      setShowModal(false);
      setFormData(defaultReward);
      toast.success('Reward created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reward.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rewards']);
      setShowModal(false);
      setEditingReward(null);
      setFormData(defaultReward);
      toast.success('Reward updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Reward.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['rewards']);
      toast.success('Reward deleted');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingReward) {
      updateMutation.mutate({ id: editingReward.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (reward) => {
    setEditingReward(reward);
    setFormData(reward);
    setShowModal(true);
  };

  const getRedemptionCount = (rewardId) => {
    return redemptions.filter(r => r.reward_id === rewardId).length;
  };

  return (
    <AdminLayout title="Rewards" currentPage="AdminRewards">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">Manage stamp rewards for members</p>
        <Button onClick={() => { setShowModal(true); setEditingReward(null); setFormData(defaultReward); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Reward
        </Button>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <div 
            key={reward.id}
            className={`bg-white rounded-xl border p-6 ${
              reward.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                reward.is_active ? 'bg-amber-100' : 'bg-gray-100'
              }`}>
                <Gift className={`w-6 h-6 ${reward.is_active ? 'text-amber-500' : 'text-gray-400'}`} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(reward)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => updateMutation.mutate({ 
                      id: reward.id, 
                      data: { is_active: !reward.is_active }
                    })}
                  >
                    {reward.is_active ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteMutation.mutate(reward.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1">{reward.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{reward.description}</p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Required</p>
                <p className="font-bold text-amber-600">{reward.stamps_required} stamps</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Claimed</p>
                <p className="font-bold text-gray-900">{getRedemptionCount(reward.id)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rewards.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Gift className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No rewards yet</h3>
          <p className="text-gray-500 mb-4">Create your first reward for members</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Reward
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReward ? 'Edit Reward' : 'Add Reward'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Free Drink Voucher"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the reward..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stamps Required</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.stamps_required}
                  onChange={(e) => setFormData({ ...formData, stamps_required: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select 
                  value={formData.reward_type}
                  onValueChange={(value) => setFormData({ ...formData, reward_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voucher">Voucher</SelectItem>
                    <SelectItem value="item">Item</SelectItem>
                    <SelectItem value="entry">Prize Entry</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Expiry (days after claim)</Label>
              <Input
                type="number"
                min="0"
                value={formData.expiry_days || ''}
                onChange={(e) => setFormData({ ...formData, expiry_days: parseInt(e.target.value) || null })}
                placeholder="Leave empty for no expiry"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingReward ? 'Save Changes' : 'Create Reward'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}