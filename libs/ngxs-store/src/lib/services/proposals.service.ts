import { HttpResponse } from "@angular/common/http";
import { GetProposalProductChoices, SaveProposalProductChoices } from "./../proposal/proposal-product-choice.action";
import { ProposalEmail, ProposalCreateUpdate, ProposalProductChoice, ProposalService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { GetProposals } from "./../proposal/proposal.action";
import { tap } from "rxjs/operators";
import { Observable, BehaviorSubject } from "rxjs";
@Injectable({ providedIn: "root" })
export class ProposalsService {
    showSpinnerOnCompleteSubject$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private readonly productsLoaded$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    onProductsLoad: Observable<boolean> = this.productsLoaded$.asObservable();
    constructor(private readonly store: Store, private readonly proposalService: ProposalService) {}

    getProposals(): void {
        this.store.dispatch(new GetProposals());
    }

    createProposal(proposalCreate: ProposalCreateUpdate): Observable<string> {
        return this.proposalService.createProposal(proposalCreate).pipe(
            tap(() => {
                this.store.dispatch(new GetProposals());
            }),
        );
    }

    updateProposal(proposalId: number, proposalUpdate: ProposalCreateUpdate): Observable<HttpResponse<unknown>> {
        return this.proposalService.updateProposal(proposalId, proposalUpdate).pipe(
            tap(() => {
                this.store.dispatch(new GetProposals());
            }),
        );
    }

    deleteProposal(proposalId: number): Observable<HttpResponse<unknown>> {
        return this.proposalService.deleteProposal(proposalId).pipe(
            tap(() => {
                this.store.dispatch(new GetProposals());
            }),
        );
    }
    /**
     * function to download proposal
     * @param proposalId: number
     * @param state: string
     * @param proposalType: type of proposal
     * @param zip: string
     * @return Observable<HttpResponse<BlobPart>> - downloaded proposal
     */
    downloadProposal(
        proposalId: number,
        state: string,
        proposalType: "FULL" | "RATES_ONLY",
        zip?: string,
    ): Observable<HttpResponse<BlobPart>> {
        return this.proposalService.downloadProposal(proposalId, state, proposalType, zip ? zip : undefined).pipe(
            tap((response) => {
                const header = response.headers.get("content-disposition");
                const blob = new Blob([response.body], {
                    type: "application/pdf",
                });

                /*
                source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                Typescript won't know this is a thing, so we have to use Type Assertion
                */
                if ((window.navigator as any).msSaveOrOpenBlob) {
                    (window.navigator as any).msSaveOrOpenBlob(blob);
                } else {
                    const anchor = document.createElement("a");
                    anchor.download = header.substr(header.indexOf("=") + 1);
                    const fileURLBlob = URL.createObjectURL(blob);
                    anchor.href = fileURLBlob;
                    document.body.appendChild(anchor);
                    anchor.click();
                }
            }),
        );
    }

    emailProposal(proposalId: number, proposalEmail: ProposalEmail): Observable<HttpResponse<unknown>> {
        return this.proposalService.emailProposal(proposalId, proposalEmail);
    }

    getProposalProductChoices(proposalId: number): void {
        this.store.dispatch(new GetProposalProductChoices(proposalId));
    }

    saveProposalProductChoices(proposalId: number, proposalProductChoices: ProposalProductChoice[]): void {
        this.store.dispatch(new SaveProposalProductChoices(proposalId, proposalProductChoices));
    }

    /**
     * Update the spinner once stepper components  gets closed by completing the proposal
     * @param showSpinner param for closing or opening the loader
     */
    showSpinnerOnComplete(showSpinner: boolean): void {
        this.showSpinnerOnCompleteSubject$.next(showSpinner);
    }
    /**
     * used to update loading status of products component on resume
     * @param type indicates whether products screen is loaded or not
     */
    productsLoaded(type: boolean): void {
        this.productsLoaded$.next(type);
    }
}
