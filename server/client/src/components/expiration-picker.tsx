"use client"

import { format } from "date-fns"
import { Hourglass } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Props = {
    expiration: Date | undefined
    setExpiration: (d: Date | undefined) => void
}

export function ExpirationPicker({ expiration: date, ...props }: Props) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "justify-start text-left font-normal",
                    )}
                >
                    <Hourglass />
                    {date ? format(date, "PP") : <span>Expiration</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={props.setExpiration}
                    initialFocus
                />
                <Button onClick={() => props.setExpiration(undefined)} className="w-full" variant={"ghost"}>
                    Clear
                </Button>
            </PopoverContent>
        </Popover>
    )
}
