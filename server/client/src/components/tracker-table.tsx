"use client"

import { licensify } from "@/configuraton/axios"
import { timeAgo } from "@/services/time"
import { Tracker } from "@/types/core"
import { Check, CirclePlay, CirclePlus, CircleStop, Timer, Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"
import InlineEditor from "./inline-editor"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import SignatureDialog from "./signature-builder"

type Props = {
    licenseId: string
}

export default function TrackerTable({ licenseId }: Props) {
    const { data: count } = useSWR(`/api/licenses/${licenseId}/trackers/count`)
    const totalCount = count as number ?? 0

    const [page, setPage] = useState(0)

    const endpoint = page > 0 ? `/api/licenses/${licenseId}/trackers?page=${page}` : `/api/licenses/${licenseId}/trackers`
    const { data } = useSWR(endpoint)
    const trackers = data as Tracker[]


    const createTracker = async () => {
        try {
            await licensify.post(`/api/licenses/${licenseId}/trackers`)
            toast("Successfully created tracker")
            mutate(endpoint)
        } catch (e) {
            console.log(e)
            toast("Failed to create tracker")
        }
    }

    const updateName = async (id: string, s: string) => {
        try {
            const params = new URLSearchParams()
            params.set("name", s)
            await licensify.put(`/api/trackers/${id}?${params.toString()}`)
            toast("Successfully renamed tracker")
            mutate(endpoint)
        } catch (e) {
            console.log(e)
            toast("Failed to update tracker")
        }
    }

    const deleteTracker = async (id: string) => {
        try {
            await licensify.delete(`/api/trackers/${id}`)
            toast("Successfully deleted tracker")
            mutate(endpoint)
        } catch (e) {
            console.log(e)
            toast("Failed to delete tracker")
        }
    }

    const enableTracker = async (id: string, enabled: boolean) => {
        try {
            await licensify.put(`/api/trackers/${id}?enabled=${enabled}`)
            toast("Successfully updated tracker")
            mutate(endpoint)
        } catch (e) {
            console.log(e)
            toast("Failed to update tracker")
        }
    }

    const activateTracker = async (id: string, active: boolean) => {
        try {
            await licensify.put(`/api/trackers/${id}?activated=${active}`)
            toast("Successfully updated tracker")
            mutate(endpoint)
        } catch (e) {
            console.log(e)
            toast("Failed to update tracker")
        }
    }

    trackers?.sort((a, b) => {
        return new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1
    })

    return (
        <Card className="size-full">
            <CardHeader>
                <CardTitle>Trackers</CardTitle>
                <CardDescription>Trackers are tags that can control and track the lifecycle of specific signatures. Allows for powerful use cases for example license activation flows.</CardDescription> </CardHeader>
            <CardContent>
                <div className="flex justify-end">
                    <Button onClick={createTracker} variant={"default"} size={"icon"}>
                        <CirclePlus />
                    </Button>
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
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {trackers?.map(t => {
                            return (
                                <TableRow key={t.id}>
                                    <TableCell className="text-muted-foreground">{t.id}</TableCell>
                                    <TableCell className="">
                                        <InlineEditor small value={t.name} onSubmit={s => updateName(t.id, s)} />
                                    </TableCell>
                                    <TableCell>{timeAgo(t.createdAt)}</TableCell>
                                    <TableCell>Last Validated</TableCell>
                                    <TableCell>{t.activatedDate ? timeAgo(t.activatedDate) : "Not activated"}</TableCell>
                                    <TableCell>{t.enabled ? "Yes" : "No"}</TableCell>
                                    <TableCell className="flex gap-3">
                                        <SignatureDialog id={licenseId} disableAddTrackerButton trackerId={t.id} />
                                        <Button disabled={!!t.activatedDate} onClick={() => activateTracker(t.id, true)}>
                                            {t.activatedDate &&
                                                <>
                                                    Activated
                                                    <Check />
                                                </>
                                            }
                                            {!t.activatedDate &&
                                                <>
                                                    Activate <Timer />
                                                </>
                                            }
                                        </Button>
                                        <Button variant={"secondary"} onClick={() => enableTracker(t.id, !t.enabled)}>
                                            {t.enabled ? <CircleStop /> : <CirclePlay />}
                                        </Button>
                                        <Button onClick={() => deleteTracker(t.id)} variant={"destructive"} size={"icon"}>
                                            <Trash />
                                        </Button>
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
                        if (page * 30 >= totalCount) {
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
