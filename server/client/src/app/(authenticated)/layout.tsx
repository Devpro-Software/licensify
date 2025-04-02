import { AppSidebar } from "@/components/app-side-bar";
import AuthProvider from "@/components/auth-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function DashbpardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AuthProvider>
            <SidebarProvider>
                <AppSidebar />
                <main className="flex-grow">
                    <SidebarTrigger />
                    <div className="px-8 sm:px-16 md:px-32">
                        {children}
                    </div>
                </main>
            </SidebarProvider>
        </AuthProvider>
    );
}
