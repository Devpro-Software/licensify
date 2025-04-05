"use client"

import { licensify } from "@/configuraton/axios"
import { Signature, Tracker } from "@/types/core"
import { CirclePlus, Crosshair } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"
import Loader from "./loader"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"

type Props = {
    licenseId: string
    sig: string
    setSig: (s: string) => void
    mutatePath?: string
}

export default function AddTrackerButton(props: Props) {
    const [signLoading, setSignLoading] = useState(false)
    const [executed, setExecuted] = useState(false)
    const [open, setOpen] = useState(false)

    // const { data } = useSWR(`/api/licenses/${props.licenseId}/trackers`)
    // const trackers = data as Tracker[]


    const signLicense = async (trackerId?: string) => {
        setSignLoading(true)
        try {
            const params = new URLSearchParams()
            params.set("type", "tracked")
            if (trackerId) {
                params.set("trackerId", trackerId)
            }
            const resp = await licensify.post(`/api/licenses/${props.licenseId}/sign?${params.toString()}`)
            const sig = resp.data as Signature
            props.setSig(JSON.stringify(sig, null, 4))
            toast(`Successfully signed license`)
            if (props.mutatePath) {
                mutate(props.mutatePath)
            }
            setExecuted(true)
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
                <Button disabled={executed} variant={"outline"}>
                    {!signLoading &&
                        <>
                            Add Tracker <Crosshair />
                        </>
                    }
                    {signLoading && <Loader />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="size-fit p-1">
                <Button onClick={() => signLicense()} className="w-full" size={"sm"} variant={"ghost"}>
                    New Tracker <CirclePlus />
                </Button>
                {/* <ScrollArea className="w-48 rounded-md"> */}
                {/*     <div className="p-4"> */}
                {/* <Separator className="my-2" /> */}
                {/* {trackers?.map((t) => ( */}
                {/*     <div className="" key={t.id}> */}
                {/*         <Button onClick={() => signLicense(t.id)} className="w-full" variant={"ghost"} size={"sm"}> */}
                {/*             <p className="truncate max-w-32"> */}
                {/*                 {t.id} */}
                {/*             </p> */}
                {/*         </Button> */}
                {/*         <Separator className="my-2" /> */}
                {/*     </div> */}
                {/* ))} */}
                {/*     </div> */}
                {/* </ScrollArea> */}
            </PopoverContent>
        </Popover>
    )
}
