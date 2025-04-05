import { useState } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog"
import { Signature as SigIcon, Terminal, Text } from "lucide-react"
import KeyValueEditor, { KeyValueItem } from "./key-value-editor"
import { Signature } from "@/types/core"
import { Separator } from "./ui/separator"
import { licensify } from "@/configuraton/axios"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { setTimeout } from "node:timers/promises"

type Props = {
    licenseId: string
    sig: string
    setSig: (s: string) => void
}

export default function SignatureClaimsDialog(props: Props) {
    const [open, setOpen] = useState(false)
    const [showWarning, setShowWarning] = useState(false)

    const sig = JSON.parse(props.sig) as Signature
    const items: KeyValueItem[] = Object.keys(sig.license).map((k, v) => ({
        key: k,
        value: sig.license[k] as string
    }))


    const signLicense = async () => {
        try {
            const claims = sig.license
            const resp = await licensify.post(`/api/licenses/${props.licenseId}/sign`, claims)
            props.setSig(JSON.stringify(resp.data, null, 4))
            toast(`Successfully signed license`)
            setOpen(false)
        } catch (e) {
            toast(`Failed to sign license`)
            console.log(e)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={() => setOpen(true)} variant={"outline"}>
                Edit Claims
                <Text />
            </Button>
            <DialogContent>
                <DialogTitle>License Claims</DialogTitle>
                <DialogDescription>License Claims are added data that to individual license signatures, and can help power some use cases (e.g. product tiers).</DialogDescription>
                {showWarning &&
                    <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Warning!</AlertTitle>
                        <AlertDescription>
                            Removing license-id from the claims removes its assocation with this license and validations will fail.
                            You can still benefit from offline validation using the licensify library.
                        </AlertDescription>
                    </Alert>
                }
                <Separator />
                <KeyValueEditor
                    data={items}
                    onAdd={(k, v) => {
                        sig.license[k] = v
                        sig.sig = "Regenerate the signature"
                        props.setSig(JSON.stringify(sig, null, 4))
                    }}
                    onDelete={k => {
                        if (k === "license-id") {
                            setShowWarning(true)
                        }
                        delete sig.license[k]
                        sig.sig = "Regenerate the signature"
                        props.setSig(JSON.stringify(sig, null, 4))
                    }} />
                <Button onClick={signLicense} variant={"outline"}>
                    Sign
                    <SigIcon />
                </Button>
            </DialogContent>
        </Dialog>
    )
}
