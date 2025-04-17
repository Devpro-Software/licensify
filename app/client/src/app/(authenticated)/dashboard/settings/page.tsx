"use client"

import ApiKeyCard from "@/components/api-key-card"
import KeyUploadCard from "@/components/key-upload-card"
import ProfileCard from "@/components/profile-card"

type Props = {}

export default function Page({ }: Props) {
    return (
        <div className="w-full">
            <div className="mb-5">
                <h4 className="text-4xl font-bold">Settings</h4>
                <h4 className="text-md text-muted-foreground mt-2">Manage your profile, API keys and more.</h4>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                    <KeyUploadCard />
                </div>
                <div>
                    <ApiKeyCard />
                </div>
                <div>
                    <ProfileCard />
                </div>
            </div>
        </div>
    )
}
