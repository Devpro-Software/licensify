import { cn } from "@/lib/utils"
import { BadgeCheck, CloudUploadIcon } from "lucide-react"
import { useRef } from "react"

type Props = {
    file: File | null
    setFile: (f: File) => void
    title: string
}

const DropFileInput = ({ file, setFile, title }: Props) => {
    const ref = useRef<HTMLInputElement>(null)

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const droppedFiles = e.dataTransfer.files
        if (droppedFiles && droppedFiles.length > 0) {
            setFile(droppedFiles[0])
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => ref.current?.click()}
            className={cn("flex justify-center items-center border-2 border-dashed border-muted-foreground p-8 rounded-lg hover:bg-accent", file && "border-green-800")}
        >
            {file ? (
                <div className="flex flex-col items-center text-green-800">
                    <BadgeCheck />
                </div>
            ) : (
                <div className="text-center flex flex-col justify-center items-center text-gray-600">
                    <CloudUploadIcon className="h-6 w-6 mb-2" />
                    <p>{title}</p>
                    <input hidden type="file" ref={ref} onChange={e => {
                        const selectedFile = e.target.files?.[0]
                        if (selectedFile) {
                            setFile(selectedFile)
                        }
                    }} />
                </div>
            )}
        </div>
    )
}

export default DropFileInput;

