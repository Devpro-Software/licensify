"use client"

import { timeAgo } from "@/services/time"
import { Tracker } from "@/types/core"
import { ArrowLeft, Clock, Power, TimerIcon } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import { LicenseValidationChart } from "./license-validation-chart"
import Loader from "./loader"
import { Button } from "./ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card"
import EnableTrackerButton from "./enable-tracker-button"
import ActivateTrackerButton from "./activate-tracker-button"
import DeleteTrackerButton from "./delete-tracker-button"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import UpdateTrackerNameEditor from "./update-tracker-editor"
import { Badge } from "./ui/badge"
import { cn } from "@/lib/utils"
import SignatureDialog from "./signature-builder"
import BooleanBadge from "./boolean-badge"

type Props = {
    trackerId: string
}

export default function TrackerView(props: Props) {
    const endpoint = `/api/trackers/${props.trackerId}`
    const { data, isLoading } = useSWR(endpoint)
    const router = useRouter()
    const tracker = data as Tracker

    useEffect(() => {
        if (!tracker && !isLoading) {
            toast("Tracker not found")
            router.push("/dashboard/licenses")
        }
    }, [tracker, isLoading])

    if (isLoading || !tracker) {
        return (
            <div className="size-[200px]">
                <Loader />
            </div>
        )
    }

    const stats = [
        {
            label: "Created",
            value: timeAgo(tracker.createdAt),
            icon: <Clock />
        },
        {
            label: "Activation Status",
            value: (
                <BooleanBadge state={!!tracker.activatedDate}>
                    {tracker.activatedDate ? `Activated ${timeAgo(tracker.activatedDate)}` : "Not Activated"}
                </BooleanBadge>
            ),
            icon: <TimerIcon />
        },
        {
            label: "Enabled",
            value: (
                <BooleanBadge state={tracker.enabled}>
                    {tracker.enabled ? "Yes" : "No"}
                </BooleanBadge>
            ),
            icon: <Power />
        },
    ]

    return (
        <div>
            <Link href={`/dashboard/licenses?licenseId=${tracker.license.id}`}>
                <Button onClick={() => {
                }} className="mb-3" variant={"ghost"}>
                    <ArrowLeft />
                    Go Back
                </Button>
            </Link>
            <div className="max-w-lg">
                <UpdateTrackerNameEditor small={false} id={tracker.id} value={tracker.name} mutatePath={endpoint} />
                <h4 className="text-lg text-muted-foreground">ID: {props.trackerId}</h4>
            </div>
            <div className="mt-5 flex gap-4">
                <EnableTrackerButton id={tracker.id} enabled={tracker.enabled} mutatePath={endpoint} />
                <ActivateTrackerButton id={tracker.id} activated={!!tracker.activatedDate} mutatePath={endpoint} />
                <DeleteTrackerButton id={tracker.id} mutatePath={endpoint} onDelete={() => router.push(`/dashboard/licenses?licenseId=${tracker.license.id}`)} />
                <SignatureDialog id={tracker.license.id} disableAddTrackerButton trackerId={tracker.id} />
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 mt-5 gap-5">
                {stats.map(s => {
                    return (
                        <Card key={s.label}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="mb-2">{s.label}</CardTitle>
                                        <CardDescription>{s.value}</CardDescription>
                                    </div>
                                    <div>
                                        {s.icon}
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    )
                })}
            </div>
            <div className="mt-7">
                <LicenseValidationChart trackerId={tracker.id} licenseId={tracker.license.id} />
            </div>
        </div>
    )
}
