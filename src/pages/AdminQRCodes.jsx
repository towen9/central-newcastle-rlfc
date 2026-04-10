import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, QrCode, Edit2, Trash2, MoreVertical, Download, Copy, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const defaultQR = {
  name: '',
  location: '',
  qr_type: 'checkin',
  is_active: true
};

export default function AdminQRCodes() {
  const [showModal, setShowModal] = useState(false);
  const [editingQR, setEditingQR] = useState(null);
  const [formData, setFormData] = useState(defaultQR);
  const [viewingQR, setViewingQR] = useState(null);
  const queryClient = useQueryClient();

  const { data: qrCodes = [] } = useQuery({
    queryKey: ['clubQRCodes'],
    queryFn: () => base44.entities.ClubQRCode.list()
  });

  const { data: checkins = [] } = useQuery({
    queryKey: ['allCheckins'],
    queryFn: () => base44.entities.CheckIn.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const qrId = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      return base44.entities.ClubQRCode.create({ ...data, qr_id: qrId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clubQRCodes']);
      setShowModal(false);
      setFormData(defaultQR);
      toast.success('QR Code created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClubQRCode.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clubQRCodes']);
      setShowModal(false);
      setEditingQR(null);
      setFormData(defaultQR);
      toast.success('QR Code updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClubQRCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clubQRCodes']);
      toast.success('QR Code deleted');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingQR) {
      updateMutation.mutate({ id: editingQR.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (qr) => {
    setEditingQR(qr);
    setFormData(qr);
    setShowModal(true);
  };

  const getCheckinCount = (qrId) => {
    return checkins.filter(c => c.location_qr_id === qrId).length;
  };

  const getQRImageUrl = (qrCode) => {
    const data = JSON.stringify({ type: qrCode.qr_type, id: qrCode.qr_id });
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
  };

  const copyQRData = (qrCode) => {
    const data = JSON.stringify({ type: qrCode.qr_type, id: qrCode.qr_id });
    navigator.clipboard.writeText(data);
    toast.success('QR data copied to clipboard');
  };

  const downloadQR = (qrCode) => {
    const url = getQRImageUrl(qrCode);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${qrCode.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    link.click();
  };

  return (
    <AdminLayout title="Club QR Codes" currentPage="AdminQRCodes">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">Manage check-in and event QR codes</p>
        <Button onClick={() => { setShowModal(true); setEditingQR(null); setFormData(defaultQR); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create QR Code
        </Button>
      </div>

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {qrCodes.map((qr) => (
          <div 
            key={qr.id}
            className={`bg-white rounded-xl border p-6 ${
              qr.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{qr.name}</h3>
                <p className="text-sm text-gray-500">{qr.location}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setViewingQR(qr)}>
                    <QrCode className="w-4 h-4 mr-2" />
                    View QR
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/GateQRPoster?qr_id=${qr.qr_id}`, '_blank')}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Poster
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => downloadQR(qr)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                   </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyQRData(qr)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Data
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEdit(qr)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => updateMutation.mutate({ 
                      id: qr.id, 
                      data: { is_active: !qr.is_active }
                    })}
                  >
                    {qr.is_active ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteMutation.mutate(qr.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* QR Preview */}
            <div 
              className="bg-gray-50 rounded-xl p-4 flex items-center justify-center mb-4 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setViewingQR(qr)}
            >
              <img 
                src={getQRImageUrl(qr)}
                alt={`QR Code for ${qr.name}`}
                className="w-32 h-32"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                qr.qr_type === 'checkin' ? 'bg-blue-100 text-blue-700' :
                qr.qr_type === 'event' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {qr.qr_type}
              </span>
              <div className="text-right">
                <p className="text-xs text-gray-500">Scans</p>
                <p className="font-bold text-gray-900">{getCheckinCount(qr.qr_id)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {qrCodes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <QrCode className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No QR codes yet</h3>
          <p className="text-gray-500 mb-4">Create QR codes for club check-in locations</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create QR Code
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingQR ? 'Edit QR Code' : 'Create QR Code'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Clubhouse, Canteen, Bar"
                required
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Main building entrance"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select 
                value={formData.qr_type}
                onValueChange={(value) => setFormData({ ...formData, qr_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkin">Check-in</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="redemption">Redemption</SelectItem>
                </SelectContent>
              </Select>
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
                {editingQR ? 'Save Changes' : 'Create QR Code'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View QR Modal */}
      <Dialog open={!!viewingQR} onOpenChange={() => setViewingQR(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingQR?.name}</DialogTitle>
          </DialogHeader>
          {viewingQR && (
            <div className="text-center">
              <div className="bg-white p-6 rounded-xl inline-block mb-4">
                <img 
                  src={getQRImageUrl(viewingQR)}
                  alt={`QR Code for ${viewingQR.name}`}
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-gray-500 mb-4">{viewingQR.location}</p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => copyQRData(viewingQR)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Data
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => downloadQR(viewingQR)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}