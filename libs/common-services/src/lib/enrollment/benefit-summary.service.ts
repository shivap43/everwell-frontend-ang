import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class BenefitSummaryService {
    private readonly submitEndCoverage$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private readonly submittingEndCoverage$: Observable<boolean> = this.submitEndCoverage$.asObservable();

    /**
     * This method will execute to set variable for end coverage link
     * @param submittingEndCoverage: boolean, will represent whether user clicked on the end coverage link
     */
    setEndCoverageFlag(submittingEndCoverage: boolean): void {
        this.submitEndCoverage$.next(submittingEndCoverage);
    }

    /**
     * function to get submittingEndCoverage value for end coverage link
     * @returns submittingEndCoverage$: Observable<boolean>, will represent whether user clicked on the
     * End coverage link
     */
    getEndCoverageFlag(): Observable<boolean> {
        return this.submittingEndCoverage$;
    }
}
