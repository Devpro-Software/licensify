"use client"

import { useState } from "react"
import DropFileInput from "./file-uploader"
import { Button } from "./ui/button"
import { Upload } from "lucide-react"

type Props = {
    upload: (pub: File, priv: File) => void
}

export default function KeypairUploader(props: Props) {

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

    return (
        <div className="grid grid-cols-2 gap-3">
            <DropFileInput file={publicKey} setFile={setPublic} title="Drag and drop your public key here, or click to browse" />
            <DropFileInput file={privateKey} setFile={setPrivate} title="Drag and drop your private key here, or click to browse" />
            <Button onClick={() => publicKey && privateKey && props.upload(publicKey, privateKey)} variant={"outline"} disabled={!publicKey || !privateKey}>
                Upload
                <Upload />
            </Button>
        </div>
    )
}
