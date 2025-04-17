"use client"

import { LoginForm } from "@/components/login-form"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import useSWR from "swr"

export default function Page() {
    const router = useRouter()
    const { data } = useSWR("/api/session")
    const { data: status } = useSWR("/api/status")

    useEffect(() => {
        if (data) {
            router.push("/dashboard")
        }
    }, [data])

    useEffect(() => {
        if (!status) {
            return
        }

        if (status.status === "unregistered") {
            router.push("/register")
        }
    }, [status])

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    )
}

