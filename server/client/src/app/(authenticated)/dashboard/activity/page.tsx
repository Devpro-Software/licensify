import { LicenseOverviewValidationBarChart } from "@/components/license-overview-validation-chart"
import { ValidationActivityChart } from "@/components/validation-activity-chart"
import { ValidationTable } from "@/components/validation-table"

type Props = {}

export default function Page({ }: Props) {
    return (
        <div>
            <div className="mb-5">
                <h4 className="text-4xl font-bold">Activity</h4>
                <h4 className="text-md text-muted-foreground mt-2">See Activity across all your licenses.</h4>
            </div>
            <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 2xl:col-span-1">
                    <ValidationActivityChart />
                </div>
                <div className="col-span-2 2xl:col-span-1">
                    <LicenseOverviewValidationBarChart />
                </div>
                <div className="col-span-2">
                    <ValidationTable />
                </div>
            </div>
        </div>
    )
}
