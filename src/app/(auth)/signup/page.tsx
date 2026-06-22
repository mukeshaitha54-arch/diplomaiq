'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition, useEffect, Suspense } from 'react';
import {
  signUpAction,
  verifyEmailAction,
  resendVerificationAction
} from '@/lib/insforge/actions';
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

type Stage = 'signup' | 'verify';

function SignupContent() {
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>('signup');
  const [emailForVerify, setEmailForVerify] = useState('');
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  // If returning from login page with ?verify=1&email=… go straight to verify stage
  useEffect(() => {
    if (searchParams.get('verify') === '1') {
      const email = searchParams.get('email') ?? '';
      if (email) {
        setEmailForVerify(email);
        setStage('verify');
      }
    }
  }, [searchParams]);

  function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    startTransition(async () => {
      const result = await signUpAction(formData);
      if (result?.error) {
        setErrorMsg(result.error);
      } else if (result?.requireVerification) {
        setEmailForVerify(result.email ?? (formData.get('email') as string));
        setStage('verify');
      }
      // If no error + no verification — signUpAction redirected internally
    });
  }

  // ── Stage 2: Verify Email (OTP) ───────────────────────────────────────────────
  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('email', emailForVerify);

    startTransition(async () => {
      const result = await verifyEmailAction(formData);
      if (result?.error) {
        setErrorMsg(result.error);
      }
      // On success, verifyEmailAction redirects to /verify
    });
  }

  function handleResend() {
    setResendSuccess(false);
    const formData = new FormData();
    formData.set('email', emailForVerify);
    startTransition(async () => {
      await resendVerificationAction(formData);
      setResendSuccess(true);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────

  if (stage === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-xl shadow-indigo-900/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold font-heading text-white">
              Check your email
            </CardTitle>
            <CardDescription className="text-slate-400">
              We sent a 6-digit verification code to{' '}
              <span className="text-indigo-400 font-medium">{emailForVerify}</span>.
              Enter it below to activate your account.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleVerify}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md px-4 py-2 text-sm text-red-400">
                  {errorMsg}
                </div>
              )}
              {resendSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-md px-4 py-2 text-sm text-emerald-400">
                  Verification code resent! Check your inbox.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-slate-300">
                  6-digit code
                </Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  required
                  autoFocus
                  className="bg-slate-950 border-slate-800 text-white text-center text-xl tracking-widest placeholder:text-slate-600"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
              >
                {isPending ? 'Verifying…' : 'Verify Email'}
              </Button>

              <button
                type="button"
                onClick={handleResend}
                disabled={isPending}
                className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-50 underline"
              >
                Resend code
              </button>

              <button
                type="button"
                onClick={() => { setStage('signup'); setErrorMsg(''); }}
                className="text-sm text-slate-500 hover:text-slate-400"
              >
                ← Back to sign up
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-xl shadow-indigo-900/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold font-heading text-white">
            Create an account
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter your email and password to sign up
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-md px-4 py-2 text-sm text-red-400">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
                autoComplete="name"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
              />
            </div>

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
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
            
            <div className="space-y-2 pt-2">
              <Label htmlFor="pin" className="text-slate-300">
                SBTET PIN Number
              </Label>
              <Input
                id="pin"
                name="pin"
                type="text"
                placeholder="e.g. 24054-AI-061"
                required
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
              {isPending ? 'Creating account…' : 'Create Account'}
            </Button>

            <div className="text-sm text-center text-slate-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-indigo-400 hover:text-indigo-300"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <SignupContent />
    </Suspense>
  );
}
