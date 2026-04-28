import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/auth';

export default async function AdminIndex() {
    const token = (await cookies()).get('admin_token')?.value;
    const payload = await verifyAdminToken(token);
    redirect(payload ? '/admin/settings' : '/admin/login');
}
