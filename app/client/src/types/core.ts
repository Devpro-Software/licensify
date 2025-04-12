
export type License = {
    id: string
    createdAt: string
    updatedAt: string
    active: boolean
    name: string
    data: {
        [key: string]: unknown
    }
}

export type Signature = {
    sig: string
    license: {
        [k: string]: unknown
    }
}

export type Tracker = {
    id: string
    createdAt: string
    updatedAt: string
    name: string
    license: License
    activatedDate?: string
    enabled: boolean
    expiration?: string
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
    signature?: string
    tracker?: Tracker
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

export type KeyPair = {
    publicKey: string
}
