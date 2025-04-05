"use client"

import { timeAgo } from "@/services/time"
import { License } from "@/types/core"
import { CircleArrowOutUpRight } from "lucide-react"
import { useRouter } from "next/navigation"
import LicenseActivationButton from "./license-activation-button"
import LicenseNameEditor from "./license-name-editor"
import SignatureDialog from "./signature-builder"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "./ui/card"

type Props = {
    license: License
}

export default function LicenseCard(props: Props) {
    const license = props.license
    const router = useRouter()

    return (
        <Card className="h-full w-full">
            <CardHeader>
                <LicenseNameEditor mutatePath="/api/licenses" name={license.name} id={license.id} />
                <CardDescription className="text-nowrap overflow-x-hidden">{license.id}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <h4 className="font-bold text-lg">Created</h4>
                        <p className="text-muted-foreground">{timeAgo(license.createdAt)}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">Updated</h4>
                        <p className="text-muted-foreground">{timeAgo(license.updatedAt)}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">Active</h4>
                        <p className="text-muted-foreground">{license.active ? "Yes" : "No"}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <div className="flex justify-between gap-3 w-full flex-wrap">
                    <div className="flex gap-3">
                        <SignatureDialog id={license.id} />
                        <Button onClick={() => router.push(`?licenseId=${license.id}`)} variant={"default"} size={"icon"}>
                            <CircleArrowOutUpRight />
                        </Button>
                    </div>

                    <div className="flex gap-3">
                        <LicenseActivationButton mutatePath="/api/licenses" id={license.id} active={license.active} />
                        {/* <LicenseDeleteButton mutatePath={"/api/licenses"} id={license.id} /> */}
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
