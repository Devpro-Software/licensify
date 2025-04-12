import { licensify } from "@/configuraton/axios"
import { Signature } from "@/types/core"
import { useEffect, useState } from "react"

export default function useSignature(id: string): {
    signature: string | null,
    loading: boolean
} {
    const [signLoading, setSignLoading] = useState(false)
    const [signature, setSignature] = useState<string | null>(null)

    const signLicense = async () => {
        setSignLoading(true)
        try {
            const resp = await licensify.post(`/api/licenses/${id}/sign`)
            const sig = resp.data as Signature
            setSignature(JSON.stringify(sig, null, 4))
        } catch (e) {
            console.log(e)
        } finally {
            setSignLoading(false)
        }
    }

    useEffect(() => {
        signLicense()
    }, [])

    return {
        loading: signLoading,
        signature
    }
}
