import { BadgePlus, Trash } from "lucide-react"
import { ReactNode, useRef, useState } from "react"
import Loader from "./loader"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ScrollArea, ScrollBar } from "./ui/scroll-area"
import { Separator } from "./ui/separator"

type Props = {
    data: KeyValueItem[]
    onAdd: (k: string, v: string) => void
    onDelete: (k: string) => void
}

export type KeyValueItem = {
    key: string
    value: string
}

export default function KeyValueEditor({ data, onAdd, onDelete }: Props) {

    return (
        <div className="h-full">
            <EntryInput initialKey="" initialValue="" onClick={(k, v) => onAdd(k, v)} btn={
                <>
                    <div>Add new entry</div>
                    <BadgePlus />
                </>
            } />
            {data.length > 0 && <Separator className="my-4" />}
            <ScrollArea>
                <div className="max-h-96">
                    {data.map(item => {
                        return (
                            <div key={item.key} className="my-3">
                                <EntryInput disabled initialKey={item.key} initialValue={item.value} onClick={(k, _) => onDelete(k)} btn={<Trash />} />
                            </div>
                        )
                    })}
                </div>
                <ScrollBar orientation="vertical" />
            </ScrollArea>
        </div>
    )
}

function EntryInput(props: { initialKey: string, initialValue: string, onClick: (key: string, value: string) => void | Promise<void>, btn: ReactNode, disabled?: boolean }) {
    const [newItem, setNewItem] = useState<KeyValueItem>({
        key: props.initialKey,
        value: props.initialValue
    })

    const [loading, setLoading] = useState(false)

    const ref = useRef<HTMLInputElement>(null)

    const done = async () => {
        if (!newItem.key || !newItem.value) {
            return
        }
        setLoading(true)
        await props.onClick(newItem.key, newItem.value)
        setNewItem({ key: "", value: "" })
        setLoading(false)
        ref.current?.focus()

    }

    return (
        <div className="flex items-center">
            <Input ref={ref} disabled={props.disabled} placeholder="key" value={newItem.key} onChange={e => setNewItem({
                ...newItem,
                key: e.target.value
            })} />
            <div className="h-1 w-12 bg-muted"></div>
            <Input onKeyDownCapture={async (e) => {
                if (e.key === "Enter") {
                    done()
                }
            }} disabled={props.disabled} placeholder="value" value={newItem.value} onChange={e => setNewItem({
                ...newItem,
                value: e.target.value
            })} />
            <div className="h-1 w-12 bg-muted"></div>
            <Button disabled={loading} onClick={done} variant={"outline"} size={"default"}>
                {loading && <Loader />}
                {!loading && <>
                    {props.btn}
                </>}
            </Button>
        </div>
    )
}
