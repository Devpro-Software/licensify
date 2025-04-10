"use client"

import { Check } from "lucide-react"
import * as React from "react"

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Tracker } from "@/types/core"
import useSWR from "swr"
import { ScrollArea, ScrollBar } from "./ui/scroll-area"


type Props = {
    licenseId: string
    setSelected: (t: Tracker | null) => void
    selected: Tracker | null
}

export function TrackerSearchComboBox(props: Props) {
    const [searchValue, setSearchValue] = React.useState("")
    const params = new URLSearchParams()
    params.set("name", searchValue)
    const { data } = useSWR(`/api/licenses/${props.licenseId}/trackers?${params.toString()}`)
    const trackers = data as Tracker[]

    return (
        <Command>
            <CommandInput onValueChange={(s) => setSearchValue(s)} placeholder="Search tracker..." />
            <CommandList>
                <CommandEmpty>No Tracker Found</CommandEmpty>
                <CommandGroup>
                    <ScrollArea className="h-44">
                        {trackers?.map((tracker) => (
                            <CommandItem
                                key={tracker.id}
                                value={tracker.name}
                                onSelect={(currentValue) => {
                                    props.setSelected(currentValue === props.selected?.name ? null : tracker)
                                }}
                            >
                                {tracker.name}
                                <Check
                                    className={cn(
                                        "ml-auto",
                                        props.selected?.name === tracker.name ? "opacity-100" : "opacity-0"
                                    )}
                                />
                            </CommandItem>
                        ))}
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                </CommandGroup>
            </CommandList>
        </Command>
    )
}
