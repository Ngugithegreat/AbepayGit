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

export function AppLayout({ children, pageTitle }: AppLayoutProps) {
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
                                    <AvatarImage src="https://picsum.photos/seed/user-avatar/40/40" data-ai-hint="profile avatar" alt="User Avatar" />
                                    <AvatarFallback>DU</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                                    <span className="text-sm font-medium">Demo User</span>
                                    <span className="text-xs text-muted-foreground">demo@derivpay.app</span>
                                </div>
                            </div>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className="group-data-[collapsible=expanded]:hidden">
                        <p>Demo User</p>
                        <p className="text-muted-foreground">demo@derivpay.app</p>
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
