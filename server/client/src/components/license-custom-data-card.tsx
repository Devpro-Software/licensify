"use client"

import { BookOpen } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import LicenseCustomDataEditor from "./license-custom-data-editor"
import { Separator } from "./ui/separator"

type Props = {
    id: string
    data: {
        [key: string]: unknown
    }
    mutatePath?: string
}


export default function LicenseCustomDataCard(props: Props) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Custom Data</CardTitle>
                <CardDescription>This data will be stored on the server side for this license, and can hold any use case specific information for your business.</CardDescription>
                <Button className="max-w-xs" variant={"outline"}>
                    Check out the documentation
                    <BookOpen />
                </Button>
            </CardHeader>
            <Separator className="my-1" />
            <CardContent className="overflow-y-hidden">
                <LicenseCustomDataEditor mutatePath={props.mutatePath} id={props.id} data={props.data} />
            </CardContent>
        </Card>
    )
}
