import { licensify } from "@/configuraton/axios"
import { CirclePlay, CircleStop } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { mutate } from "swr"
import Loader from "./loader"
import { Button } from "./ui/button"

type Props = {
    active: boolean
    id: string
    mutatePath?: string
}

export default function LicenseActivationButton({ id, active, mutatePath }: Props) {
    const [toggleLoading, setToggleLoading] = useState(false)

    const updateLicense = async (active: boolean) => {
        if (active !== undefined) {
            setToggleLoading(true)
        }
        try {
            const params = new URLSearchParams()
            if (active !== undefined) {
                params.set("active", active ? "true" : "false")
            }

            await licensify.put(`/api/licenses/${id}?${params.toString()}`)
            if (mutatePath) {
                mutate(mutatePath)
            }
        } catch (e) {
            const str = active ? "activate" : "deactivate"
            toast(`Failed to ${str} license`)
            console.log(e)
        } finally {
            setToggleLoading(false)
        }
    }

    return (
        <Button className="min-w-24" onClick={() => updateLicense(!active)}>
            {toggleLoading &&
                <Loader dark />
            }
            {!toggleLoading &&
                <>
                    {active ? "Deactivate" : "Activate"}
                    {active ? <CircleStop /> : <CirclePlay />}
                </>
            }
        </Button>
    )
}
