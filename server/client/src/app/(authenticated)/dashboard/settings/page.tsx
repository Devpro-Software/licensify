"use client"

import ProfileCard from "@/components/profile-card"

type Props = {}

export default function Page({ }: Props) {
    return (
        <div className="w-full">
            <div className="mb-5">
                <h4 className="text-4xl font-bold">Settings</h4>
            </div>
            <div className="grid grid-cols-2">
                <div>
                    <ProfileCard />
                </div>
            </div>
        </div>
    )
}
