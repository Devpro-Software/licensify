import { licensify } from "@/configuraton/axios";
import { Validation } from "@/types/core";
import { useEffect, useState } from "react";
import useSWR from "swr";

type RecentValidationStream = {
    loadMore: () => Promise<boolean>
    validations: Validation[]
    page: number
}

const pagesSize = 5

export default function useRecentValidations(): RecentValidationStream {
    const [validations, setValidations] = useState<Validation[]>([])
    const [page, setPage] = useState(0)

    useEffect(() => {
        loadMore()
    }, [])

    const loadMore = async (): Promise<boolean> => {
        try {
            const countResp = await licensify.get("/api/validations/count")
            const count = countResp.data as number
            const maxPage = Math.ceil(count / pagesSize)
            if (page >= maxPage) {
                return false
            }

            const params = new URLSearchParams()
            params.set("page", page.toString())
            params.set("pageSize", pagesSize.toString())
            const resp = await licensify.get(`/api/validations?${params.toString()}`)
            const newValidations = resp.data as Validation[]
            setValidations(p => [...p, ...newValidations])
            setPage(p => p + 1)
            return true
        } catch (e) {
            console.log(e)
            return false
        }
    }


    return {
        validations,
        loadMore,
        page
    }
}
