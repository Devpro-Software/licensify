"use client"

import { ResgistrationForm } from "@/components/register-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";

export default function Page() {
    const router = useRouter()
    const { data: status } = useSWR("/api/status")

    useEffect(() => {
        if (!status) {
            return
        }

        if (status.status === "initialized") {
            router.push("/login")
        }
    }, [status])

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-lg">
                <ResgistrationForm />
            </div>
        </div>
    )
}

