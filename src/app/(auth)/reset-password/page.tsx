'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { resetPasswordAction } from '@/lib/insforge/actions';
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

export default function ResetPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg('');
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (result?.error) {
        setErrorMsg(result.error);
      }
      // On success, resetPasswordAction redirects to /login?reset=success
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-xl shadow-indigo-900/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold font-heading text-white">
            Reset password
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter your email, the 6-digit code from your email, and your new password.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-md px-4 py-2 text-sm text-red-400">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
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
              <Label htmlFor="code" className="text-slate-300">Reset Code</Label>
              <Input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                required
                className="bg-slate-950 border-slate-800 text-white text-center tracking-widest placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                autoComplete="new-password"
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
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
              {isPending ? 'Resetting…' : 'Reset Password'}
            </Button>
            <div className="text-sm text-center text-slate-400">
              <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
                ← Back to sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
