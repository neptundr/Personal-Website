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

/* ----------------------------- types ----------------------------- */

type ProjectType = 'work' | 'project' | 'achievement';

export interface Project {
    id: number;
    title: string;
    type?: ProjectType;
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
}

/* --------------------------- form schema -------------------------- */

type FieldConfig = {
    key: string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'select' | 'boolean' | 'array' | 'date';
    placeholder?: string;
    options?: { value: string; label: string }[];
};

const projectFields: FieldConfig[] = [
    {key: 'title', label: 'Title ("-v" for a vertical image frame; "-s" for special display)', type: 'text', placeholder: 'Title'},
    {
        key: 'type',
        label: 'Type',
        type: 'select',
        placeholder: 'Select type',
        options: [
            {value: 'work', label: 'Work Experience'},
            {value: 'project', label: 'Project'},
            {value: 'achievement', label: 'Side Quest'},
        ],
    },
    {key: 'company', label: 'Company/Organization', type: 'text'},
    {key: 'location', label: 'Location', type: 'text'},
    {key: 'start_date', label: 'Start Date (Enter 01.01.0001 to hide date from the card)', type: 'date'},
    {key: 'end_date', label: 'End Date', type: 'date'},
    {key: 'is_current', label: 'Currently Ongoing', type: 'boolean'},
    {key: 'description', label: 'Description', type: 'textarea'},
    {key: 'image_url', label: 'Image URL (comma-separated)', type: 'textarea'},
    {key: 'skills', label: 'Skills (comma-separated)', type: 'array'},
    {key: 'link', label: 'External Link', type: 'text'},
    {key: 'github_url', label: 'GitHub URL', type: 'text'},
    {key: 'order', label: 'Display Order', type: 'number'},
    {key: 'featured', label: 'Featured', type: 'boolean'},
] as const;

/* --------------------------- component --------------------------- */

export default function AdminProjects() {
    const queryClient = useQueryClient();

    const [showForm, setShowForm] = useState<boolean>(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deleteProject, setDeleteProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState<Partial<Project>>({skills: [],});

    /* ---------------------------- queries ---------------------------- */

    const {data: projects = [], isLoading} = useQuery<Project[]>({
        queryKey: ['projects'],
        queryFn: () => api.entities.Project.list(/*'order', 50*/),
    });

    /* --------------------------- mutations --------------------------- */

    const createMutation = useMutation({
        mutationFn: (data: Partial<Project>) =>
            api.entities.Project.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['projects']});
            setShowForm(false);
            setFormData({});
        },
        onError: (error) => {
            alert(error.message);
            console.error(error.message);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({id, data}: { id: number; data: Partial<Project> }) =>
            api.entities.Project.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['projects']});
            setShowForm(false);
            setEditingProject(null);
            setFormData({});
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.entities.Project.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['projects']});
            setDeleteProject(null);
        },
    });

    /* --------------------------- handlers --------------------------- */

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (editingProject) {
            updateMutation.mutate({
                id: editingProject.id,
                data: formData,
            });
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

    /* ---------------------------- render ---------------------------- */

    return (
        <AdminLayout currentPage="AdminProjects">
            <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-light text-white">Experience</h1>
                        <p className="text-white/40 mt-2">
                            Manage work, projects, and achievements
                        </p>
                    </div>

                    {!showForm && (
                        <Button
                            onClick={() => setShowForm(true)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2"/>
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
                                isLoading={
                                    createMutation.isPending || updateMutation.isPending
                                }
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
                        {projects.map((project, index) => (
                            <motion.div
                                key={project.id}
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: index * 0.05}}
                            >
                                <Card className="bg-zinc-950 border-white/10 hover:border-white/20 transition-colors">
                                    <CardContent className="p-6 pt-6">
                                        <div className="flex items-start gap-4">
                                            {project.image_url && (
                                                <img
                                                    src={project.image_url?.split(',')[0]?.trim()}
                                                    alt={project.title}
                                                    className="w-24 h-16 object-cover rounded-lg"
                                                />
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-light text-white truncate">
                                                        {project.title}
                                                    </h3>
                                                    {project.featured && (
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/>
                                                    )}
                                                </div>

                                                <p className="text-white/40 text-sm mt-1 line-clamp-2">
                                                    {project.description}
                                                </p>

                                                <div className="flex items-center gap-4 mt-3">
                                                    {project.link && (
                                                        <a
                                                            href={project.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-white/40 hover:text-red-400"
                                                        >
                                                            <ExternalLink className="w-4 h-4"/>
                                                        </a>
                                                    )}

                                                    {project.github_url && (
                                                        <a
                                                            href={project.github_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-white/40 hover:text-white"
                                                        >
                                                            <Github className="w-4 h-4"/>
                                                        </a>
                                                    )}

                                                    {project.skills?.length ? (
                                                        <span className="text-white/30 text-xs">
                              {project.skills.slice(0, 3).join(', ')}
                            </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(project)}
                                                >
                                                    <Pencil className="w-4 h-4"/>
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteProject(project)}
                                                    className="hover:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                <AlertDialog
                    open={!!deleteProject}
                    onOpenChange={() => setDeleteProject(null)}
                >
                    <AlertDialogContent className="bg-zinc-950 border-white/10">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">
                                Delete Item
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-white/60">
                                Are you sure you want to delete “{deleteProject?.title}”?
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() =>
                                    deleteProject && deleteMutation.mutate(deleteProject.id)
                                }
                                className="bg-red-500 hover:bg-red-600"
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