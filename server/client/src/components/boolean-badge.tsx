"use client"

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { Badge } from './ui/badge'

type Props = {
    state: boolean
    children: ReactNode
}

export default function BooleanBadge({ state, children }: Props) {
    return (
        <Badge variant={state ? "default" : "destructive"} className={cn(state && "bg-green-700 text-white")}>
            {children}
        </Badge>
    )
}
