"use client"

import { licensify } from "@/configuraton/axios"
import { toast } from "sonner"
import { mutate } from "swr"
import KeyValueEditor from "./key-value-editor"

type Props = {
    id: string
    data: {
        [key: string]: unknown
    }
    mutatePath?: string
}


export default function LicenseCustomDataEditor(props: Props) {
    const items = Object.keys(props.data ?? []).map(key => ({ key, value: props.data[key] as string }))

    const addEntry = async (key: string, value: string) => {
        const body: { [k: string]: unknown } = {}
        body[key] = value
        try {
            const resp = await licensify.put(`/api/licenses/${props.id}`, body)
            if (resp.status !== 200) {
                toast("Failed to add entry " + key)
                return
            }

            toast("Successfully added entry " + key)
            if (props.mutatePath) {
                mutate(props.mutatePath)
            }
        } catch (e) {
            toast("Failed to delete entry " + key)
            console.log(e)
        }
    }

    const deleteEntry = async (key: string) => {
        const body: { [k: string]: unknown } = {}
        body[key] = ""
        try {
            const resp = await licensify.put(`/api/licenses/${props.id}`, body)
            if (resp.status !== 200) {
                toast("Failed to delete entry " + key)
                return
            }

            toast("Successfully deleted entry " + key)
            if (props.mutatePath) {
                mutate(props.mutatePath)
            }
        } catch (e) {
            toast("Failed to delete entry " + key)
            console.log(e)
        }

    }


    return <KeyValueEditor data={items} onAdd={addEntry} onDelete={deleteEntry} />
}
