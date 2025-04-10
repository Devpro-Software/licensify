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
import { CopyButton } from "./copy-button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import CodeBlock from "./code-block"
import { CircleArrowOutUpRight } from "lucide-react"
import Link from "next/link"
import { Badge } from "./ui/badge"
import BooleanBadge from "./boolean-badge"


type Props = {
    id?: string
    trackerId?: string
}

export function ValidationTable(props: Props) {
    const recentValidations = useRecentValidations(props.id)

    const unwrapSig = (sig: string, format?: boolean) => {
        try {
            const s = JSON.parse(sig).license
            if (format) {
                return JSON.stringify(s, null, 4)
            }
            return JSON.stringify(s)
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
                            <TableHead className="">Tracker</TableHead>
                            <TableHead className="">Claims</TableHead>
                            <TableHead className="">User Agent</TableHead>
                            <TableHead className="">Device Location</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentValidations.validations.map((v) => {
                            const claims = unwrapSig(v.signature ?? "{}")
                            return (
                                <TableRow key={v.id}>
                                    <TableCell className="font-medium">{timeAgo(v.createdAt)}</TableCell>
                                    <TableCell>{v.license?.name ?? "NA"}</TableCell>
                                    <TableCell>
                                        <BooleanBadge state={v.status === "Accepted"}>
                                            {v.status}
                                        </BooleanBadge>
                                    </TableCell>
                                    <TableCell>
                                        {v.tracker ?
                                            <div className="flex items-center">
                                                {v.tracker.name}
                                                <Link href={`/dashboard/licenses?trackerId=${v.tracker.id}`}>
                                                    <Button variant={"ghost"} size={"icon"}>
                                                        <CircleArrowOutUpRight />
                                                    </Button>
                                                </Link>
                                            </div>
                                            :
                                            "NA"
                                        }
                                    </TableCell>
                                    <TableCell className="max-w-[150px]">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center">
                                                        <div className="truncate">
                                                            {claims}
                                                        </div>
                                                        <CopyButton ghost content={claims} />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-secondary">
                                                    <CodeBlock code={unwrapSig(v.signature ?? "{}", true)} lang="json" />
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell>{v.userAgent}</TableCell>
                                    <TableCell className="">{v.ip}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell className="text-center bg-none" colSpan={7}>
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
