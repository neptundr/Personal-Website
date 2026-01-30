import React from 'react';
import {motion} from 'framer-motion';
import Link from 'next/link';
import {createPageUrl} from '@/lib/utils';
import {Home, FolderOpen, Briefcase, GraduationCap, Settings, ArrowLeft, Image} from 'lucide-react';
import {useRouter} from 'next/navigation';


interface NavItem {
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    page: string;
}

interface AdminNavProps {
    currentPage: string;
}

const navItems: NavItem[] = [
    {label: 'Settings', icon: Settings, page: 'AdminSettings'},
    {label: 'Experience', icon: Briefcase, page: 'AdminProjects'},
    {label: 'Education', icon: GraduationCap, page: 'AdminEducation'},
    {label: 'Skill Icons', icon: Image, page: 'AdminSkillIcons'},
];

const AdminNav: React.FC<AdminNavProps> = ({currentPage}) => {
    const router = useRouter();

    async function handleLogout() {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/admin/logout`,
            {
                method: 'POST',
                credentials: 'include',
            }
        );

        if (res.ok) {
            router.push('/admin/login'); // redirect to login page
        } else {
            alert('Logout failed');
        }
    }

    return (
        <div className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-white/5 p-6 flex flex-col">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-xl font-light text-white">Admin Panel</h1>
                <p className="text-white/40 text-sm mt-1">Manage your portfolio</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.page;

                    return (
                        <Link key={item.page} href={createPageUrl(item.page)}>
                            <motion.div
                                whileHover={{x: 4}}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                    isActive
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon className="w-5 h-5"/>
                                <span className="font-light">{item.label}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Back to site */}
            <button
                onClick={handleLogout}
                className="px-4 py-2 mb-2 rounded-lg transition-colors bg-red-500/10 text-red-400 border border-red-500/80 hover:bg-red-500/20 hover:text-white"
            >
                Logout
            </button>

            <Link href={createPageUrl('Home')}>
                <motion.div
                    whileHover={{x: 4}}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/40 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5"/>
                    <span className="font-light">Back to Site</span>
                </motion.div>
            </Link>
        </div>
    );
};

export default AdminNav;