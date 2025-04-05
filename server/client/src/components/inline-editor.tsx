"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "./ui/button"
import { CircleCheckBig, CircleMinus, Pencil } from "lucide-react"
import { Input } from "./ui/input"

type Props = {
    value: string
    onSubmit: (s: string) => void
    large?: boolean
    small?: boolean
    ghost?: boolean
}

export default function InlineEditor(props: Props) {
    const [name, setName] = useState(props.value)
    const [editName, setEditName] = useState(false)


    const done = async () => {
        props.onSubmit(name)
        setEditName(false)
    }

    return (
        <div>
            {!editName &&
                <div className="flex items-center justify-start gap-x-5">
                    <h4 className={cn("font-bold truncate max-w-36 md:max-w-64", props.large ? "text-4xl" : (props.small ? "text-sm" : "text-2xl"))}>
                        {props.value}
                    </h4>
                    <Button onClick={() => {
                        setEditName(true)
                    }} variant={"outline"} size={"icon"}>
                        <Pencil />
                    </Button>
                </div>
            }
            {editName &&
                <div className="flex items-center justify-start gap-x-3">
                    <Input onKeyDownCapture={(k) => {
                        if (k.key === "Enter") {
                            done()
                        }
                    }} autoFocus className="" value={name} onChange={s => setName(s.target.value)} />
                    <Button onClick={() => setEditName(false)} type="button" variant={"ghost"}>
                        <CircleMinus />
                    </Button>
                    <Button onClick={done} type="button" variant={"ghost"}>
                        <CircleCheckBig />
                    </Button>
                </div>
            }
        </div>
    )
}
