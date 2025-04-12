"use client"

import { licensify } from "@/configuraton/axios"
import { toast } from "sonner"
import { mutate } from "swr"
import { ExpirationPicker } from "./expiration-picker"
import { toUnixTime } from "@/services/time"

type Props = {
    id: string
    mutatePath?: string
}

export default function TrackerExpirationSetter(props: Props) {

    const updateExpiration = async (d: Date | undefined) => {
        try {
            const t = d ? toUnixTime(d).toString() : "null"
            await licensify.put(`/api/trackers/${props.id}?expiration=${t}`)
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
        <ExpirationPicker expiration={undefined} setExpiration={updateExpiration} />
    )
}
