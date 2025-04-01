"use client"

import { licensify } from "@/configuraton/axios"
import { ReactNode } from "react"
import { SWRConfig } from "swr"

type Props = {
    children: ReactNode
}

const fetcher = async (url: string) => {
    return licensify.get(url).then(res => res.data)
}

export default function SWRProvider({ children }: Props) {
    return (
        <div>
            <SWRConfig value={{
                fetcher
            }}>
                {children}
            </SWRConfig>
        </div>
    )
}
