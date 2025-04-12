"use client"

import { licensify } from "@/configuraton/axios"
import { CirclePlay, CircleStop } from "lucide-react"
import { toast } from "sonner"
import { mutate } from "swr"
import { Button } from "./ui/button"

type Props = {
    id: string
    mutatePath?: string
    enabled: boolean
}

export default function EnableTrackerButton(props: Props) {

    const enableTracker = async () => {
        try {
            await licensify.put(`/api/trackers/${props.id}?enabled=${!props.enabled}`)
            toast("Successfully updated tracker")
            if (props.mutatePath) {
                mutate(props.mutatePath)
            }
        } catch (e) {
            console.log(e)
            toast("Failed to update tracker")
        }
    }

    return (
        <Button variant={"secondary"} onClick={() => enableTracker()}>
            {props.enabled ? <CircleStop /> : <CirclePlay />}
        </Button>
    )
}
