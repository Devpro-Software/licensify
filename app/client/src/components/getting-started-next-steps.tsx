"use client"

import { CircleGauge, CirclePlus, FolderCode } from "lucide-react"
import { LicenseForm } from "./license-form"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog"
import { useRouter } from "next/navigation"

type Props = {
    done: () => void
}

export default function GettingStartedNextSteps(props: Props) {
    const router = useRouter()
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>
                    Exlpore next steps with the API and dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-x-4">
                    <div className="flex flex-col justify-center items-center gap-y-2">
                        <Button onClick={() => router.push("/docs")} size={"icon"} variant={"outline"}>
                            <FolderCode />
                        </Button>
                        <small className="text-muted-foreground text-wrap">
                            Checkout the API docs
                        </small>
                    </div>
                    <div className="flex flex-col justify-center items-center gap-y-2">
                        <Button onClick={() => router.push("/dashboard/licenses")} size={"icon"} variant={"outline"}>
                            <CircleGauge />
                        </Button>
                        <small className="text-muted-foreground">
                            Go to Dashboard
                        </small>
                    </div>
                    <div className="flex flex-col justify-center items-center gap-y-2">

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size={"icon"} variant={"outline"}>
                                    <CirclePlus />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>Create a License</DialogTitle>
                                <LicenseForm></LicenseForm>
                            </DialogContent>
                        </Dialog>
                        <small className="text-muted-foreground">
                            Create new license
                        </small>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={() => props.done()}>
                    Go back
                </Button>
            </CardFooter>
        </Card>
    )
}
