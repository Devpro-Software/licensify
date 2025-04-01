"use client"

import LicenseCard from "@/components/license-card"
import { LicenseForm } from "@/components/license-form"
import Loader from "@/components/loader"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { License } from "@/types/core"
import { CirclePlus } from "lucide-react"
import useSWR from 'swr'


export default function Licenses() {
    const { data, error, isLoading, mutate } = useSWR(`/api/licenses`)

    if (error) {
        return (
            <div>
                Error occured in fetching licenses
            </div>
        )
    }

    const licenses = data as License[]
    licenses?.sort((a, b) => {
        return new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1
    })

    return (
        <div className="w-full">
            <div className="flex justify-between items-center w-full">
                <h4 className="text-4xl font-bold">Licenses</h4>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size={"icon"}>
                            <CirclePlus />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>Create a License</DialogTitle>
                        <LicenseForm></LicenseForm>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mt-5">
                {isLoading &&
                    <div className="w-[100px]">
                        <Loader />
                    </div>
                }
                {!isLoading && (data as License[]).map(l => {
                    return (
                        <div className="" key={l.id}>
                            <LicenseCard license={l} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
