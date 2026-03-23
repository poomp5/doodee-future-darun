'use client';
import { GraduationCap, User, Coins, Sparkles, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Link } from '@/routing';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from './AuthProvider';
import Image from 'next/image';
import { useState } from 'react';
import useSWR from "swr";

const ADMIN_NAV_ROLES = ['admin', 'superadmin', 'moderator', 'act_admin'];

export default function MobileHeader() {
    const t = useTranslations('nav');
    const { user, signOut } = useAuth();
    const [open, setOpen] = useState(false);
    const { data: userData } = useSWR(user ? `/api/db/users?id=${user.id}` : null);
    const userRole = user ? (userData?.data?.role || 'member') : null;
    const adminHref = userRole === 'act_admin' ? '/act-admin' : '/admin';

    return (
        <header className="block lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 shadow-md bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500">
            <div className="flex items-center justify-between">
                {/* Logo + tagline */}
                <Link href="/" className="text-white flex items-center gap-2">
                    <div className="p-2 bg-white/15 rounded-xl">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="leading-tight">
                        <div className="text-base font-bold">Doodee Future</div>
                        <div className="text-[11px] text-pink-100">Future Planning</div>
                    </div>
                </Link>

                <div className="flex items-center gap-2 relative">
                    <LanguageSwitcher compact />
                    <button
                        onClick={() => setOpen((o) => !o)}
                        className="flex items-center gap-1.5 rounded-full focus:outline-none"
                    >
                        {user?.image ? (
                            <Image
                                src={user.image}
                                alt={user.name || 'user'}
                                width={34}
                                height={34}
                                className="rounded-full border-2 border-white/60"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/40">
                                <User className="h-5 w-5" />
                            </div>
                        )}
                        <ChevronDown className={`h-4 w-4 text-white transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                        <>
                            <button
                                type="button"
                                className="fixed inset-0 z-40 bg-transparent"
                                onClick={() => setOpen(false)}
                                aria-label="Close menu"
                            />
                            <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden text-gray-800 z-50">
                                <div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
                                    <p className="font-semibold truncate">{user?.name || user?.email || 'Guest'}</p>
                                    {user?.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                                </div>

                                <div className="py-2">
                                    <Link
                                        href={user ? "/profile" : "/login"}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <User className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <span className="font-medium">{user ? t('myAccount') : t('signIn')}</span>
                                    </Link>

                                    {user && (
                                        <Link
                                            href="/points"
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                                                <Coins className="h-4 w-4 text-yellow-600" />
                                            </div>
                                            <span className="font-medium">{t('points')}</span>
                                            <span className="ml-auto px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full inline-flex items-center gap-1">
                                                <Sparkles className="h-3 w-3" />
                                                NEW
                                            </span>
                                        </Link>
                                    )}

                                    {user && ADMIN_NAV_ROLES.includes(userRole || '') && (
                                        <Link
                                            href={adminHref}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                                <Settings className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <span className="font-medium">Admin Panel</span>
                                        </Link>
                                    )}
                                </div>

                                {user && (
                                    <>
                                        <div className="border-t border-gray-100" />
                                        <div className="py-2">
                                            <button
                                                onClick={() => {
                                                    setOpen(false);
                                                    signOut();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                                    <LogOut className="h-4 w-4 text-red-600" />
                                                </div>
                                                <span className="font-medium">{t('logout')}</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
