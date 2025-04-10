"use client"

import { licensify } from "@/configuraton/axios"
import { toast } from "sonner"
import { mutate } from "swr"
import { ConfirmationDialog } from "./confirmation-dialog"
import { Button } from "./ui/button"
import { Trash } from "lucide-react"

type Props = {
    id: string
    mutatePath?: string
    onDelete?: () => void
}

export default function DeleteTrackerButton(props: Props) {

    const deleteTracker = async (id: string) => {
        try {
            await licensify.delete(`/api/trackers/${id}`)
            toast("Successfully deleted tracker")
            if (props.mutatePath) {
                mutate(props.mutatePath)
            }
            if (props.onDelete) {
                props.onDelete()
            }
        } catch (e) {
            console.log(e)
            toast("Failed to delete tracker")
        }
    }

    return (
        <ConfirmationDialog title="Delete this tracker?" description="Are you sure you want to delete this tracker? All signatures that use this tracker will no longer be valid." onConfirm={() => deleteTracker(props.id)}>
            <Button variant={"destructive"} size={"icon"}>
                <Trash />
            </Button>
        </ConfirmationDialog>
    )
}
