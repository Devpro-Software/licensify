"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "./ui/switch"
import { licensify } from "@/configuraton/axios"
import { mutate } from "swr"
import { toast } from "sonner"
import { License } from "@/types/core"

const formSchema = z.object({
    name: z.string(),
    active: z.boolean().default(false)
})

type Props = {
    onSubmit?: () => void
}

export function LicenseForm(props: Props) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            active: false
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const resp = await licensify.post("/api/licenses", {
                name: values.name,
                data: {},
                active: values.active
            })
            const newLicense = resp.data as License
            mutate("/api/licenses")
            toast("Successfully created license " + newLicense.name)
            if (props.onSubmit) {
                props.onSubmit()
            }
        } catch (e) {
            toast("Unable to create license")
        }

    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>License Name</FormLabel>
                            <FormControl>
                                <Input placeholder="My Software License" {...field} />
                            </FormControl>
                            <FormDescription>
                                This is the name of your license.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Activated</FormLabel>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormDescription>
                                Whether this license is active, you can change this later
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    )
}

