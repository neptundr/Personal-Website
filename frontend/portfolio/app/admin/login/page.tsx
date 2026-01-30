'use client';

import {useState} from 'react';

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
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col gap-3">
                <input
                    onChange={e => setUsername(e.target.value)}
                    className="bg-white px-3 py-2 rounded text-black placeholder:text-gray-400"
                    placeholder="Username"
                />
                <input
                    type="password"
                    onChange={e => setPassword(e.target.value)}
                    className="bg-white px-3 py-2 rounded text-black placeholder:text-gray-400"
                    placeholder="Password"
                />
                <button
                    disabled={loading}
                    onClick={submit}
                    className="px-4 py-2 rounded bg-red-500 text-white disabled:opacity-50"
                >
                    Login
                </button>
            </div>
        </div>
    );
}