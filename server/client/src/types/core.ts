
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
    succeeded: boolean
    error?: string
    userAgent: string
    ip: string
    license?: License
}
