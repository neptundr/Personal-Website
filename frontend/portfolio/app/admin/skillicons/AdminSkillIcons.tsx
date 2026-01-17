'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import AdminLayout from '../../../components/admin/AdminLayout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Upload } from 'lucide-react';

export default function AdminSkillIcons() {
  const queryClient = useQueryClient();
  const [skillName, setSkillName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: skillIcons, isLoading } = useQuery({
    queryKey: ['skillIcons'],
    queryFn: () => api.entities.SkillIcon.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.SkillIcon.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillIcons'] });
      setSkillName('');
      setIconUrl('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.SkillIcon.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillIcons'] });
    }
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setIconUrl(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (skillName && iconUrl) {
      createMutation.mutate({ skill_name: skillName, icon_url: iconUrl });
    }
  };

  return (
    <AdminLayout currentPage="AdminSkillIcons">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-light text-white">Skill Icons</h1>
          <p className="text-white/40 mt-2">Upload custom icons for skills</p>
        </div>

        {/* Add new skill icon */}
        <Card className="bg-zinc-950 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Add Skill Icon</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-white/80 mb-2 block">Skill Name</Label>
                <Input
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g., Python, React, Unity"
                  className="bg-black border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <div>
                <Label className="text-white/80 mb-2 block">Icon</Label>
                <div className="space-y-3">
                  <Input
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="Or paste icon URL..."
                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                  />

                  <Label htmlFor="icon-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-white/10 bg-black hover:bg-white/5 transition-colors">
                      <Upload className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-sm">
                        {uploading ? 'Uploading...' : 'Upload Icon'}
                      </span>
                    </div>
                    <input
                      id="icon-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </Label>

                  {iconUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-black border border-white/10">
                      <img src={iconUrl} alt="Preview" className="w-8 h-8 object-contain" />
                      <span className="text-white/60 text-sm">Icon preview</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={!skillName || !iconUrl || createMutation.isPending}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Skill Icon
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List of skill icons */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillIcons.map((skill) => (
              <Card key={skill.id} className="bg-zinc-950 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={skill.icon_url} alt={skill.skill_name} className="w-10 h-10 object-contain" />
                      <span className="text-white font-light">{skill.skill_name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(skill.id)}
                      className="text-white/40 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {skillIcons.length === 0 && !isLoading && (
          <div className="text-center py-16 text-white/40">
            <p>No custom skill icons yet. Add your first one!</p>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}