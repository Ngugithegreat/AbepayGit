'use client'; // Needs to be client for useAuth hook

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { SidebarNav } from '@/components/sidebar-nav';
import { Header } from '@/components/header';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from './ui/skeleton';

export function AppLayout({ children, pageTitle }: AppLayoutProps) {
  const { user, isLinked, isLoading } = useAuth();
  
  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="border-r">
        <SidebarHeader>
            <Logo />
        </SidebarHeader>
        <Separator className="group-data-[collapsible=icon]:hidden" />
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <Separator />
        <SidebarFooter>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Link href="/settings">
                            <div className="flex cursor-pointer items-center gap-3 p-2 hover:bg-sidebar-accent rounded-md">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={`https://picsum.photos/seed/${user?.loginid || 'user-avatar'}/40/40`} data-ai-hint="profile avatar" alt="User Avatar" />
                                    <AvatarFallback>{isLoading ? <Skeleton className='h-9 w-9 rounded-full' /> : (isLinked && user ? getInitials(user.fullname) : 'DU')}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                                    {isLoading ? (
                                        <div className='space-y-1'>
                                            <Skeleton className='h-4 w-24' />
                                            <Skeleton className='h-3 w-32' />
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-sm font-medium">{isLinked && user ? user.fullname : 'Demo User'}</span>
                                            <span className="text-xs text-muted-foreground">{isLinked && user ? user.email : 'demo@derivpay.app'}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className="group-data-[collapsible=expanded]:hidden">
                        {isLoading ? <p>Loading...</p> : (
                            <>
                                <p>{isLinked && user ? user.fullname : 'Demo User'}</p>
                                <p className="text-muted-foreground">{isLinked && user ? user.email : 'demo@derivpay.app'}</p>
                            </>
                        )}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header pageTitle={pageTitle} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

type AppLayoutProps = {
  children: React.ReactNode;
  pageTitle: string;
};
