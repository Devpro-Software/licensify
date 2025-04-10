import { Signature } from "@/types/core"
import { Terminal, Text } from "lucide-react"
import { useState } from "react"
import KeyValueEditor, { KeyValueItem } from "./key-value-editor"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog"
import { Separator } from "./ui/separator"

type Props = {
    licenseId: string
    sig: Signature
    setSig: (s: Signature) => void
}

export default function SignatureClaimsDialog({ sig, ...props }: Props) {
    const [open, setOpen] = useState(false)
    const [showWarning, setShowWarning] = useState(false)

    const items: KeyValueItem[] = Object.keys(sig.license).map((k, _) => ({
        key: k,
        value: sig.license[k] as string
    }))

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
                        props.setSig(sig)
                    }}
                    onDelete={k => {
                        if (k === "license-id") {
                            setShowWarning(true)
                        }
                        delete sig.license[k]
                        props.setSig(sig)
                    }} />
            </DialogContent>
        </Dialog>
    )
}
