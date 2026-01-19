'use client';

import React, {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '@/api/client';
import AdminLayout from '../../../components/admin/AdminLayout';
import EntityForm from '../../../components/admin/EntityForm';
import {motion, AnimatePresence} from 'framer-motion';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Plus, Pencil, Trash2, Star, ExternalLink, Github} from 'lucide-react';
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

/* ===================== TYPES ===================== */

type SelectOption = {
    value: string;
    label: string;
};

type FieldConfig = {
    key: keyof Project | string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'select' | 'boolean' | 'date' | 'array';
    placeholder?: string;
    description?: string;
    options?: SelectOption[];
};

type Project = {
    id: number;
    title: string;
    type: 'work' | 'project' | 'achievement';
    company?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
    image_url?: string;
    skills?: string[];
    link?: string;
    github_url?: string;
    order?: number;
    featured?: boolean;
};

/* ===================== FIELDS ===================== */

const projectFields: FieldConfig[] = [
    {key: 'title', label: 'Title', type: 'text', placeholder: 'Title'},
    {
        key: 'type',
        label: 'Type',
        type: 'select',
        placeholder: 'Select type',
        options: [
            {value: 'work', label: 'Work Experience'},
            {value: 'project', label: 'Project'},
            {value: 'achievement', label: 'Achievement'},
        ],
    },
    {key: 'company', label: 'Company/Organization', type: 'text'},
    {key: 'location', label: 'Location', type: 'text'},
    {key: 'start_date', label: 'Start Date', type: 'date'},
    {key: 'end_date', label: 'End Date', type: 'date'},
    {key: 'is_current', label: 'Currently Ongoing', type: 'boolean'},
    {key: 'description', label: 'Description', type: 'textarea'},
    {key: 'image_url', label: 'Image URL', type: 'text'},
    {key: 'skills', label: 'Skills (comma-separated)', type: 'array'},
    {key: 'link', label: 'External Link', type: 'text'},
    {key: 'github_url', label: 'GitHub URL', type: 'text'},
    {key: 'order', label: 'Display Order', type: 'number'},
    {key: 'featured', label: 'Featured', type: 'boolean'},
];

/* ===================== COMPONENT ===================== */

export default function AdminProjects() {
    const queryClient = useQueryClient();

    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deleteProject, setDeleteProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState<Partial<Project>>({});

    const {data: projects = [], isLoading} = useQuery<Project[]>({
        queryKey: ['projects'],
        queryFn: () => api.entities.Project.list(),
    });

    const createMutation = useMutation<Project, unknown, Partial<Project>>({
        mutationFn: (data) => api.entities.Project.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['projects']});
            setShowForm(false);
            setFormData({});
        },
    });

    const updateMutation = useMutation<
        Project,
        unknown,
        { id: number; data: Partial<Project> }
    >({
        mutationFn: ({id, data}) => api.entities.Project.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['projects']});
            setShowForm(false);
            setEditingProject(null);
            setFormData({});
        },
    });

    const deleteMutation = useMutation<void, unknown, number>({
        mutationFn: (id) => api.entities.Project.delete(id).then(() => {
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['projects']});
            setDeleteProject(null);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingProject) {
            updateMutation.mutate({id: editingProject.id, data: formData});
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setFormData(project);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingProject(null);
        setFormData({});
    };

    /* ===================== JSX ===================== */

    return (
        <AdminLayout currentPage="AdminProjects">
            <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}>
                {/* header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-light text-white">Experience</h1>
                        <p className="text-white/40 mt-2">Manage work, projects, and achievements</p>
                    </div>
                    {!showForm && (
                        <Button onClick={() => setShowForm(true)} className="bg-red-500">
                            <Plus className="w-4 h-4 mr-2"/>
                            Add Item
                        </Button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {showForm && (
                        <EntityForm
                            title={editingProject ? 'Edit Item' : 'New Item'}
                            fields={projectFields}
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        />
                    )}
                </AnimatePresence>

                {/* rest unchanged */}
            </motion.div>
        </AdminLayout>
    );
}