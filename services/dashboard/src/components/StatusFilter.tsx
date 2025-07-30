import { DeploymentStatus } from "@/api/client";

interface StatusFilterProps {
    value: string 
    onChange: (value: string) => void 
}

export default function StatusFilter({value, onChange}:StatusFilterProps) {
    const statuses = [
        { value: '', label: 'All Statuses'},
        { value: DeploymentStatus.PENDING, label: 'Pending'},
        { value: DeploymentStatus.DEPLOYING, label: 'Deploying'},
        { value: DeploymentStatus.DEPLOYED, label: 'Deployed'},
        { value: DeploymentStatus.FAILED, label: 'Failed'},
        { value: DeploymentStatus.TERMINATING, label: 'Terminating'},
        { value: DeploymentStatus.TERMINATED, label: 'Terminated'},
    ]

    return (
        <select 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
        >
            {statuses.map((status)=> (
                <option key={status.value} value={status.value}>
                    {status.label}
                </option>
            ))}
        </select>
    )
}