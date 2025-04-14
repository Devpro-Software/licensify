"use client"

import { licensify } from "@/configuraton/axios"
import { Signature, Tracker } from "@/types/core"
import { CirclePlus, Crosshair } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { mutate } from "swr"
import Loader from "./loader"
import { TrackerSearchComboBox } from "./tracker-search-box"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

type Props = {
    licenseId: string
    sig: string
    setSig: (s: string) => void
    mutatePath?: string
    isInDialog?: boolean
}

export default function AddTrackerButton(props: Props) {
    const [signLoading, setSignLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null)

    const signLicense = async (trackerId?: string) => {
        setSignLoading(true)
        try {
            const params = new URLSearchParams()
            params.set("type", "tracked")
            if (trackerId) {
                params.set("trackerId", trackerId)
            }
            const claims = JSON.parse(props.sig)?.license
            const resp = await licensify.post(`/api/licenses/${props.licenseId}/sign?${params.toString()}`, claims)
            const sig = resp.data as Signature
            props.setSig(JSON.stringify(sig, null, 4))
            if (props.mutatePath) {
                mutate(props.mutatePath)
            }
            setOpen(false)
        } catch (e) {
            toast(`Failed to sign license`)
            console.log(e)
        } finally {
            setSignLoading(false)
        }
    }

    const removeTracker = async () => {
        setSignLoading(true)
        try {
            const claims = JSON.parse(props.sig)?.license
            delete claims?.tracker
            const resp = await licensify.post(`/api/licenses/${props.licenseId}/sign`, claims)
            const sig = resp.data as Signature
            props.setSig(JSON.stringify(sig, null, 4))
            if (props.mutatePath) {
                mutate(props.mutatePath)
            }
            setOpen(false)
        } catch (e) {
            toast(`Failed to sign license`)
            console.log(e)
        } finally {
            setSignLoading(false)
        }
    }

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
                <Button variant={"outline"}>
                    {!signLoading &&
                        <>
                            Tracker <Crosshair />
                        </>
                    }
                    {signLoading && <Loader />}
                </Button>
            </PopoverTrigger>
            <PopoverContent withoutPortal={props.isInDialog} className="size-fit p-1">
                <Button onClick={() => signLicense()} className="w-full" size={"lg"} variant={"ghost"}>
                    New Tracker <CirclePlus />
                </Button>
                <TrackerSearchComboBox licenseId={props.licenseId} selected={selectedTracker} setSelected={(t) => {
                    setSelectedTracker(t)
                    if (t) {
                        signLicense(t.id)
                    }
                }} />
                <Button onClick={removeTracker} className="w-full" variant={"ghost"}>
                    Clear
                </Button>
            </PopoverContent>
        </Popover>
    )
}
