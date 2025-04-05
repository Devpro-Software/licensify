"use client"

import { Code, Eye, EyeOff, Terminal } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Separator } from "./ui/separator"
import { Button } from "./ui/button"
import { useState } from "react"
import { Input } from "./ui/input"
import useSWR, { mutate } from "swr"
import { licensify } from "@/configuraton/axios"
import { toast } from "sonner"
import { CopyButton } from "./copy-button"

type Props = {}

const filler = "************************************************************"

export default function ApiKeyCard({ }: Props) {
    const [visible, setVisible] = useState<boolean>(false)
    const { data } = useSWR("/api/client")

    const generateClient = async () => {
        try {
            await licensify.post("/api/client")
            toast("Successfully generated API key")
            mutate("/api/client")
            setVisible(true)
        } catch (e) {
            console.log(e)
            toast("Failed to generate API key")
        }
    }

    return (
        <Card className="size-full">
            <CardHeader>
                <CardTitle className="text-2xl">API key</CardTitle>
                <CardDescription>Generate an API key to access the REST API. Generating a key overrides previously generated keys.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
                <Alert className="mb-4">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Warning!</AlertTitle>
                    <AlertDescription>
                        Generating a new key will overwrite the previous one.
                    </AlertDescription>
                </Alert>
                {data?.apiKey &&
                    <div className="flex items-center gap-5 my-4">
                        <Input value={visible ? data.apiKey : filler} disabled className="text-lg font-semibold" />
                        <div className="flex items-center gap-2 my-4">
                            <Button onClick={() => setVisible(!visible)} variant={"outline"} size={"icon"}>
                                {!visible && <Eye />}
                                {visible && <EyeOff />}
                            </Button>
                            <CopyButton content={data.apiKey} />
                        </div>
                    </div>
                }
                <Button onClick={generateClient} variant={"outline"} className="w-full">
                    Generate API Key
                    <Code />
                </Button>
            </CardContent>
        </Card>
    )
}
