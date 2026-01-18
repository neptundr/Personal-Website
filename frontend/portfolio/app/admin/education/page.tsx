'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import AdminLayout from '../../../components/admin/AdminLayout';
import EntityForm from '../../../components/admin/EntityForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, GraduationCap, School } from 'lucide-react';
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

const educationFields = [
  { key: 'institution', label: 'Institution Name', type: 'text', placeholder: 'University/School name' },
  { key: 'institution_url', label: 'Institution URL', type: 'text', placeholder: 'https://university.edu' },
  { key: 'degree', label: 'Degree/Diploma', type: 'text', placeholder: "Bachelor's in Computer Science" },
  { key: 'field', label: 'Field of Study', type: 'text', placeholder: 'Computer Science' },
  { key: 'start_year', label: 'Start Year', type: 'text', placeholder: '2020' },
  { key: 'end_year', label: 'End Year', type: 'text', placeholder: '2024 (or expected)' },
  { key: 'type', label: 'Type', type: 'select', placeholder: 'Select type', options: [
    { value: 'school', label: 'High School' },
    { value: 'university', label: 'University/College' }
  ]},
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Additional details, achievements, etc.' },
  { key: 'logo_url', label: 'Logo URL', type: 'text', placeholder: 'https://...' },
  { key: 'order', label: 'Display Order', type: 'number', placeholder: '1' },
];

export default function AdminEducation() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [formData, setFormData] = useState({});

    const {data: education, isLoading} = useQuery({
        queryKey: ['education'],
        queryFn: () => api.entities.Education.list('order', 10),
        initialData: []
    });

    const createMutation = useMutation({
        mutationFn: (data) => api.entities.Education.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['education']});
            setShowForm(false);
            setFormData({});
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({id, data}) => api.entities.Education.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['education']});
            setShowForm(false);
            setEditingItem(null);
            setFormData({});
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.entities.Education.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['education']});
            setDeleteItem(null);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            updateMutation.mutate({id: editingItem.id, data: formData});
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData(item);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({});
    };

    return (
        <AdminLayout currentPage="AdminEducation">
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-light text-white">Education</h1>
                        <p className="text-white/40 mt-2">Manage your educational background</p>
                    </div>
                    {!showForm && (
                        <Button
                            onClick={() => setShowForm(true)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2"/>
                            Add Education
                        </Button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {showForm && (
                        <div className="mb-8">
                            <EntityForm
                                title={editingItem ? 'Edit Education' : 'New Education'}
                                fields={educationFields}
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
                        <div
                            className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {education.map((edu, index) => {
                            const Icon = edu.type === 'university' ? GraduationCap : School;
                            return (
                                <motion.div
                                    key={edu.id}
                                    initial={{opacity: 0, y: 20}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{delay: index * 0.05}}
                                >
                                    <Card
                                        className="bg-zinc-950 border-white/10 hover:border-white/20 transition-colors">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                                    <Icon className="w-5 h-5 text-red-400"/>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-light text-white">{edu.institution}</h3>
                                                    <p className="text-white/60 text-sm">{edu.degree}</p>
                                                    {edu.field && <p className="text-white/40 text-sm">{edu.field}</p>}
                                                    <p className="text-white/30 text-xs mt-1">
                                                        {edu.start_year} — {edu.end_year || 'Present'}
                                                    </p>
                                                    {edu.description && (
                                                        <p className="text-white/40 text-sm mt-2 line-clamp-2">{edu.description}</p>
                                                    )}
                                                </div>
                                                {edu.logo_url && (
                                                    <img
                                                        src={edu.logo_url}
                                                        alt={edu.institution}
                                                        className="w-12 h-12 object-contain opacity-50"
                                                    />
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(edu)}
                                                        className="text-white/40 hover:text-white"
                                                    >
                                                        <Pencil className="w-4 h-4"/>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteItem(edu)}
                                                        className="text-white/40 hover:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4"/>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}

                        {education.length === 0 && (
                            <div className="text-center py-16 text-white/40">
                                <p>No education yet. Add your school and university!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Delete Confirmation */}
                <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
                    <AlertDialogContent className="bg-zinc-950 border-white/10">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete Education</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/60">
                                Are you sure you want to delete "{deleteItem?.institution}"? This action cannot be
                                undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => deleteMutation.mutate(deleteItem.id)}
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