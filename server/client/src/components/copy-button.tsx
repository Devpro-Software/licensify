import { useState } from "react"
import { Button } from "./ui/button"
import { Clipboard, ClipboardCheck } from "lucide-react"

type Props = {}

export default function CopyBlock({ }: Props) {
    return (
        <div>CopyBlock</div>
    )
}

export function CopyButton({ content }: { content: string }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(content).then(() => setCopied(true))
        setTimeout(() => setCopied(false), 3000)
    }

    return (
        <Button onClick={handleCopy} size={"icon"} variant={"outline"}>
            {!copied && <Clipboard />}
            {copied && <ClipboardCheck />}
        </Button>
    )
}
