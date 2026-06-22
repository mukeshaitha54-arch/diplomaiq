'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { signInAction } from '@/lib/insforge/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import { Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [requireVerification, setRequireVerification] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setSuccessMsg('Password reset successful. Please sign in.');
    }
    // Handle email verification link redirect
    const insforgeStatus = searchParams.get('insforge_status');
    const insforgeType = searchParams.get('insforge_type');
    if (insforgeStatus === 'success' && insforgeType === 'verify_email') {
      setSuccessMsg('Email verified! Please sign in with your credentials.');
    }
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await signInAction(formData);
      if (result?.error) {
        setErrorMsg(result.error);
        if (result.requireVerification) {
          setRequireVerification(true);
          setVerifyEmail(result.email ?? '');
        }
      }
      // On success, signInAction calls redirect() internally
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-xl shadow-indigo-900/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold font-heading text-white">
            Welcome back
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter your email and password to sign in to your account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-md px-4 py-2 text-sm text-emerald-400">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-md px-4 py-2 text-sm text-red-400">
                {errorMsg}
              </div>
            )}

            {requireVerification && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-md px-4 py-2 text-sm text-amber-400">
                Your email isn't verified yet.{' '}
                <Link
                  href={`/signup?verify=1&email=${encodeURIComponent(verifyEmail)}`}
                  className="underline font-medium"
                >
                  Verify now →
                </Link>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m.doe@example.com"
                required
                autoComplete="email"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
            >
              {isPending ? 'Signing in…' : 'Sign In'}
            </Button>

            <div className="text-sm text-center text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-indigo-400 hover:text-indigo-300"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LoginContent />
    </Suspense>
  );
}
