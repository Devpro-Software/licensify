"use client"

import { licensify } from "@/configuraton/axios"
import { timeAgo } from "@/services/time"
import { License } from "@/types/core"
import { CircleCheckBig, CircleMinus, CirclePlay, CircleStop, Pencil, Signature, Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { mutate } from "swr"
import Loader from "./loader"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog"
import SignatureViewer from "./signature-viewer"
import { Input } from "./ui/input"

type Props = {
    license: License
}

export default function LicenseCard(props: Props) {
    const license = props.license
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [toggleLoading, setToggleLoading] = useState(false)

    const [loading, setNameLoading] = useState(false)
    const [editName, setEditName] = useState(false)
    const [name, setName] = useState(license.product)


    const deleteLicense = async () => {
        setDeleteLoading(true)
        try {
            await licensify.delete(`/api/licenses/${license.id}`)
            mutate("/api/licenses")
            toast("Successfully deleted license")
        } catch (e) {
            toast("Failed to deleted license")
        } finally {
            setDeleteLoading(false)
        }
    }

    const updateLicense = async (active?: boolean, name?: string) => {
        if (active !== undefined) {
            setToggleLoading(true)
        }
        if (name) {
            setNameLoading(true)
        }
        try {
            const params = new URLSearchParams()
            if (name) {
                params.set("name", name)
            }
            if (active !== undefined) {
                params.set("active", active ? "true" : "false")
            }

            await licensify.put(`/api/licenses/${license.id}?${params.toString()}`)
            mutate("/api/licenses")
        } catch (e) {
            const str = active ? "activate" : "deactivate"
            toast(`Failed to ${str} license`)
            console.log(e)
        } finally {
            setToggleLoading(false)
            setNameLoading(false)
        }
    }

    const truncate = (str: string, maxLength: number): string => {
        return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
    }


    return (
        <Card className="h-full w-full">
            <CardHeader>
                {!editName &&
                    <div className="flex items-center justify-between gap-x-5">
                        <CardTitle className="text-2xl font-bold truncate max-w-36 md:max-w-64">
                            {license.product}
                        </CardTitle>
                        <Button onClick={() => {
                            setEditName(true)
                        }} variant={"outline"} size={"icon"}>
                            <Pencil />
                        </Button>
                    </div>
                }
                {editName &&
                    <form onSubmit={async () => {
                        await updateLicense(undefined, name)
                    }} className="flex items-center justify-start gap-x-3">
                        <Input autoFocus className="" value={name} onChange={s => setName(s.target.value)} />
                        <Button onClick={() => setEditName(false)} type="button" variant={"ghost"}>
                            <CircleMinus />
                        </Button>
                        <Button type="submit" variant={"ghost"}>
                            <CircleCheckBig />
                        </Button>
                    </form>
                }

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
                <div className="flex justify-between gap-x-3 w-full">
                    <SignatureViewer license={license} />
                    <div className="flex gap-3">
                        <Button className="min-w-24" onClick={() => updateLicense(!license.active)}>
                            {toggleLoading &&
                                <Loader dark />
                            }
                            {!toggleLoading &&
                                <>
                                    {license.active ? "Deactivate" : "Activate"}
                                    {license.active ? <CircleStop /> : <CirclePlay />}
                                </>
                            }
                        </Button>
                        <Button disabled={deleteLoading} onClick={() => deleteLicense()} variant={"destructive"} size={"icon"}>
                            {!deleteLoading &&
                                <Trash />
                            }

                            {deleteLoading &&
                                <Loader />
                            }
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
