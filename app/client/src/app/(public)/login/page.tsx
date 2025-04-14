"use client"

import { LoginForm } from "@/components/login-form"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import useSWR from "swr"

export default function Page() {
    const router = useRouter()
    const { data } = useSWR("/api/session")

    useEffect(() => {
        if (data) {
            router.push("/dashboard")
        }
    }, [data])

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    )
}

