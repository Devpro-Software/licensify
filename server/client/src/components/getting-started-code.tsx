"use client"

import { useState } from "react"
import CodeBlock from "./code-block"
import { CopyButton } from "./copy-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Props = {}

const code = {
    "go": `
sig, err := licensify.LoadSignature("/path/to/license.json")
if err != nil {
    return err
}

b, err := json.Marshal(&sig)
if err != nil {
    return err
}

resp, err := http.Post("https://your-licensify-server.com/api/validate", "application/json", bytes.NewBuffer(b))
if err != nil {
    return err
}

if resp.StatusCode != http.StatusOK {
    return fmt.Errorf("invalid signature")
}
`,
    "py": `
with open("/path/to/license.json") as f:
    sig = json.load(f)

resp = requests.post("https://your-licensify-server.com/api/validate", 
                     json=sig, 
                     headers={"Content-Type": "application/json"})

if resp.status_code != 200:
    raise ValueError("Invalid signature")
`,
    "js": `
const sig = JSON.parse(fs.readFileSync("/path/to/license.json", "utf-8"));

const resp = await fetch("https://your-licensify-server.com/api/validate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(sig),
});

if (!resp.ok) {
  throw new Error("Invalid signature");
}
`
}


export default function GettingStartedCode({ }: Props) {
    const [cur, setCur] = useState<string>(code["go"])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Add validation code</CardTitle>
                <CardDescription>
                    Add the snippet of code to your client application and run on start or periodically.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs onValueChange={(tab) => setCur(code[tab as keyof typeof code])} defaultValue="go">
                    <div className="flex justify-between w-full">
                        <TabsList>
                            <TabsTrigger value="go">go</TabsTrigger>
                            <TabsTrigger value="py">py</TabsTrigger>
                            <TabsTrigger value="js">js</TabsTrigger>
                        </TabsList>
                        <CopyButton content={cur} />
                    </div>
                    <TabsContent value="go">
                        <CodeBlock code={code["go"]} lang="go" />
                    </TabsContent>
                    <TabsContent value="py">
                        <CodeBlock code={code["py"]} lang="python" />
                    </TabsContent>
                    <TabsContent value="js">
                        <CodeBlock code={code["js"]} lang="javascript" />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
