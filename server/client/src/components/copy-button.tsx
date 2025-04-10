import { useState } from "react"
import { Button } from "./ui/button"
import { Clipboard, ClipboardCheck } from "lucide-react"


export function CopyButton({ content, ...props }: { content: string, ghost?: boolean }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(content).then(() => setCopied(true))
        setTimeout(() => setCopied(false), 3000)
    }

    return (
        <Button onClick={handleCopy} size={"icon"} variant={props.ghost ? "ghost" : "outline"}>
            {!copied && <Clipboard />}
            {copied && <ClipboardCheck />}
        </Button>
    )
}
