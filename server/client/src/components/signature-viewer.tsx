"use client"

import { licensify } from "@/configuraton/axios";
import { License, Signature } from "@/types/core";
import { Download, Signature as SignatureIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import CodeBlock from "./code-block";
import { CopyButton } from "./copy-button";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import Loader from "./loader";


type Props = {
    license: License
}

export default function SignatureViewer({ license }: Props) {
    const [signLoading, setSignLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [signature, setSignature] = useState<string | null>(null)

    const signLicense = async () => {
        setSignLoading(true)
        // await new Promise(r => setTimeout(r, 2222))
        try {
            const resp = await licensify.post(`/api/licenses/${license.id}/sign`)
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
        <Dialog onOpenChange={setOpen} open={open}>
            <Button disabled={signLoading} onClick={async () => {
                await signLicense()
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
                            <div className="flex gap-x-3">
                                <CopyButton content={signature} />
                                <Button onClick={() => download(signature)} variant={"secondary"} size={"icon"}>
                                    <Download />
                                </Button>
                            </div>
                        </DialogHeader>
                        <div>
                            <Card className="w-full h-full">
                                <CardContent>
                                    <CodeBlock code={signature} lang="json" />
                                </CardContent>
                            </Card>
                        </div>
                    </>
                }
            </DialogContent>
        </Dialog>
    )
}

