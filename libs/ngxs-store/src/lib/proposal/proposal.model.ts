import { Proposal } from "@empowered/api";
import { PayFrequency } from "@empowered/constants";

export interface ProposalStateModel {
    proposals: Proposal[];
    planIds: number[];
    deductionFrequencies: PayFrequency[];
    selectedDeductionFrequencyId: number;
}
