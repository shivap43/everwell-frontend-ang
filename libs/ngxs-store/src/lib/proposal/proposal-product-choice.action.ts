/* eslint-disable max-classes-per-file */

import { ProposalProductChoice } from "@empowered/api";

export class GetProposalProductChoices {
    static readonly type = "[ProposalsStateModel] getProposalProductChoices";
    constructor(public proposalId: number) {}
}

// eslint-disable-next-line max-classes-per-file
export class SaveProposalProductChoices {
    static readonly type = "[ProposalsStateModel] saveProposalProductChoices";
    constructor(public proposalId: number, public proposalProductChoices: ProposalProductChoice[]) {}
}

// eslint-disable-next-line max-classes-per-file
export class ResetProposalProductChoices {
    static readonly type = "[ProposalsStateModel] resetProposalProductChoices";
}
