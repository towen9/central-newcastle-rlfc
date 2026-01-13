import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Edit2, Trash2, MoreVertical, Globe, Mail, Phone } from 'lucide-react';
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

const tierColors = {
  platinum: 'bg-gray-800 text-white',
  gold: 'bg-amber-500 text-white',
  silver: 'bg-gray-400 text-white',
  bronze: 'bg-orange-700 text-white',
  community: 'bg-blue-500 text-white'
};

const defaultSponsor = {
  name: '',
  description: '',
  website: '',
  contact_email: '',
  contact_phone: '',
  tier: 'community',
  is_active: true
};

export default function AdminSponsors() {
  const [showModal, setShowModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [formData, setFormData] = useState(defaultSponsor);
  const queryClient = useQueryClient();

  const { data: sponsors = [] } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => base44.entities.Sponsor.list()
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: () => base44.entities.Offer.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Sponsor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sponsors']);
      setShowModal(false);
      setFormData(defaultSponsor);
      toast.success('Sponsor created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Sponsor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sponsors']);
      setShowModal(false);
      setEditingSponsor(null);
      setFormData(defaultSponsor);
      toast.success('Sponsor updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Sponsor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sponsors']);
      toast.success('Sponsor deleted');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSponsor) {
      updateMutation.mutate({ id: editingSponsor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (sponsor) => {
    setEditingSponsor(sponsor);
    setFormData(sponsor);
    setShowModal(true);
  };

  const getOfferCount = (sponsorId) => {
    return offers.filter(o => o.sponsor_id === sponsorId).length;
  };

  const getTotalRedemptions = (sponsorId) => {
    return offers
      .filter(o => o.sponsor_id === sponsorId)
      .reduce((sum, o) => sum + (o.redemptions_count || 0), 0);
  };

  return (
    <AdminLayout title="Sponsors" currentPage="AdminSponsors">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">Manage club sponsors</p>
        <Button onClick={() => { setShowModal(true); setEditingSponsor(null); setFormData(defaultSponsor); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Sponsor
        </Button>
      </div>

      {/* Sponsors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sponsors.map((sponsor) => (
          <div 
            key={sponsor.id}
            className={`bg-white rounded-xl border p-6 ${
              sponsor.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {sponsor.logo_url ? (
                  <img src={sponsor.logo_url} alt={sponsor.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{sponsor.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[sponsor.tier]}`}>
                    {sponsor.tier}
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(sponsor)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => updateMutation.mutate({ 
                      id: sponsor.id, 
                      data: { is_active: !sponsor.is_active }
                    })}
                  >
                    {sponsor.is_active ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteMutation.mutate(sponsor.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{sponsor.description}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              {sponsor.website && (
                <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {sponsor.contact_email && (
                <a href={`mailto:${sponsor.contact_email}`} className="flex items-center gap-1 hover:text-blue-600">
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {sponsor.contact_phone && (
                <a href={`tel:${sponsor.contact_phone}`} className="flex items-center gap-1 hover:text-blue-600">
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Offers</p>
                <p className="font-bold text-gray-900">{getOfferCount(sponsor.id)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Redemptions</p>
                <p className="font-bold text-emerald-600">{getTotalRedemptions(sponsor.id)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sponsors.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No sponsors yet</h3>
          <p className="text-gray-500 mb-4">Add your first sponsor</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Sponsor
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Sponsor name"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="About the sponsor..."
              />
            </div>
            <div>
              <Label>Tier</Label>
              <Select 
                value={formData.tier}
                onValueChange={(value) => setFormData({ ...formData, tier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Website</Label>
              <Input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
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
                {editingSponsor ? 'Save Changes' : 'Create Sponsor'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}