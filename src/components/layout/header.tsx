'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';
import { insforge } from '@/lib/insforge/browser';
import { signOutAction } from '@/lib/insforge/actions';

interface AuthUser {
  id: string;
  email?: string;
  profile?: { name?: string };
}

export function Header() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      setUser((data?.user as AuthUser) ?? null);
    });
  }, []);

  const displayName = user?.profile?.name ?? user?.email?.split('@')[0] ?? 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction();
    });
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md z-50 flex items-center px-4 md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden mr-2 text-slate-400">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-heading font-bold text-xl text-indigo-400 hidden sm:inline-block">
            DiplomaIQ
          </span>
        </Link>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {user && (
          <div className="hidden md:flex flex-col text-right mr-2">
            <span className="text-sm font-medium text-white">{displayName}</span>
            <span className="text-xs text-slate-400">{user.email}</span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none focus:ring-2 focus:ring-indigo-500">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-indigo-900 text-indigo-200">
                {initials || 'U'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-slate-300" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-white">{displayName}</p>
                <p className="text-xs leading-none text-slate-400">{user?.email ?? '…'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer">
              <Link href="/dashboard/profile">Profile Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isPending}
              className="focus:bg-slate-800 focus:text-white cursor-pointer text-red-400 focus:text-red-300"
            >
              {isPending ? 'Signing out…' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
