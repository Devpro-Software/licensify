"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import useSWR from "swr"


const chartConfig = {
    validations: {
        label: "Validations",
    },
    success: {
        label: "Successful",
        color: "#2661d9",
    },
    rejection: {
        label: "Rejections",
        color: "#e88c30",
    },
} satisfies ChartConfig

type Props = {
    licenseId: string
}

type Stat = {
    date: string
    count: number
    successCount: number
}

export function LicenseValidationChart(props: Props) {
    const params = new URLSearchParams()
    params.set("type", "license")
    params.set("licenseId", props.licenseId)
    const { data } = useSWR(`/api/validations/activity?${params.toString()}`)
    const stats = data as Stat[]

    const [activeChart, setActiveChart] =
        React.useState<keyof typeof chartConfig>("success")

    const total = React.useMemo(
        () => ({
            success: stats?.reduce((acc, curr) => acc + curr.successCount, 0),
            rejection: stats?.reduce((acc, curr) => acc + (curr.count - curr.successCount), 0),
        }),
        [stats]
    )

    const cdata = React.useMemo(() => {
        return stats?.map(s => {
            return {
                date: new Date(s.date).toISOString().split("T")[0],
                success: s.successCount,
                rejection: s.count - s.successCount
            }
        })
    }, [stats])

    return (
        <Card>
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    <CardTitle>Activity for License</CardTitle>
                    <CardDescription>
                        Showing daily validation requests for the last month
                    </CardDescription>
                </div>
                <div className="flex">
                    {["success", "rejection"].map((key) => {
                        const chart = key as keyof typeof chartConfig
                        return (
                            <button
                                key={chart}
                                data-active={activeChart === chart}
                                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                                onClick={() => setActiveChart(chart)}
                            >
                                <span className="text-xs text-muted-foreground">
                                    {chartConfig[chart].label}
                                </span>
                                <span className="text-lg font-bold leading-none sm:text-3xl">
                                    {total[key as keyof typeof total]?.toLocaleString()}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <BarChart
                        accessibilityLayer
                        data={cdata}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-[150px]"
                                    nameKey="validations"
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                    }}
                                />
                            }
                        />
                        <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

