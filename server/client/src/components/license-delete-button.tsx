import { Loader, Trash } from "lucide-react"
import { Button } from "./ui/button"
import { useState } from "react"
import { mutate } from "swr"
import { toast } from "sonner"
import { licensify } from "@/configuraton/axios"

type Props = {
    id: string
    mutatePath?: string
}

export default function LicenseDeleteButton({ id, mutatePath }: Props) {
    const [deleteLoading, setDeleteLoading] = useState(false)

    const deleteLicense = async () => {
        setDeleteLoading(true)
        try {
            await licensify.delete(`/api/licenses/${id}`)
            if (mutatePath) {
                mutate(mutatePath)
            }
            toast("Successfully deleted license")
        } catch (e) {
            toast("Failed to deleted license")
        } finally {
            setDeleteLoading(false)
        }
    }

    return (
        <Button disabled={deleteLoading} onClick={() => deleteLicense()} variant={"destructive"} size={"icon"}>
            {!deleteLoading &&
                <Trash />
            }

            {deleteLoading &&
                <Loader />
            }
        </Button>
    )
}
