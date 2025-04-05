"use client"

import { License } from "@/types/core"
import useSWR from "swr"
import GettingStarted from "./getting-started"
import LicenseActivationButton from "./license-activation-button"
import LicenseNameEditor from "./license-name-editor"
import { LicenseValidationChart } from "./license-validation-chart"
import Loader from "./loader"
import SignatureDialog from "./signature-builder"
import { ValidationTable } from "./validation-table"
import LicenseCustomDataCard from "./license-custom-data-card"
import TrackerTable from "./tracker-table"

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
            <div className="mb-6 flex justify-between items-center gap-x-5">
                <div>
                    <LicenseNameEditor mutatePath={`/api/licenses/${id}`} large id={license.id} name={license.name} />
                    <h4 className="text-lg text-muted-foreground">ID: {license.id}</h4>
                </div>
                <div className="flex gap-3">
                    <LicenseActivationButton mutatePath={`/api/licenses/${id}`} id={license.id} active={license.active} />
                    <SignatureDialog id={license.id} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 xl:col-span-1">
                    <GettingStarted license={license} />
                </div>
                <div className="col-span-2 xl:col-span-1">
                    <LicenseCustomDataCard mutatePath={`/api/licenses/${id}`} id={license.id} data={license.data} />
                </div>
                <div className="col-span-2">
                    <TrackerTable licenseId={license.id} />
                </div>
                <div className="col-span-2">
                    <LicenseValidationChart licenseId={license.id} />
                </div>
                <div className="col-span-2">
                    <ValidationTable id={license.id} />
                </div>
            </div>
        </div>
    )
}
