import { LicenseValidationBarChart } from "@/components/license-validation-chart"
import { ValidationActivityChart } from "@/components/validation-activity-chart"
import { ValidationTable } from "@/components/validation-table"

type Props = {}

export default function Page({ }: Props) {
    return (
        <div>
            <div className="mb-5">
                <h4 className="text-4xl font-bold">Activity</h4>
            </div>
            <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 2xl:col-span-1">
                    <ValidationActivityChart />
                </div>
                <div className="col-span-2 2xl:col-span-1">
                    <LicenseValidationBarChart />
                </div>
                <div className="col-span-2">
                    <ValidationTable />
                </div>
            </div>
        </div>
    )
}
