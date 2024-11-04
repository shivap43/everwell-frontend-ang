import { BehaviorSubject, Observable } from "rxjs";
import { State, Store, StateContext, Action, Selector } from "@ngxs/store";
import { ProposalService, ProposalProductChoice } from "@empowered/api";
import { tap } from "rxjs/operators";
import { GetProposalProductChoices, SaveProposalProductChoices, ResetProposalProductChoices } from "./proposal-product-choice.action";
import { ResetState } from "@empowered/user/state/actions";
import { HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";

@State<ProposalProductChoice[]>({
    name: "proposalProductChoices",
    defaults: null,
})
@Injectable()
export class ProposalProductChoiceState {
    private getCompleted$ = new BehaviorSubject<boolean>(false);

    constructor(private proposalService: ProposalService, private store: Store) {}

    @Selector()
    static proposalProductChoices(state: ProposalProductChoice[]): ProposalProductChoice[] {
        return state;
    }

    @Action(ResetState)
    resetGlobalState(context: StateContext<ProposalProductChoice[]>): void {
        this.store.dispatch(new ResetProposalProductChoices());
    }

    @Action(ResetProposalProductChoices)
    resetState(context: StateContext<ProposalProductChoice[]>): void {
        context.setState(null);
    }

    @Action(GetProposalProductChoices)
    getProposalProductChoices(
        ctx: StateContext<ProposalProductChoice[]>,
        action: GetProposalProductChoices,
    ): Observable<ProposalProductChoice[]> {
        return this.proposalService.getProposalProductChoices(action.proposalId).pipe(
            tap((proposalProductChoices) => {
                ctx.setState(proposalProductChoices);
                this.getCompleted$.next(true);
            }),
        );
    }

    @Action(SaveProposalProductChoices)
    saveProposalProductChoices(
        ctx: StateContext<ProposalProductChoice[]>,
        action: SaveProposalProductChoices,
    ): Observable<HttpResponse<unknown>> {
        return this.proposalService.saveProposalProductChoices(action.proposalId, action.proposalProductChoices).pipe(
            tap(() => {
                this.store.dispatch(new GetProposalProductChoices(action.proposalId));
            }),
        );
    }
}
