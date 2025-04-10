"use client"

import { licensify } from "@/configuraton/axios"
import { toast } from "sonner"
import { mutate } from "swr"
import { Button } from "./ui/button"
import { CirclePlus } from "lucide-react"

type Props = {
    licenseId: string
    mutatePath?: string
}

export default function CreateTrackerButton(props: Props) {

    const createTracker = async () => {
        try {
            await licensify.post(`/api/licenses/${props.licenseId}/trackers`)
            toast("Successfully created tracker")
            if (props.mutatePath) {
                mutate(props.mutatePath)
            }
        } catch (e) {
            console.log(e)
            toast("Failed to create tracker")
        }
    }

    return (
        <Button onClick={createTracker} variant={"default"} size={"icon"}>
            <CirclePlus />
        </Button>
    )
}
