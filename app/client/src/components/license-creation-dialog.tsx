"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Button } from "./ui/button"
import { CirclePlus } from "lucide-react"
import { LicenseForm } from "./license-form"

type Props = {}

export default function LicenseCreationDialog({ }: Props) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size={"icon"}>
                    <CirclePlus />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Create a License</DialogTitle>
                <LicenseForm onSubmit={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
