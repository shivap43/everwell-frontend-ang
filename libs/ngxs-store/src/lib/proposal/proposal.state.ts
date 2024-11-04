import { State, Store, StateContext, Action, Selector } from "@ngxs/store";
import { AccountService, Proposal, ProposalService, StaticService } from "@empowered/api";
import { ConfigName, PayFrequency } from "@empowered/constants";
import { Observable } from "rxjs";
import { GetProposals, ResetProposal, SetDeductionFrequencies } from "./proposal.action";
import { ResetState } from "@empowered/user/state/actions";
import { take, tap, map, switchMap } from "rxjs/operators";
import { Injectable } from "@angular/core";
import { ProposalStateModel } from "./proposal.model";

const ZERO = 0;
@State<ProposalStateModel[]>({
    name: "proposals",
    defaults: [],
})
@Injectable()
export class ProposalsState {
    constructor(
        private readonly proposalService: ProposalService,
        private readonly store: Store,
        private readonly accountService: AccountService,
        private readonly staticService: StaticService,
    ) {}

    /**
     * Selector to get proposals store in state
     * @param state variable of ProposalStateModel
     * @returns Array of proposals
     */
    @Selector()
    static proposals(state: ProposalStateModel): Proposal[] {
        return state.proposals;
    }

    /**
     * Selector to get selectedDeductionFrequencyId store in state
     * @param state variable of ProposalStateModel
     * @returns selectedDeductionFrequencyId of selected deduction frequency
     */
    @Selector()
    static getSelectedDeductionFrequencyId(state: ProposalStateModel): number {
        return state.selectedDeductionFrequencyId;
    }

    /**
     * Selector to get deduction frequencies store in state
     * @param state variable of ProposalStateModel
     * @returns Array of deduction frequency
     */
    @Selector()
    static getDeductionFrequencies(state: ProposalStateModel): PayFrequency[] {
        return state.deductionFrequencies;
    }

    /**
     * Action to reset ProposalState
     * @param context state context of ProposalStateModel
     */
    @Action(ResetState)
    resetGlobalState(context: StateContext<ProposalStateModel>): void {
        this.store.dispatch(new ResetProposal());
    }

    /**
     * Action to reset ProposalState
     * @param context state context of ProposalStateModel
     */
    @Action(ResetProposal)
    resetState(context: StateContext<ProposalStateModel[]>): void {
        context.setState([]);
    }

    /**
     * Action to get proposals from api response and to store it in state
     * @param ctx state context of ProposalStateModel
     * @returns Array of proposals
     */
    @Action(GetProposals)
    getProposals(ctx: StateContext<ProposalStateModel>): Observable<Proposal[]> {
        return this.proposalService.getProposals().pipe(
            take(1),
            tap((proposals) => ctx.patchState({ proposals })),
        );
    }

    /**
     * Set Deduction frequencies in store.
     * @param context state context of ProposalStateModel
     * @returns Array of deduction frequency
     */
    @Action(SetDeductionFrequencies)
    setDeductionFrequencies(ctx: StateContext<ProposalStateModel>): Observable<PayFrequency[]> {
        return this.accountService.getPayFrequencies().pipe(
            take(1),
            switchMap((deductionFrequencies) =>
                this.staticService
                    .getConfigurations(ConfigName.PROPOSAL_PAYROLL_FREQUENCIES)
                    .pipe(map((configValue) => ({ deductionFrequencies, configValue }))),
            ),
            map((proposalPayFrequencies) => {
                const eligiblePayFrequencies = proposalPayFrequencies?.configValue[ZERO]?.value.split(",");
                // Include only eligible pay frequencies listed in the config if config is empty then display all frequencies
                const payFrequencies = eligiblePayFrequencies?.length
                    ? proposalPayFrequencies?.deductionFrequencies.filter((freq) => eligiblePayFrequencies.includes(freq.frequencyType))
                    : proposalPayFrequencies?.deductionFrequencies;
                ctx.patchState({ deductionFrequencies: payFrequencies });
                return payFrequencies;
            }),
        );
    }
}
