"use client"

import useSWR from "swr"
import Loader from "./loader"
import { License } from "@/types/core"
import { ValidationTable } from "./validation-table"
import SignatureViewer from "./signature-viewer"

type Props = {
    id: string
}

export default function LicenseView({ id }: Props) {
    const { data, isLoading } = useSWR(`/api/licenses/${id}`)
    const license = data as License

    if (isLoading || !license) {
        return (
            <div>
                <div className="w-[200px]">
                    <Loader />
                </div>
            </div>
        )

    }

    return (
        <div>
            <div className="mb-6">
                <div>
                    <h4 className="text-4xl font-bold mb-3">{license.product}</h4>
                    <h4 className="text-lg text-muted-foreground">ID: {license.id}</h4>
                </div>
                {/* <SignatureViewer  /> */}
            </div>
            <div className="grid">
                <div>
                    <ValidationTable id={license.id} />
                </div>
                <div>

                </div>
            </div>
        </div>
    )
}
