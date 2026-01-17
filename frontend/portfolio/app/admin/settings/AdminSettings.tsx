'use client';

import React, {useState, useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '@/api/client';
import AdminLayout from '../../../components/admin/AdminLayout';
import {motion} from 'framer-motion';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Save, User, Link as LinkIcon, Briefcase, Upload, Video} from 'lucide-react';

export default function AdminSettings() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        available_for_hire: true,
        hero_name: 'Denis',
        hero_subtitle: '',
        hero_video_url: '',
        love_items: [],
        linkedin_url: '',
        github_url: '',
        email: '',
        twitter_url: '',
        resume_url: ''
    });
    const [uploading, setUploading] = useState(false);
    const [uploadingResume, setUploadingResume] = useState(false);

    const {data: settings, isLoading} = useQuery({
        queryKey: ['siteSettings'],
        queryFn: async () => {
            const list = await api.entities.SiteSettings.list();
            return list[0] || null;
        }
    });

    useEffect(() => {
        if (settings) {
            setFormData({
                available_for_hire: settings.available_for_hire ?? true,
                hero_name: settings.hero_name || 'Denis',
                hero_subtitle: settings.hero_subtitle || '',
                hero_video_url: settings.hero_video_url || '',
                love_items: settings.love_items || [],
                linkedin_url: settings.linkedin_url || '',
                github_url: settings.github_url || '',
                email: settings.email || '',
                twitter_url: settings.twitter_url || '',
                resume_url: settings.resume_url || ''
            });
        }
    }, [settings]);

    const handleVideoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const {file_url} = await api.integrations.Core.UploadFile({file});
            setFormData({...formData, hero_video_url: file_url});
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingResume(true);
        try {
            const {file_url} = await api.integrations.Core.UploadFile({file});
            setFormData({...formData, resume_url: file_url});
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploadingResume(false);
        }
    };

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (settings?.id) {
                return api.entities.SiteSettings.update(settings.id, data);
            } else {
                return api.entities.SiteSettings.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['siteSettings']});
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <AdminLayout currentPage="AdminSettings">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout currentPage="AdminSettings">
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                className="max-w-3xl"
            >
                <div className="mb-8">
                    <h1 className="text-3xl font-light text-white">Site Settings</h1>
                    <p className="text-white/40 mt-2">Configure your portfolio website</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Hire Status */}
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
                                <Label htmlFor="hire-switch" className="text-white/80">Available for Hire</Label>
                                <Switch
                                    id="hire-switch"
                                    checked={formData.available_for_hire}
                                    onCheckedChange={(checked) => setFormData({
                                        ...formData,
                                        available_for_hire: checked
                                    })}
                                    className="data-[state=checked]:bg-red-500"
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
                            <CardDescription className="text-white/40">
                                Customize your hero section content
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-white/80 mb-2 block">Name</Label>
                                <Input
                                    value={formData.hero_name}
                                    onChange={(e) => setFormData({...formData, hero_name: e.target.value})}
                                    placeholder="Your name"
                                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                                />
                            </div>
                            <div>
                                <Label className="text-white/80 mb-2 block">Subtitle</Label>
                                <Textarea
                                    value={formData.hero_subtitle}
                                    onChange={(e) => setFormData({...formData, hero_subtitle: e.target.value})}
                                    placeholder="A brief introduction about yourself..."
                                    className="bg-black border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
                                />
                            </div>
                            <div>
                                <Label className="text-white/80 mb-2 block">"I love X" Items (comma-separated)</Label>
                                <Textarea
                                    value={(formData.love_items || []).join(', ')}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        love_items: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                    })}
                                    placeholder="coding, Python, creativity, innovation..."
                                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                                    rows={2}
                                />
                                <p className="text-xs text-white/30 mt-1">These will rotate in the hero section</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hero Video */}
                    <Card className="bg-zinc-950 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Video className="w-5 h-5 text-red-400"/>
                                Hero Video
                            </CardTitle>
                            <CardDescription className="text-white/40">
                                Upload a background video for the hero section
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-white/80 mb-2 block">Video URL</Label>
                                <Input
                                    value={formData.hero_video_url}
                                    onChange={(e) => setFormData({...formData, hero_video_url: e.target.value})}
                                    placeholder="Or paste video URL..."
                                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label
                                    htmlFor="video-upload"
                                    className="flex-1 cursor-pointer"
                                >
                                    <div
                                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-white/10 bg-black hover:bg-white/5 transition-colors">
                                        <Upload className="w-4 h-4 text-white/60"/>
                                        <span className="text-white/60 text-sm">
                      {uploading ? 'Uploading...' : 'Upload Video File'}
                    </span>
                                    </div>
                                    <input
                                        id="video-upload"
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </Label>
                            </div>
                            {formData.hero_video_url && (
                                <div className="mt-4">
                                    <video
                                        src={formData.hero_video_url}
                                        className="w-full h-40 object-cover rounded-lg"
                                        controls
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact Links */}
                    <Card className="bg-zinc-950 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-red-400"/>
                                Contact Links
                            </CardTitle>
                            <CardDescription className="text-white/40">
                                Add your social and contact links
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-white/80 mb-2 block">Email</Label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="your@email.com"
                                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                                />
                            </div>
                            <div>
                                <Label className="text-white/80 mb-2 block">GitHub URL</Label>
                                <Input
                                    value={formData.github_url}
                                    onChange={(e) => setFormData({...formData, github_url: e.target.value})}
                                    placeholder="https://github.com/username"
                                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                                />
                            </div>
                            <div>
                                <Label className="text-white/80 mb-2 block">LinkedIn URL</Label>
                                <Input
                                    value={formData.linkedin_url}
                                    onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                                    placeholder="https://linkedin.com/in/username"
                                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                                />
                            </div>
                            <div>
                                <Label className="text-white/80 mb-2 block">Twitter URL</Label>
                                <Input
                                    value={formData.twitter_url}
                                    onChange={(e) => setFormData({...formData, twitter_url: e.target.value})}
                                    placeholder="https://twitter.com/username"
                                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                                />
                            </div>
                            <div>
                                <Label className="text-white/80 mb-2 block">Resume</Label>
                                <Input
                                    value={formData.resume_url}
                                    onChange={(e) => setFormData({...formData, resume_url: e.target.value})}
                                    placeholder="Or paste resume URL..."
                                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                                />
                                <div className="mt-2">
                                    <Label
                                        htmlFor="resume-upload"
                                        className="cursor-pointer"
                                    >
                                        <div
                                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-white/10 bg-black hover:bg-white/5 transition-colors">
                                            <Upload className="w-4 h-4 text-white/60"/>
                                            <span className="text-white/60 text-sm">
                        {uploadingResume ? 'Uploading...' : 'Upload Resume File'}
                      </span>
                                        </div>
                                        <input
                                            id="resume-upload"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleResumeUpload}
                                            className="hidden"
                                            disabled={uploadingResume}
                                        />
                                    </Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="w-full bg-red-500 hover:bg-red-600 text-white"
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

                    {saveMutation.isSuccess && (
                        <motion.p
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            className="text-green-400 text-sm text-center"
                        >
                            Settings saved successfully!
                        </motion.p>
                    )}
                </form>
            </motion.div>
        </AdminLayout>
    );
}