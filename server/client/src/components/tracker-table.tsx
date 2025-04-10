"use client"

import { timeAgo } from "@/services/time"
import { Tracker } from "@/types/core"
import { ChartColumn, CircleArrowOutUpRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import useSWR from "swr"
import ActivateTrackerButton from "./activate-tracker-button"
import CreateTrackerButton from "./create-tracker-button"
import DeleteTrackerButton from "./delete-tracker-button"
import EnableTrackerButton from "./enable-tracker-button"
import SignatureDialog from "./signature-builder"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import UpdateTrackerNameEditor from "./update-tracker-editor"
import BooleanBadge from "./boolean-badge"

type Props = {
    licenseId: string
}

export default function TrackerTable({ licenseId }: Props) {
    const { data: count } = useSWR(`/api/licenses/${licenseId}/trackers/count`)
    const totalCount = count as number ?? 0

    const router = useRouter()
    const searchParams = useSearchParams()

    const [page, setPage] = useState(0)
    const [search, setSearch] = useState("")

    const params = new URLSearchParams()
    if (search) {
        params.set("name", search)
    }
    if (page > 0) {
        params.set("page", page.toString())
    }

    const endpoint = params.size > 0 ? `/api/licenses/${licenseId}/trackers?${params.toString()}` : `/api/licenses/${licenseId}/trackers`
    const { data } = useSWR(endpoint)
    const trackers = data as Tracker[]

    trackers?.sort((a, b) => {
        return new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1
    })

    return (
        <Card className="size-full">
            <CardHeader>
                <CardTitle>Trackers</CardTitle>
                <CardDescription>Trackers are tags that can be added to signatures and hold server side state that can control and track specific signature lifecycles.</CardDescription>
                <Input className="w-md mt-4" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </CardHeader>
            <CardContent>
                <div className="flex justify-end">
                    <CreateTrackerButton mutatePath={endpoint} licenseId={licenseId} />
                </div>
                <Table>
                    <TableCaption>Trackers</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Last Validated</TableHead>
                            <TableHead>Activated</TableHead>
                            <TableHead>Enabled</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {trackers?.map(t => {
                            return (
                                <TableRow key={t.id}>
                                    <TableCell className="text-muted-foreground">{t.id}</TableCell>
                                    <TableCell className="">
                                        <UpdateTrackerNameEditor ghost value={t.name} id={t.id} mutatePath={endpoint} />
                                    </TableCell>
                                    <TableCell>{timeAgo(t.createdAt)}</TableCell>
                                    <TableCell>Last Validated</TableCell>
                                    <TableCell>
                                        <BooleanBadge state={!!t.activatedDate}>
                                            {t.activatedDate ? timeAgo(t.activatedDate) : "Not activated"}
                                        </BooleanBadge>
                                    </TableCell>
                                    <TableCell>
                                        <BooleanBadge state={t.enabled}>
                                            {t.enabled ? "Yes" : "No"}
                                        </BooleanBadge>
                                    </TableCell>
                                    <TableCell className="flex gap-3">
                                        <Button onClick={() => {
                                            const pr = new URLSearchParams(searchParams)
                                            pr.set("trackerId", t.id)
                                            pr.delete("licenseId")
                                            router.push("?" + pr.toString())
                                        }} variant={"outline"} size={"icon"}>
                                            <CircleArrowOutUpRight />
                                        </Button>
                                        <SignatureDialog id={licenseId} disableAddTrackerButton trackerId={t.id} />
                                        <ActivateTrackerButton id={t.id} activated={!!t.activatedDate} mutatePath={endpoint} />
                                        <EnableTrackerButton id={t.id} mutatePath={endpoint} enabled={t.enabled} />
                                        <DeleteTrackerButton id={t.id} mutatePath={endpoint} />
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                <div className="flex justify-end w-full gap-3">
                    <Button onClick={() => {
                        if (page <= 0) {
                            return
                        }
                        setPage(page - 1)
                    }} variant={"secondary"}>
                        Back
                    </Button>
                    <Button onClick={() => {
                        if ((page + 1) * 30 >= totalCount) {
                            return
                        }
                        setPage(page + 1)
                    }}>
                        Next
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
