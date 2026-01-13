import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, Edit2, Trash2, MoreVertical, MapPin, Star, Users } from 'lucide-react';
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

const eventTypes = [
  { value: 'social', label: 'Social' },
  { value: 'fundraiser', label: 'Fundraiser' },
  { value: 'training', label: 'Training' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'community', label: 'Community' },
  { value: 'other', label: 'Other' }
];

const typeColors = {
  social: 'bg-purple-100 text-purple-700',
  fundraiser: 'bg-emerald-100 text-emerald-700',
  training: 'bg-blue-100 text-blue-700',
  presentation: 'bg-amber-100 text-amber-700',
  community: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700'
};

const defaultEvent = {
  title: '',
  description: '',
  event_type: 'social',
  date_time: '',
  end_time: '',
  venue: '',
  venue_address: '',
  image_url: '',
  registration_url: '',
  is_members_only: false,
  is_featured: false,
  is_active: true
};

export default function AdminEvents() {
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(defaultEvent);
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('date_time')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      setShowModal(false);
      setFormData(defaultEvent);
      toast.success('Event created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      setShowModal(false);
      setEditingEvent(null);
      setFormData(defaultEvent);
      toast.success('Event updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast.success('Event deleted');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setFormData(event);
    setShowModal(true);
  };

  return (
    <AdminLayout title="Club Events" currentPage="AdminEvents">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">Manage club events and activities</p>
        <Button onClick={() => { setShowModal(true); setEditingEvent(null); setFormData(defaultEvent); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div 
            key={event.id}
            className={`bg-white rounded-xl border overflow-hidden ${
              event.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}
          >
            {event.image_url && (
              <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {event.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[event.event_type]}`}>
                    {eventTypes.find(t => t.value === event.event_type)?.label || event.event_type}
                  </span>
                  {event.is_members_only && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Members
                    </span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(event)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updateMutation.mutate({ 
                        id: event.id, 
                        data: { is_featured: !event.is_featured }
                      })}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      {event.is_featured ? 'Remove Featured' : 'Set Featured'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updateMutation.mutate({ 
                        id: event.id, 
                        data: { is_active: !event.is_active }
                      })}
                    >
                      {event.is_active ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteMutation.mutate(event.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {event.date_time && format(new Date(event.date_time), 'MMM d, yyyy h:mm a')}
                </div>
                {event.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {event.venue}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No events yet</h3>
          <p className="text-gray-500 mb-4">Create your first club event</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Type</Label>
                <Select 
                  value={formData.event_type}
                  onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.date_time ? format(new Date(formData.date_time), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setFormData({ ...formData, date_time: new Date(e.target.value).toISOString() })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Venue</Label>
                <Input
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Venue name"
                />
              </div>
              <div>
                <Label>Venue Address</Label>
                <Input
                  value={formData.venue_address}
                  onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Registration URL</Label>
              <Input
                value={formData.registration_url}
                onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_members_only}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_members_only: checked })}
                />
                <Label>Members Only</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label>Featured</Label>
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
                {editingEvent ? 'Save Changes' : 'Create Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}