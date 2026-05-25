'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tv, Compass, TrendingUp, Bookmark, Settings } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [siteName, setSiteName] = useState('DreamRooms AI');

  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.siteName) {
          setSiteName(data.siteName);
        }
      })
      .catch(err => console.error('Failed to load dynamic nav branding:', err));
  }, []);

  const navItems = [
    { name: 'Feed', href: '/', icon: Tv },
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Trending', href: '/trending', icon: TrendingUp },
    { name: 'Bookmarks', href: '/explore?saved=true', icon: Bookmark },
    { name: 'Admin', href: '/admin', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-nav px-6 py-4 flex items-center justify-between transition-luxury">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-luxury">
            <Tv className="w-5 h-5 text-neutral-950 stroke-[2.5]" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent group-hover:text-amber-400 transition-luxury">
            {siteName.endsWith(' AI') ? (
              <>
                {siteName.slice(0, -3)}{' '}
                <span className="text-amber-500 font-extrabold">{siteName.slice(-2)}</span>
              </>
            ) : (
              siteName
            )}
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-luxury ${
                isActive
                  ? 'bg-white/10 text-white shadow-sm border border-white/5'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-neutral-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Search Indicator & Quick Buttons */}
      <div className="flex items-center gap-4">
        {/* Mobile Navigation Indicator (Shows icon-only navigation bar on small screens) */}
        <div className="md:hidden flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`p-2.5 rounded-full transition-luxury ${
                  isActive ? 'bg-white/10 text-amber-500' : 'text-neutral-400 hover:text-white'
                }`}
                title={item.name}
              >
                <Icon className="w-4.5 h-4.5" />
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
