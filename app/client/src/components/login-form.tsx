"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { licensify } from "@/configuraton/axios"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { mutate } from "swr"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { useSession } from "./auth-provider"


// TODO: put back to 6
const formSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password must be at least 6 characters"),
});

export function LoginForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: ""
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const resp = await licensify.post("/auth/login", {
                username: values.username,
                password: values.password
            })

            if (resp.status !== 200) {
                toast("Login failed.")
                return
            }

            toast("Login successful.")
            mutate("/api/session")
            window.location.href = "/dashboard"
        } catch (e) {
            toast("Login failed.")
        }

    }

    return (
        <div className={cn("flex flex-col gap-6")} >
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your username and password below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Username</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="James123" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Your platform username.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Password
                                                    <a
                                                        href="#"
                                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                                    >
                                                        Forgot your password?
                                                    </a>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="password" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Your platform password.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Login
                                </Button>
                            </div>
                            <div className="mt-4 text-center text-sm">
                                Don&apos;t have an account?{" "}
                                <a href="/register" className="underline underline-offset-4">
                                    Sign up
                                </a>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

