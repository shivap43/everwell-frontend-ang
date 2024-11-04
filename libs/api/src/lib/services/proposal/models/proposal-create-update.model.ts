import { ProposalStatus } from "@empowered/constants";

export interface ProposalCreateUpdate {
    name: string;
    coverageStartDate: string | Date;
    eligibleEmployeeEstimate: number;
    payrollFrequencyId: number;
    status?: ProposalStatus;
}
