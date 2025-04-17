import { Loader, Trash } from "lucide-react"
import { Button } from "./ui/button"
import { useState } from "react"
import { mutate } from "swr"
import { toast } from "sonner"
import { licensify } from "@/configuraton/axios"
import { ConfirmationDialog } from "./confirmation-dialog"

type Props = {
    id: string
    mutatePath?: string
    onDelete?: () => void
}

export default function LicenseDeleteButton({ id, mutatePath, onDelete }: Props) {
    const [deleteLoading, setDeleteLoading] = useState(false)

    const deleteLicense = async () => {
        setDeleteLoading(true)
        try {
            await licensify.delete(`/api/licenses/${id}`)
            toast("Successfully deleted license")
            if (mutatePath) {
                mutate(mutatePath)
            }
            if (onDelete) {
                onDelete()
            }
        } catch (e) {
            toast("Failed to deleted license")
        } finally {
            setDeleteLoading(false)
        }
    }

    return (
        <ConfirmationDialog onConfirm={() => deleteLicense()} title="Delete this license" description="Are your sure you want to delete this license? All trackers and validation logs with this license will be deleted and every signature associated with this license will no longer be valid.">
            <Button disabled={deleteLoading} variant={"destructive"} size={"icon"}>
                {!deleteLoading &&
                    <Trash />
                }

                {deleteLoading &&
                    <Loader />
                }
            </Button>
        </ConfirmationDialog>
    )
}
