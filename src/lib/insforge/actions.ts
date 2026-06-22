'use server';

import { cookies } from 'next/headers';
import { createAuthActions, createServerClient } from '@insforge/sdk/ssr';
import { redirect } from 'next/navigation';

// ─── Sign Up ─────────────────────────────────────────────────────────────────
export async function signUpAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const name = String(formData.get('name') ?? '').trim();

  if (!email || !password || !name) {
    return { error: 'Name, email, and password are required.' };
  }

  const auth = createAuthActions({ cookies: await cookies() });
  const { data, error } = await auth.signUp({
    email,
    password,
    name,
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/login`
  });

  if (error) {
    return { error: error.message ?? 'Sign up failed. Please try again.' };
  }

  if (data?.requireEmailVerification) {
    // verifyEmailMethod === "code" — return to client so it shows the OTP input.
    return { requireVerification: true, email };
  }

  // No verification required — already signed in.
  redirect('/verify');
}

// ─── Verify Email (OTP code) ──────────────────────────────────────────────────
export async function verifyEmailAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const otp = String(formData.get('otp') ?? '').trim();

  if (!email || !otp) {
    return { error: 'Email and verification code are required.' };
  }

  const auth = createAuthActions({ cookies: await cookies() });
  const { data, error } = await auth.verifyEmail({ email, otp });

  if (error) {
    if (error.statusCode === 400) {
      return { error: 'Invalid or expired verification code. Please try again.' };
    }
    return { error: error.message ?? 'Verification failed.' };
  }

  // verifyEmail() automatically saves the session — user is signed in now.
  redirect('/verify');
}

// ─── Resend Verification Email ────────────────────────────────────────────────
// Uses createServerClient because createAuthActions doesn't expose this method.
export async function resendVerificationAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    return { error: 'Email is required.' };
  }

  const client = createServerClient({ cookies: await cookies() });
  await client.auth.resendVerificationEmail({
    email,
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/login`
  });

  return { success: true };
}

// ─── Sign In ──────────────────────────────────────────────────────────────────
export async function signInAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const auth = createAuthActions({ cookies: await cookies() });
  const { data, error } = await auth.signInWithPassword({ email, password });

  if (error) {
    if (error.statusCode === 403) {
      return {
        error: 'Your email is not verified yet.',
        requireVerification: true,
        email
      };
    }
    return { error: error.message ?? 'Sign in failed. Check your credentials.' };
  }

  redirect('/verify');
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOutAction() {
  const auth = createAuthActions({ cookies: await cookies() });
  await auth.signOut();
  redirect('/login');
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    return { error: 'Email is required.' };
  }

  const client = createServerClient({ cookies: await cookies() });
  await client.auth.sendResetPasswordEmail({
    email,
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/reset-password`
  });

  return { success: true };
}

// ─── Reset Password (OTP code) ────────────────────────────────────────────────
export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim();
  const newPassword = String(formData.get('newPassword') ?? '');

  if (!email || !code || !newPassword) {
    return { error: 'All fields are required.' };
  }

  const client = createServerClient({ cookies: await cookies() });

  // Exchange reset code for token
  const { data: exchangeData, error: exchangeError } = await client.auth.exchangeResetPasswordToken({ email, code });
  if (exchangeError || !exchangeData?.token) {
    return { error: 'Invalid or expired reset code.' };
  }

  const { error } = await client.auth.resetPassword({ newPassword, otp: exchangeData.token });
  if (error) {
    return { error: error.message ?? 'Password reset failed.' };
  }

  redirect('/login?reset=success');
}
