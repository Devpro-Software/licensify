import SyntaxHighlighter from "react-syntax-highlighter"
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs"
import { ScrollArea, ScrollBar } from "./ui/scroll-area"

type Props = {
    code: string
    lang: string
}

export default function CodeBlock({ code, lang }: Props) {
    return (
        <div className="w-sm md:w-md 2xl:w-lg">
            <ScrollArea className="w-full h-full">
                <SyntaxHighlighter customStyle={{
                }} lineNumberStyle={{
                    color: "gray",
                }} showLineNumbers language={lang} style={vs2015}>
                    {code}
                </SyntaxHighlighter>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
