"use client"

import { AppSidebar } from "@/components/app-side-bar"
import AuthProvider from "@/components/auth-provider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { motion } from "framer-motion"
import { Suspense } from "react"

export default function DashbpardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Suspense>
            <AuthProvider>
                <SidebarProvider>
                    <AppSidebar />
                    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow">
                        <SidebarTrigger />
                        <div className="px-8 sm:px-16 md:px-32">
                            {children}
                        </div>
                    </motion.main>
                </SidebarProvider>
            </AuthProvider>
        </Suspense>
    )
}
