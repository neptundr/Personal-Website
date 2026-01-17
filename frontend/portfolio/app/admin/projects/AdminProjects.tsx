'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import AdminLayout from '../../../components/admin/AdminLayout';
import EntityForm from '../../../components/admin/EntityForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Star, ExternalLink, Github } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const projectFields = [
  { key: 'title', label: 'Title', type: 'text', placeholder: 'Title' },
  { key: 'type', label: 'Type', type: 'select', placeholder: 'Select type', options: [
    { value: 'work', label: 'Work Experience' },
    { value: 'project', label: 'Project' },
    { value: 'achievement', label: 'Achievement' }
  ]},
  { key: 'company', label: 'Company/Organization', type: 'text', placeholder: 'Company name (for work)' },
  { key: 'location', label: 'Location', type: 'text', placeholder: 'City, Country' },
  { key: 'start_date', label: 'Start Date', type: 'date' },
  { key: 'end_date', label: 'End Date', type: 'date' },
  { key: 'is_current', label: 'Currently Ongoing', type: 'boolean', description: 'This is active/current' },
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe this experience...' },
  { key: 'image_url', label: 'Image URL', type: 'text', placeholder: 'https://...' },
  { key: 'skills', label: 'Skills (comma-separated)', type: 'array', placeholder: 'React, Python, Machine Learning' },
  { key: 'link', label: 'External Link', type: 'text', placeholder: 'https://...' },
  { key: 'github_url', label: 'GitHub URL', type: 'text', placeholder: 'https://github.com/...' },
  { key: 'order', label: 'Display Order', type: 'number', placeholder: '1' },
  { key: 'featured', label: 'Featured', type: 'boolean', description: 'Highlight this item' },
];

export default function AdminProjects() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);
  const [formData, setFormData] = useState({});

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.entities.Project.list('order', 50),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
      setFormData({});
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
      setEditingProject(null);
      setFormData({});
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteProject(null);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData(project);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProject(null);
    setFormData({});
  };

  return (
    <AdminLayout currentPage="AdminProjects">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-white">Experience</h1>
            <p className="text-white/40 mt-2">Manage work, projects, and achievements</p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showForm && (
            <div className="mb-8">
              <EntityForm
                title={editingProject ? 'Edit Item' : 'New Item'}
                fields={projectFields}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            </div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-zinc-950 border-white/10 hover:border-white/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {project.image_url && (
                        <img
                          src={project.image_url}
                          alt={project.title}
                          className="w-24 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-light text-white truncate">{project.title}</h3>
                          {project.featured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <p className="text-white/40 text-sm mt-1 line-clamp-2">{project.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          {project.link && (
                            <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-red-400 transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {project.github_url && (
                            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                          {project.skills && project.skills.length > 0 && (
                            <span className="text-white/30 text-xs">{project.skills.slice(0, 3).join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(project)}
                          className="text-white/40 hover:text-white"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteProject(project)}
                          className="text-white/40 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {projects.length === 0 && (
              <div className="text-center py-16 text-white/40">
                <p>No experience items yet. Add your first item!</p>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
          <AlertDialogContent className="bg-zinc-950 border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Item</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                Are you sure you want to delete "{deleteProject?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deleteProject.id)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </AdminLayout>
  );
}