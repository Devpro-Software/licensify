"use client"

import { licensify } from "@/configuraton/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";
import { useSession } from "./auth-provider";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";

type Props = {}

const formSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional()
});

export default function ProfileCard({ }: Props) {
    const { session, logout } = useSession()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
        },
    })

    useEffect(() => {
        if (session) {
            form.setValue("firstName", session.user.firstName)
            form.setValue("lastName", session.user.lastName)
        }
    }, [session])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const resp = await licensify.put("/api/profile", {
                firstName: values.firstName,
                lastName: values.lastName
            })
            if (resp.status !== 200) {
                toast("Failed to update profile")
                return
            }

            toast("Successfully updated profile")
            mutate("/api/session")
        } catch (e) {
            toast("Failed to update profile")
        }

    }

    if (!session) {
        return
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Profile</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Last Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="text" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-full flex justify-between">
                                <Button type="submit" className="w-28">
                                    Save
                                </Button>
                                <Button onClick={async () => {
                                    await logout()
                                    window.location.href = "/login"
                                }} variant={"destructive"} type="button" className="w-28">
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
