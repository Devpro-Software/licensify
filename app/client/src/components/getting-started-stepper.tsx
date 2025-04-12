"use client"

import { Button } from "@/components/ui/button";
import { License } from "@/types/core";
import { motion } from "framer-motion";
import { ReactNode, useState } from "react";
import GettingStartedCode from "./getting-started-code";
import GettingStartedNextSteps from "./getting-started-next-steps";
import { SignatureBuilder } from "./signature-builder";


type Props = {
    license: License
}

export default function GettingStartedStepper(props: Props) {
    const [step, setStep] = useState(0)

    const steps: ReactNode[] = [
        <div>
            <SignatureBuilder mutatePath={`/api/licenses/${props.license.id}/trackers`} licenseId={props.license.id} title="Build a license signature" description="Store this near your client code and use it for validation. Add an optional tracker which has server side features." />
        </div>,
        <div>
            <GettingStartedCode />
        </div>,
        <div>
            <GettingStartedNextSteps done={() => setStep(0)} />
        </div>,
    ]

    const nextStep = () => {
        if (step < steps.length - 1) setStep(step + 1)
    }

    const prevStep = () => {
        if (step > 0) setStep(step - 1)
    }

    return (
        <div>
            <div className="flex items-center justify-center gap-2 mb-6 relative">
                <Button className="mr-10" onClick={prevStep} disabled={step === 0} variant="outline">
                    Back
                </Button>
                {steps.map((_, index) => (
                    <div className="text-center" key={index} >
                        <div className="flex items-center">
                            {index > 0 && (
                                <motion.div
                                    className="h-1 w-10 bg-gray-300"
                                    animate={{ backgroundColor: step >= index ? "#3b82f6" : "#d1d5db", width: step >= index ? "2.5rem" : "2rem" }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                            <motion.div
                                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${step >= index ? "bg-blue-500 text-white" : "border-gray-300 text-gray-500"}`}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: step === index ? 1.2 : 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {index + 1}
                            </motion.div>
                        </div>
                    </div>
                ))}
                <Button className="ml-10" onClick={nextStep} disabled={step === steps.length - 1}>
                    {step === steps.length - 1 ? "Done" : "Next"}
                </Button>
            </div>
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
            >
                <div className="p-4 flex justify-center">
                    {steps[step]}
                </div>
            </motion.div>
        </div>
    )
}
