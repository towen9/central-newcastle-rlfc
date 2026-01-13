import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Percent, Edit2, Trash2, MoreVertical, Eye, BarChart3, Star } from 'lucide-react';
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
import { format } from 'date-fns';

const categories = [
  { value: 'food_drink', label: 'Food & Drink' },
  { value: 'fitness_health', label: 'Fitness & Health' },
  { value: 'retail', label: 'Retail' },
  { value: 'trades_services', label: 'Trades & Services' },
  { value: 'family_kids', label: 'Family & Kids' },
  { value: 'other', label: 'Other' }
];

const defaultOffer = {
  sponsor_id: '',
  sponsor_name: '',
  title: '',
  description: '',
  category: 'other',
  redemption_type: 'show_code',
  offer_code: '',
  terms: '',
  redemption_limit_per_member: 1,
  redemption_period: 'month',
  expiry_date: '',
  is_featured: false,
  is_active: true
};

export default function AdminOffers() {
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState(defaultOffer);
  const queryClient = useQueryClient();

  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: () => base44.entities.Offer.list('-created_date')
  });

  const { data: sponsors = [] } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => base44.entities.Sponsor.filter({ is_active: true })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Offer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['offers']);
      setShowModal(false);
      setFormData(defaultOffer);
      toast.success('Offer created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Offer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['offers']);
      setShowModal(false);
      setEditingOffer(null);
      setFormData(defaultOffer);
      toast.success('Offer updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Offer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['offers']);
      toast.success('Offer deleted');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const sponsor = sponsors.find(s => s.id === formData.sponsor_id);
    const data = { ...formData, sponsor_name: sponsor?.name || '' };
    
    if (editingOffer) {
      updateMutation.mutate({ id: editingOffer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (offer) => {
    setEditingOffer(offer);
    setFormData(offer);
    setShowModal(true);
  };

  return (
    <AdminLayout title="Sponsor Offers" currentPage="AdminOffers">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">Manage sponsor offers and track performance</p>
        <Button onClick={() => { setShowModal(true); setEditingOffer(null); setFormData(defaultOffer); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Offer
        </Button>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Offer</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Sponsor</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Category</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Views</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Redemptions</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {offer.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      <span className="font-medium text-gray-900">{offer.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{offer.sponsor_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {categories.find(c => c.value === offer.category)?.label || offer.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye className="w-4 h-4" />
                      {offer.views_count || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <BarChart3 className="w-4 h-4" />
                      {offer.redemptions_count || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      offer.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {offer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(offer)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateMutation.mutate({ 
                            id: offer.id, 
                            data: { is_featured: !offer.is_featured }
                          })}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          {offer.is_featured ? 'Remove Featured' : 'Set Featured'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateMutation.mutate({ 
                            id: offer.id, 
                            data: { is_active: !offer.is_active }
                          })}
                        >
                          {offer.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(offer.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {offers.length === 0 && (
          <div className="text-center py-12">
            <Percent className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No offers yet</h3>
            <p className="text-gray-500">Create sponsor offers for members</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOffer ? 'Edit Offer' : 'Add Offer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Sponsor</Label>
              <Select 
                value={formData.sponsor_id}
                onValueChange={(value) => setFormData({ ...formData, sponsor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sponsor" />
                </SelectTrigger>
                <SelectContent>
                  {sponsors.map(sponsor => (
                    <SelectItem key={sponsor.id} value={sponsor.id}>{sponsor.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., 10% off meals"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the offer..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select 
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Offer Code</Label>
                <Input
                  value={formData.offer_code}
                  onChange={(e) => setFormData({ ...formData, offer_code: e.target.value })}
                  placeholder="e.g., CHARLESTOWN10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Limit per member</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.redemption_limit_per_member}
                  onChange={(e) => setFormData({ ...formData, redemption_limit_per_member: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Period</Label>
                <Select 
                  value={formData.redemption_period}
                  onValueChange={(value) => setFormData({ ...formData, redemption_period: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Per Day</SelectItem>
                    <SelectItem value="week">Per Week</SelectItem>
                    <SelectItem value="month">Per Month</SelectItem>
                    <SelectItem value="total">Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Any terms or conditions..."
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label>Featured Offer</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingOffer ? 'Save Changes' : 'Create Offer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}