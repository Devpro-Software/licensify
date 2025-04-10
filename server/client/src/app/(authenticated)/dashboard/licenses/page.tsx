"use client"

import { useSession } from "@/components/auth-provider"
import LicenseView from "@/components/license-view"
import LicensesView from "@/components/licenses-view"
import TrackerView from "@/components/tracker-view"
import { useSearchParams } from "next/navigation"


export default function Licenses() {
    const { session } = useSession()
    const params = useSearchParams()
    const licenseId = params.get("licenseId")
    const trackerId = params.get("trackerId")

    if (!session) {
        return
    }

    if (licenseId) {
        return (
            <div>
                <LicenseView trackerId={trackerId ?? undefined} id={licenseId} />
            </div>
        )
    }

    if (trackerId) {
        return (
            <div>
                <TrackerView trackerId={trackerId} />
            </div>
        )
    }


    return <LicensesView />
}
