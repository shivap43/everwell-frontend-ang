export interface ProposalEmail {
    /**
     * @description: minItems: 1
     */
    adminIds: number[];
    state: string;
    zip?: string;
    proposalType?: ProposalType;
    message?: string;
}

export type ProposalType = "FULL" | "RATES_ONLY";
