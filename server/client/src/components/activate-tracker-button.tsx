"use client"

import { licensify } from "@/configuraton/axios"
import { Check, Timer } from "lucide-react"
import { toast } from "sonner"
import { mutate } from "swr"
import { Button } from "./ui/button"

type Props = {
    id: string
    mutatePath?: string
    activated: boolean
}

export default function ActivateTrackerButton(props: Props) {

    const activateTracker = async () => {
        try {
            await licensify.put(`/api/trackers/${props.id}?activated=${true}`)
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
        <Button disabled={props.activated} onClick={() => activateTracker()}>
            {props.activated &&
                <>
                    Activated
                    <Check />
                </>
            }
            {!props.activated &&
                <>
                    Activate <Timer />
                </>
            }
        </Button>
    )
}
