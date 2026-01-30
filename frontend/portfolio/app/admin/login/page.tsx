'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function submit() {
        if (loading) return;
        setLoading(true);

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/admin/login`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({username, password}),
            }
        );

        setLoading(false);

        if (res.ok) window.location.href = '/admin/settings';
        else alert('Wrong credentials');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950" style={{fontFamily: 'var(--font-codec'}}>
            <Card className="w-full max-w-sm p-6 bg-zinc-900 border-white/10 shadow-2xl rounded-2xl">
                <CardContent className="flex flex-col gap-4">
                    <h2 className="text-2xl font-light text-white text-center">
                        Admin Login
                    </h2>

                    <input
                        type="text"
                        onChange={e => setUsername(e.target.value)}
                        className="bg-zinc-800 text-white placeholder:text-gray-400 px-3 py-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                        placeholder="Username"
                    />
                    <input
                        type="password"
                        onChange={e => setPassword(e.target.value)}
                        className="bg-zinc-800 text-white placeholder:text-gray-400 px-3 py-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                        placeholder="Password"
                    />

                    <Button
                        onClick={submit}
                        disabled={loading}
                        className="rounded-lg transition-colors bg-red-500/10 text-red-400 border border-red-500/80 hover:bg-red-500/20 hover:text-white w-full"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}