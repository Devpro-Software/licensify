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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"


type Props = {
    id?: string
}

export function ValidationTable(props: Props) {
    const recentValidations = useRecentValidations(props.id)
    return (
        <Card className="p-5">
            <CardHeader>
                <CardTitle className="truncate">Recent Validations {props.id && "for license " + props.id}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>Recent Validation Activity</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="">User Agent</TableHead>
                            <TableHead className="text-right">Device Location</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentValidations.validations.map((v) => {
                            return (
                                <TableRow key={v.id}>
                                    <TableCell className="font-medium">{timeAgo(v.createdAt)}</TableCell>
                                    <TableCell>{v.license?.product ?? "NA"}</TableCell>
                                    <TableCell>{v.status}</TableCell>
                                    <TableCell>{v.userAgent}</TableCell>
                                    <TableCell className="text-right">{v.ip}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell className="text-center bg-none" colSpan={5}>
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
