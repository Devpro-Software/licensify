"use client"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import useRecentValidations from "@/hooks/use-recent-validations"
import { timeAgo } from "@/services/time"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Separator } from "./ui/separator"


type Props = {
    id?: string
}

export function ValidationTable(props: Props) {
    const recentValidations = useRecentValidations(props.id)

    const unwrapSig = (sig: string) => {
        try {
            return JSON.stringify(JSON.parse(sig).license)
        } catch (e) {
            return "NA"
        }
    }

    return (
        <Card className="p-5">
            <CardHeader>
                <CardTitle className="truncate">Validation Logs</CardTitle>
                <CardDescription>A stream of recent validations.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
                <Table>
                    <TableCaption>Recent Validation Activity</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="">User Agent</TableHead>
                            <TableHead className="">Claims</TableHead>
                            <TableHead className="text-right">Device Location</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentValidations.validations.map((v) => {
                            return (
                                <TableRow key={v.id}>
                                    <TableCell className="font-medium">{timeAgo(v.createdAt)}</TableCell>
                                    <TableCell>{v.license?.name ?? "NA"}</TableCell>
                                    <TableCell>{v.status}</TableCell>
                                    <TableCell>{v.userAgent}</TableCell>
                                    <TableCell>{unwrapSig(v.signature ?? "{}")}</TableCell>
                                    <TableCell className="text-right">{v.ip}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell className="text-center bg-none" colSpan={6}>
                                <Button className="w-full" variant={"secondary"} onClick={async () => {
                                    if (!await recentValidations.loadMore()) {
                                        toast("All activity is loaded")
                                    }
                                }}>Load more</Button>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>
    )
}
