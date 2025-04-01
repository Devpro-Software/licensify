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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import useSWR from "swr"
import { useState } from "react"
import useRecentValidations from "@/hooks/use-recent-validations"
import { Button } from "./ui/button"
import { toast } from "sonner"
import { timeAgo } from "@/services/time"

const invoices = [
    {
        invoice: "INV001",
        paymentStatus: "Paid",
        totalAmount: "$250.00",
        paymentMethod: "Credit Card",
    },
    {
        invoice: "INV002",
        paymentStatus: "Pending",
        totalAmount: "$150.00",
        paymentMethod: "PayPal",
    },
    {
        invoice: "INV003",
        paymentStatus: "Unpaid",
        totalAmount: "$350.00",
        paymentMethod: "Bank Transfer",
    },
    {
        invoice: "INV004",
        paymentStatus: "Paid",
        totalAmount: "$450.00",
        paymentMethod: "Credit Card",
    },
    {
        invoice: "INV005",
        paymentStatus: "Paid",
        totalAmount: "$550.00",
        paymentMethod: "PayPal",
    },
    {
        invoice: "INV006",
        paymentStatus: "Pending",
        totalAmount: "$200.00",
        paymentMethod: "Bank Transfer",
    },
    {
        invoice: "INV007",
        paymentStatus: "Unpaid",
        totalAmount: "$300.00",
        paymentMethod: "Credit Card",
    },
]

export function ValidationTable() {
    const recentValidations = useRecentValidations()
    return (
        <Card className="p-5">
            <CardHeader>
                <CardTitle>Recent Validations</CardTitle>
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
                        {recentValidations.validations.map((v) => (
                            <TableRow key={v.id}>
                                <TableCell className="font-medium">{timeAgo(v.createdAt)}</TableCell>
                                <TableCell>{v.license?.product ?? "NA"}</TableCell>
                                <TableCell>{v.succeeded ? "Success" : "Rejected"}</TableCell>
                                <TableCell>{v.userAgent}</TableCell>
                                <TableCell className="text-right">{v.ip}</TableCell>
                            </TableRow>
                        ))}
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
