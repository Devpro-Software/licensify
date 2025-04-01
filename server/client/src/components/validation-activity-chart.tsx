"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
import useSWR from "swr"
import Loader from "./loader"

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

type ValidationActivity = {
    date: string
    count: number
}

export function ValidationActivityChart() {
    const { data, isLoading, error } = useSWR("/api/validations/activity")
    const validations = (data as ValidationActivity[]) || []

    if (error) {
        return (
            <div>
                Error
            </div>
        )
    }

    const dayName = (d: Date | string) => {
        const dayName = new Date(d).toLocaleString('en-US', { weekday: 'long' });
        return dayName
    }

    const cdata = validations.map(a => {
        const date = new Date(a.date)
        const name = dayName(date)
        return {
            day: name,
            count: a.count
        }
    })

    let total = 0
    cdata.forEach(c => total += c.count)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity in the last week</CardTitle>
                <CardDescription>
                    Showing total number of server validations made.
                    Offline client validations are not tracked.
                    {isLoading &&
                        <div className="w-[50px]">
                            <Loader />
                        </div>
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="">
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        accessibilityLayer
                        data={cdata}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <YAxis
                            dataKey="count"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" hideLabel />}
                        />
                        <Area
                            dataKey="count"
                            type="linear"
                            fill="var(--color-desktop)"
                            fillOpacity={0.4}
                            stroke="#e88c30"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 font-medium leading-none">
                            {total} total validations this week <TrendingUp className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2 leading-none text-muted-foreground">
                            {dayName(validations.at(0)?.date ?? "")}{" - "}
                            {cdata.length > 1 && dayName(validations.at(cdata.length - 1)?.date ?? "")}
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
