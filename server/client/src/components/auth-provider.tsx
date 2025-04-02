"use client"

import { licensify } from "@/configuraton/axios"
import { Session } from "@/types/core"
import { useRouter } from "next/navigation"
import { createContext, ReactNode, useContext, useEffect } from "react"
import useSWR from "swr"

type Props = {
    children: ReactNode
}

export type Auth = {
    session: Session | null
    logout: () => Promise<void> | void
}

const AuthContext = createContext<Auth>({
    session: null,
    logout: () => undefined
})

export default function AuthProvider({ children }: Props) {
    const router = useRouter()
    const { data, isLoading } = useSWR("/api/session")
    const session = data as Session || null

    useEffect(() => {
        if (!isLoading && !session) {
            router.push("/login")
        }
    }, [isLoading, session])

    const logout = async () => {
        await licensify.post("/auth/logout")
    }

    return (
        <AuthContext.Provider value={{
            session,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useSession(): Auth {
    const auth = useContext(AuthContext)
    return auth
}
