'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { forgotPasswordAction } from '@/lib/insforge/actions';
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

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await forgotPasswordAction(formData);
      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        setSent(true);
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-xl shadow-indigo-900/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold font-heading text-white">
            Forgot password
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter your email and we&apos;ll send you a reset code.
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-md px-4 py-3 text-sm text-emerald-400">
              Reset code sent! Check your inbox and{' '}
              <Link href="/reset-password" className="underline font-medium">
                enter the code here →
              </Link>
            </div>
          </CardContent>
        ) : (
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
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
              >
                {isPending ? 'Sending…' : 'Send Reset Code'}
              </Button>
              <div className="text-sm text-center text-slate-400">
                Remembered your password?{' '}
                <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
