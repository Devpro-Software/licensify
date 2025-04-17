"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"

export default function ToggleExample(props) {
    const [visible, setVisible] = useState(false)

    return (
        <div className="my-4">
            <button
                onClick={() => setVisible(!visible)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
            >
                {visible ?
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <ChevronDown />
                        {props.textShown ?? "Hide"}
                    </div>
                    :
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <ChevronRight />
                        {props.textHidden ?? "Show"}
                    </div>

                }
            </button>

            {visible && (
                <div className="mt-2 p-4 border rounded bg-gray-50">
                    {props.children}
                </div>
            )}
        </div>
    )
}

