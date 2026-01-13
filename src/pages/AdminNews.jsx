import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Newspaper, Edit2, Trash2, MoreVertical, Star, Eye, EyeOff } from 'lucide-react';
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
  { value: 'announcement', label: 'Announcement' },
  { value: 'match_report', label: 'Match Report' },
  { value: 'player_news', label: 'Player News' },
  { value: 'community', label: 'Community' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'general', label: 'General' }
];

const categoryColors = {
  announcement: 'bg-blue-100 text-blue-700',
  match_report: 'bg-emerald-100 text-emerald-700',
  player_news: 'bg-purple-100 text-purple-700',
  community: 'bg-amber-100 text-amber-700',
  sponsor: 'bg-pink-100 text-pink-700',
  general: 'bg-gray-100 text-gray-700'
};

const defaultNews = {
  title: '',
  summary: '',
  content: '',
  image_url: '',
  category: 'general',
  is_featured: false,
  is_published: true,
  publish_date: new Date().toISOString()
};

export default function AdminNews() {
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState(defaultNews);
  const queryClient = useQueryClient();

  const { data: news = [] } = useQuery({
    queryKey: ['news'],
    queryFn: () => base44.entities.News.list('-publish_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.News.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['news']);
      setShowModal(false);
      setFormData(defaultNews);
      toast.success('News article created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.News.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['news']);
      setShowModal(false);
      setEditingNews(null);
      setFormData(defaultNews);
      toast.success('News article updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.News.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['news']);
      toast.success('News article deleted');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingNews) {
      updateMutation.mutate({ id: editingNews.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (item) => {
    setEditingNews(item);
    setFormData(item);
    setShowModal(true);
  };

  return (
    <AdminLayout title="News & Announcements" currentPage="AdminNews">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">Manage club news and announcements</p>
        <Button onClick={() => { setShowModal(true); setEditingNews(null); setFormData(defaultNews); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Article
        </Button>
      </div>

      {/* News Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Article</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {news.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Newspaper className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        {item.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                        <span className="font-medium text-gray-900">{item.title}</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{item.summary}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[item.category]}`}>
                    {categories.find(c => c.value === item.category)?.label || item.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {item.publish_date && format(new Date(item.publish_date), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.is_published ? 'Published' : 'Draft'}
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
                      <DropdownMenuItem onClick={() => openEdit(item)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updateMutation.mutate({ 
                          id: item.id, 
                          data: { is_featured: !item.is_featured }
                        })}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        {item.is_featured ? 'Remove Featured' : 'Set Featured'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updateMutation.mutate({ 
                          id: item.id, 
                          data: { is_published: !item.is_published }
                        })}
                      >
                        {item.is_published ? (
                          <><EyeOff className="w-4 h-4 mr-2" /> Unpublish</>
                        ) : (
                          <><Eye className="w-4 h-4 mr-2" /> Publish</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(item.id)}
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

        {news.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No news yet</h3>
            <p className="text-gray-500">Create your first news article</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Edit Article' : 'Add Article'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Article title"
                required
              />
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Brief summary..."
                rows={2}
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Full article content (Markdown supported)..."
                rows={8}
                required
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
                <Label>Publish Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.publish_date ? format(new Date(formData.publish_date), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setFormData({ ...formData, publish_date: new Date(e.target.value).toISOString() })}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label>Published</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingNews ? 'Save Changes' : 'Create Article'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}