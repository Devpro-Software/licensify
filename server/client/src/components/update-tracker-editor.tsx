"use client"

import { licensify } from "@/configuraton/axios"
import { toast } from "sonner"
import { mutate } from "swr"
import InlineEditor from "./inline-editor"

type Props = {
    id: string
    mutatePath?: string
    value: string
    small?: boolean
    ghost?: boolean
}

export default function UpdateTrackerNameEditor(props: Props) {

    const updateName = async (s: string) => {
        try {
            const params = new URLSearchParams()
            params.set("name", s)
            await licensify.put(`/api/trackers/${props.id}?${params.toString()}`)
            toast("Successfully renamed tracker")
            if (props.mutatePath) {
                mutate(props.mutatePath)
            }
        } catch (e) {
            console.log(e)
            toast("Failed to update tracker")
        }
    }

    const small = props.small ?? true
    const large = !small
    return (
        <InlineEditor ghost={props.ghost} large={large} small={small} value={props.value} onSubmit={s => updateName(s)} />
    )
}
