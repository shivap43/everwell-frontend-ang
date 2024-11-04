import { ProposalStatus, ProducerUnit } from "@empowered/constants";

export interface Proposal {
    readonly id?: number;
    name: string;
    coverageStartDate: string | Date;
    eligibleEmployeeEstimate: number;
    payrollFrequencyId: number;
    status: ProposalStatus;
    readonly createdBy?: ProducerUnit;
}
