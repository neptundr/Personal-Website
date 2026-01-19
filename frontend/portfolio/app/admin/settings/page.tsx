'use client';

import React, {useEffect, useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {motion} from 'framer-motion';

import {api} from '@/api/client';
import AdminLayout from '../../../components/admin/AdminLayout';

import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';

import {
    Save,
    User,
    Link as LinkIcon,
    Briefcase,
    Upload,
    Video,
} from 'lucide-react';

import type {SiteSettings} from '@/types/types';

/* ----------------------------- types ----------------------------- */

type SiteSettingsForm = Omit<SiteSettings, 'id'>;

/* --------------------------- component --------------------------- */

export default function AdminSettings() {
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<SiteSettingsForm>({
        available_for_hire: true,
        hero_name: 'Denis',
        hero_subtitle: '',
        hero_video_url: '',
        love_items: [],
        linkedin_url: '',
        github_url: '',
        email: '',
        twitter_url: '',
        resume_url: '',
    });

    const [uploading, setUploading] = useState(false);
    const [uploadingResume, setUploadingResume] = useState(false);

    /* ---------------------------- queries ---------------------------- */

    const {data: settings, isLoading} = useQuery<SiteSettings | null>({
        queryKey: ['siteSettings'],
        queryFn: async () => {
            const list = await api.entities.SiteSettings.list();
            return list[0] ?? null;
        },
    });

    useEffect(() => {
        if (!settings) return;

        setFormData({
            available_for_hire: settings.available_for_hire ?? false,
            hero_name: settings.hero_name ?? 'Denis',
            hero_subtitle: settings.hero_subtitle ?? '',
            hero_video_url: settings.hero_video_url ?? '',
            love_items: settings.love_items ?? [],
            linkedin_url: settings.linkedin_url ?? '',
            github_url: settings.github_url ?? '',
            email: settings.email ?? '',
            twitter_url: settings.twitter_url ?? '',
            resume_url: settings.resume_url ?? '',
        });
    }, [settings]);

    /* ---------------------------- uploads ---------------------------- */

    const handleVideoUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const {file_url} =
                await api.uploadFile(file);

            setFormData(prev => ({
                ...prev,
                hero_video_url: file_url,
            }));
        } finally {
            setUploading(false);
        }
    };

    const handleResumeUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingResume(true);
        try {
            const {file_url} =
                await api.uploadFile(file);

            setFormData(prev => ({
                ...prev,
                resume_url: file_url,
            }));
        } finally {
            setUploadingResume(false);
        }
    };

    /* --------------------------- mutation --------------------------- */

    const saveMutation = useMutation<
        SiteSettings,
        Error,
        SiteSettingsForm
    >({
        mutationFn: async (data) => {
            if (settings?.id) {
                return api.entities.SiteSettings.update(settings.id, data);
            }
            return api.entities.SiteSettings.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['siteSettings']});
        },
    });

    const handleSubmit = (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    /* ---------------------------- render ---------------------------- */

    if (isLoading) {
        return (
            <AdminLayout currentPage="Page">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout currentPage="Page">
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                className="max-w-3xl"
            >
                <div className="mb-8">
                    <h1 className="text-3xl font-light text-white">
                        Site Settings
                    </h1>
                    <p className="text-white/40 mt-2">
                        Configure your portfolio website
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Availability */}
                    <Card className="bg-zinc-950 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-red-400"/>
                                Availability
                            </CardTitle>
                            <CardDescription className="text-white/40">
                                Show or hide the "Available for Hire" badge
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Label className="text-white/80">
                                    Available for Hire
                                </Label>
                                <Switch
                                    checked={formData.available_for_hire ?? false}
                                    onCheckedChange={(checked: boolean) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            available_for_hire: checked,
                                        }))
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hero Section */}
                    <Card className="bg-zinc-950 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-red-400"/>
                                Hero Section
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                value={formData.hero_name}
                                onChange={(e: any) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        hero_name: e.target.value,
                                    }))
                                }
                                placeholder="Your name"
                            />

                            <Textarea
                                value={formData.hero_subtitle}
                                onChange={(e: any) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        hero_subtitle: e.target.value,
                                    }))
                                }
                                placeholder="A brief introduction..."
                            />

                            <Textarea
                                value={(formData.love_items ?? ["coding"]).join(', ')}
                                onChange={(e) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        love_items: e.target.value
                                            .split(',')
                                            .map(s => s.trim())
                                    .filter(Boolean),
                                }))
                                }
                                placeholder="coding, math, music..."
                                rows={2}
                            />
                        </CardContent>
                    </Card>

                    {/* Save */}
                    <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="w-full bg-red-500 hover:bg-red-600"
                    >
                        {saveMutation.isPending ? (
                            <div
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2"/>
                                Save Settings
                            </>
                        )}
                    </Button>
                </form>
            </motion.div>
        </AdminLayout>
    );
}