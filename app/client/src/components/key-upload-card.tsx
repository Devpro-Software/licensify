"use client"

import { licensify } from "@/configuraton/axios"
import { InspectionPanel, Key, Upload } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import CodeBlock from "./code-block"
import DropFileInput from "./file-uploader"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import useSWR from "swr"
import { KeyPair } from "@/types/core"
import { CopyButton } from "./copy-button"

type Props = {

}

const filler = "************************************************************"

export default function KeyUpload({ }: Props) {
    const [publicKey, setPublicKey] = useState<File | null>(null)
    const [privateKey, setPrivateKey] = useState<File | null>(null)

    const { data } = useSWR("/api/keys")
    const keypair = data as KeyPair | null

    const setPublic = (f: File) => {
        if (!f.name.endsWith(".pem")) {
            return
        }
        setPublicKey(f)
    }

    const setPrivate = (f: File) => {
        if (!f.name.endsWith(".pem")) {
            return
        }
        setPrivateKey(f)
    }

    const upload = async () => {
        try {
            if (!publicKey || !privateKey) {
                return
            }

            const formData = new FormData()
            formData.set("publicKey", publicKey)
            formData.set("privateKey", privateKey)

            await licensify.post("/api/keys", formData)
        } catch (e) {
            console.log(e)
            toast("Failed to upload files.")
        }
    }

    const decodedKey = keypair && atob(keypair.publicKey)

    return (
        <Card className="size-full">
            <CardHeader>
                <CardTitle className="text-2xl">RSA Keys</CardTitle>
                <CardDescription>Upload new private and public key files.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert className="mb-4">
                    <Key className="h-4 w-4" />
                    <AlertTitle>Warning!</AlertTitle>
                    <AlertDescription>
                        Replacing the Keys will invalidate previous signatures.
                    </AlertDescription>
                </Alert>
                {decodedKey &&
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center">
                                    <Alert className="mb-4 flex items-center justify-between">
                                        <div className="flex items-start gap-2">
                                            <InspectionPanel />
                                            <div>
                                                <AlertTitle>Current Public Key</AlertTitle>
                                                <AlertDescription>
                                                    <div className="truncate w-full">
                                                        {filler}
                                                    </div>
                                                </AlertDescription>
                                            </div>
                                        </div>
                                        <CopyButton content={decodedKey} />
                                    </Alert>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-secondary">
                                <CodeBlock code={decodedKey} lang="text" />
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                }
                <div className="grid grid-cols-2 gap-3">
                    <DropFileInput file={publicKey} setFile={setPublic} title="Drag and drop your public key here, or click to browse" />
                    <DropFileInput file={privateKey} setFile={setPrivate} title="Drag and drop your private key here, or click to browse" />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={upload} variant={"outline"} disabled={!publicKey || !privateKey}>
                    Upload
                    <Upload />
                </Button>
            </CardFooter>
        </Card>
    )
}
