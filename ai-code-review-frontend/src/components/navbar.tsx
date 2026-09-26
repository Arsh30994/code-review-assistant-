// src/components/navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Code2, FolderGit2, LogOut, Sparkles } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) return null;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/projects" className="flex items-center space-x-2.5 group">
            <div className="p-2 rounded-lg bg-primary-600/10 border border-primary-500/20 group-hover:border-primary-500/40 transition-colors">
              <Sparkles className="w-5 h-5 text-primary-500" />
            </div>
            <span className="font-semibold text-lg text-white tracking-tight">
              AI Code Reviewer
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/projects"
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith('/projects')
                  ? 'bg-surface-hover text-white'
                  : 'text-gray-400 hover:text-white hover:bg-surface-hover/50'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Projects</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
