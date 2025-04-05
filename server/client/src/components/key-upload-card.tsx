"use client"

import { useState } from "react"
import DropFileInput from "./file-uploader"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Upload } from "lucide-react"
import { toast } from "sonner"
import { licensify } from "@/configuraton/axios"

type Props = {

}

export default function KeyUpload({ }: Props) {
    const [publicKey, setPublicKey] = useState<File | null>(null)
    const [privateKey, setPrivateKey] = useState<File | null>(null)

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

    return (
        <Card className="size-full">
            <CardHeader>
                <CardTitle className="text-2xl">RSA Keys</CardTitle>
                <CardDescription>Upload new private and public key files.</CardDescription>
            </CardHeader>
            <CardContent>
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
