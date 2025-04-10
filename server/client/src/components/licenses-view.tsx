"use client"

import React, { Suspense } from 'react'
import useSWR from 'swr'
import LicenseCreationDialog from './license-creation-dialog'
import Loader from './loader'
import { License } from '@/types/core'
import LicenseCard from './license-card'

type Props = {}

export default function LicensesView({ }: Props) {
    const { data, error, isLoading } = useSWR(`/api/licenses`)

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
        <Suspense>
            <div className="w-full">
                <div className="flex justify-between items-center w-full">
                    <div>
                        <h4 className="text-4xl font-bold">Licenses</h4>
                        <h4 className="text-md text-muted-foreground mt-2">Licenses are general purpose digital contracts that enable various validation and authentication use cases.</h4>
                    </div>
                    <LicenseCreationDialog />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 mt-5">
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
        </Suspense>
    )
}
