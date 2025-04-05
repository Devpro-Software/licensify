"use client"

import { licensify } from "@/configuraton/axios";
import { Signature } from "@/types/core";
import { Download, Signature as SignatureIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import CodeBlock from "./code-block";
import { CopyButton } from "./copy-button";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import SignatureClaimsDialog from "./signature-claims-dialog";
import AddTrackerButton from "./add-tracker-button";


type BuilderProps = {
    licenseId: string
    sig: string
    title?: string
    description?: string
    mutatePath?: string
    disableTracker?: boolean
}

export function SignatureBuilder(props: BuilderProps) {
    const [sig, setSig] = useState(props.sig)

    const download = (data: string, filename = 'license.json') => {
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()

        URL.revokeObjectURL(url)
    }
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
                <div className="flex gap-x-3 mb-5">
                    <CopyButton content={sig} />
                    <Button onClick={() => download(sig)} variant={"secondary"} size={"icon"}>
                        <Download />
                    </Button>
                    <SignatureClaimsDialog licenseId={props.licenseId} sig={sig} setSig={setSig} />
                    {!props.disableTracker &&
                        <AddTrackerButton mutatePath={props.mutatePath} licenseId={props.licenseId} sig={sig} setSig={setSig} />
                    }
                </div>
                <CodeBlock code={sig} lang="json" />
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
    const [signLoading, setSignLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [signature, setSignature] = useState<string | null>(null)

    const signLicense = async (trackerId?: string) => {
        setSignLoading(true)
        try {
            const params = new URLSearchParams()
            if (trackerId) {
                params.set("type", "tracked")
                params.set("trackerId", trackerId)
            }
            const resp = await licensify.post(`/api/licenses/${id}/sign?${params.toString()}`)
            const sig = resp.data as Signature
            setSignature(JSON.stringify(sig, null, 4))
            toast(`Successfully signed license`)
        } catch (e) {
            toast(`Failed to sign license`)
            console.log(e)
        } finally {
            setSignLoading(false)
        }
    }


    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <Button disabled={signLoading} onClick={async () => {
                await signLicense(props.trackerId)
                setOpen(true)
            }} variant={"outline"} className="w">
                {!signLoading &&
                    <>
                        <p className="text-muted-foreground">Sign</p>
                        <SignatureIcon />
                    </>
                }
                {signLoading && <Loader />}
            </Button>
            <DialogContent className="">
                {signature &&
                    <>
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
                            <SignatureBuilder disableTracker={props.disableAddTrackerButton} mutatePath={`/api/licenses/${id}/trackers`} licenseId={id} sig={signature} />
                        </div>
                    </>
                }
            </DialogContent>
        </Dialog>
    )
}

