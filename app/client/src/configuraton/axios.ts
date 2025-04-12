import axios from "axios"

export const licensify = axios.create({
    baseURL: "http://localhost:8080",
    headers: {
        "API-KEY": "331b03f9-1abe-460a-b36d-3b95507f739f"
    }
})
