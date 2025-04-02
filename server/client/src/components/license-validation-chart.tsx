"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { License } from "@/types/core"
import { CircleMinus, CirclePlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import useSWR from "swr"
import Loader from "./loader"
import { Button } from "./ui/button"

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },
    mobile: {
        label: "Mobile",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig

type Stat = {
    license: License
    successCount: number
    totalCount: number
}

const defaultShowingCount = 5

export function LicenseValidationBarChart() {
    const [showing, setShowing] = useState(defaultShowingCount)

    const router = useRouter()
    const { data, isLoading } = useSWR("/api/validations/activity?type=license")
    const stats = data as Stat[]
    const totalStatsNumber = stats?.length || 0

    useEffect(() => {
        setShowing(Math.min(totalStatsNumber, defaultShowingCount))
    }, [totalStatsNumber])

    stats?.sort((a, b) => {
        return a.totalCount - b.totalCount
    })

    const cdata = stats?.slice(0, showing)?.map(s => {
        return {
            license: s.license.product,
            successful: s.successCount,
            rejected: s.totalCount - s.successCount,
            id: s.license.id
        }
    }) ?? []

    let totalRejections = 0
    let totalSuccess = 0
    stats?.forEach(s => {
        totalRejections += s.totalCount - s.successCount
        totalSuccess += s.successCount
    })

    const goto = (licenseID: string) => router.push(`/dashboard/licenses/${licenseID}`)

    return (
        <Card>
            <CardHeader className="flex">
                <div>
                    <CardTitle>
                        Validations by license
                    </CardTitle>
                    <CardDescription>
                        successful and rejected validations by license
                        {isLoading &&
                            <div className="w-[50px]">
                                <Loader />
                            </div>
                        }
                    </CardDescription>
                </div>
                <div className="ml-14 flex justify-center items-center text-muted-foreground">
                    <Button onClick={() => setShowing(p => p <= 0 ? p : p - 1)} variant={"ghost"} size={"icon"}>
                        <CircleMinus />
                    </Button>
                    <p className="text-secondary-foreground">
                        Showing {showing}
                    </p>
                    <Button onClick={() => setShowing(p => p >= totalStatsNumber ? p : p + 1)} variant={"ghost"} size={"icon"}>
                        <CirclePlus />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={cdata}>
                        <CartesianGrid vertical={false} />
                        <YAxis
                            axisLine={false}
                        />
                        <XAxis
                            dataKey="license"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 10)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dashed" />}
                        />
                        <Bar onClick={(s) => goto(s.id)} dataKey="successful" fill="#2661d9" radius={4} />
                        <Bar onClick={(s) => goto(s.id)} dataKey="rejected" fill="#e88c30" radius={4} />

                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none">
                    {totalSuccess} total successful validations - {totalRejections} total rejections
                </div>
                <div className="leading-none text-muted-foreground">
                    Showing your top {cdata.length} products
                </div>
            </CardFooter>
        </Card>
    )
}
