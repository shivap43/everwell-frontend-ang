import { Termination } from "./termination.model";

export interface Work {
    occupation: string;
    occupationDescription: string;
    hireDate?: Date;
    organizationId?: 0;
    payrollFrequencyId?: 0;
    termination?: Termination;
}
