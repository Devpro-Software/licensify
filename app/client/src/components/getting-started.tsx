"use client"

import { License } from "@/types/core"
import GettingStartedStepper from "./getting-started-stepper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

type Props = {
    license: License
}

export default function GettingStarted({ license }: Props) {
    return (
        <Card className="w-full h-full">
            <CardHeader>
                <CardTitle className="text-2xl">Quick Start with this license</CardTitle>
                <CardDescription>Follow the steps to get started validating with this license</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="px-10">
                    <GettingStartedStepper license={license} />
                </div>
            </CardContent>
        </Card>
    )
}


