
export type License = {
    id: string
    createdAt: string
    updatedAt: string
    active: boolean
    product: string
    data: unknown
}

export type Signature = {
    sig: string
    license: {
        product: string
        "license-id": string
    }
}

export type Validation = {
    id: string
    createdAt: string
    updatedAt: string
    status: string
    error?: string
    userAgent: string
    ip: string
    license?: License
}

export type User = {
    id: string
    createdAt: string
    updatedAt: string
    username: string
    firstName: string
    lastName: string
    role: string
}

export type Session = {
    id: string
    createdAt: string
    updatedAt: string
    user: User
    expires: string
}
