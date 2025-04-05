import { licensify } from "@/configuraton/axios"
import { toast } from "sonner"
import { mutate } from "swr"
import InlineEditor from "./inline-editor"

type Props = {
    name: string
    id: string
    large?: boolean
    mutatePath?: string
}

export default function LicenseNameEditor(props: Props) {

    const updateLicense = async (name: string) => {
        try {
            const params = new URLSearchParams()
            params.set("name", name)
            await licensify.put(`/api/licenses/${props.id}?${params.toString()}`)
            if (props.mutatePath) {
                mutate(props.mutatePath)
            }
        } catch (e) {
            toast("Failed to rename license")
            console.log(e)
        }
    }

    return (
        <div>
            <InlineEditor value={props.name} onSubmit={updateLicense} />
        </div>
    )
}
