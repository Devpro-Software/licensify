"use client"

import { licensify } from "@/configuraton/axios"
import { Signature } from "@/types/core"
import { Download, Signature as SignatureIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import AddTrackerButton from "./add-tracker-button"
import CodeBlock from "./code-block"
import { CopyButton } from "./copy-button"
import { ExpirationPicker } from "./expiration-picker"
import SignatureClaimsDialog from "./signature-claims-dialog"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"


type BuilderProps = {
    licenseId: string
    title?: string
    description?: string
    mutatePath?: string
    disableTracker?: boolean
    trackerId?: string
}

export function SignatureBuilder(props: BuilderProps) {
    const [sig, setSig] = useState<Signature | null>(null)

    useEffect(() => {
        (async () => {
            const params = new URLSearchParams()
            if (props.trackerId) {
                params.set("type", "tracked")
                params.set("trackerId", props.trackerId)
            }
            const resp = await licensify.post(`/api/licenses/${props.licenseId}/sign?${params.toString()}`)
            const sig = resp.data as Signature
            setSig(sig)
        })()
    }, [])

    const download = (data: string, filename = 'license.json') => {
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()

        URL.revokeObjectURL(url)
    }

    const updateSig = async (s: Signature) => {
        try {
            const claims = s.license
            const resp = await licensify.post(`/api/licenses/${props.licenseId}/sign`, claims)
            setSig(resp.data)
            toast(`Successfully signed license`)
        } catch (e) {
        }
    }

    const setExpiration = (d: Date | undefined) => {
        if (!sig) {
            return
        }

        try {
            if (d) {
                sig.license["expiration"] = Math.floor(d.getTime() / 1000)
            } else {
                delete sig.license["expiration"]
            }
            updateSig({ ...sig })
        } catch (e) {
        }
    }

    const getExpiration = () => {
        try {
            const e = sig?.license?.expiration as number ?? 0
            // const e = parseInt(sig?.license?.expiration as string ?? "0")
            return sig?.license?.expiration ? new Date(e * 1000) : undefined
        } catch (error) {
        }
    }

    const sigStr = sig && JSON.stringify(sig, null, 2)
    const exp = getExpiration()

    return (
        <Card className="w-full h-full">
            {props.title &&
                <CardHeader>
                    <CardTitle className="text-xl">{props.title}</CardTitle>
                    {props.description &&
                        <CardDescription>
                            {props.description}
                        </CardDescription>
                    }
                </CardHeader>
            }
            <CardContent>
                {sigStr &&
                    <div>
                        <div className="flex gap-x-3 gap-y-1 flex-wrap mb-2">
                            <SignatureClaimsDialog licenseId={props.licenseId} sig={sig} setSig={updateSig} />
                            {!props.disableTracker &&
                                <AddTrackerButton mutatePath={props.mutatePath} licenseId={props.licenseId} sig={sigStr} setSig={s => {
                                    setSig(JSON.parse(s))
                                }} />
                            }
                            <ExpirationPicker expiration={exp} setExpiration={setExpiration} />
                            <CopyButton content={sigStr} />
                            <Button onClick={() => download(sigStr)} variant={"secondary"} size={"icon"}>
                                <Download />
                            </Button>
                        </div>
                        <CodeBlock code={sigStr} lang="json" />
                    </div>
                }
            </CardContent>
        </Card>
    )
}

type Props = {
    id: string
    disableAddTrackerButton?: boolean
    trackerId?: string
}

export default function SignatureDialog({ id, ...props }: Props) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <Button onClick={() => setOpen(true)} variant={"outline"} className="w">
                <p className="text-muted-foreground">Sign</p>
                <SignatureIcon />
            </Button>
            <DialogContent className="">
                <DialogHeader>
                    <DialogTitle className="text-3xl">Signature</DialogTitle>
                    <DialogDescription>
                        View, copy or download your license signature.
                    </DialogDescription>
                    <DialogDescription>
                        This license can be validated using our API, REST API or SDK.
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <SignatureBuilder disableTracker={props.disableAddTrackerButton} mutatePath={`/api/licenses/${id}/trackers`} licenseId={id} />
                </div>
            </DialogContent>
        </Dialog>
    )
}

