'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        router.push('/');
        router.refresh();
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
                <h1 className="text-3xl font-bold text-slate-900">
                    Welcome back
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Sign in to your SpendSense account.
                </p>

                <form onSubmit={handleLogin} className="mt-6 space-y-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 text-[#242321] placeholder:text-[#8A857F] [-webkit-text-fill-color:#242321] [&:-webkit-autofill]:[-webkit-text-fill-color:#242321]"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 text-[#242321] placeholder:text-[#8A857F]"
                            placeholder="Your password"
                        />
                    </div>

                    {error && (
                        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Don't have an account?{' '}
                    <Link
                        href="/signup"
                        className="font-medium text-blue-600 hover:underline"
                    >
                        Create one
                    </Link>
                </p>
            </div>
        </main>
    );
}