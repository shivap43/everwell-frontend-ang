import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class AflacAlwaysHelperService {
    private loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    // Behavior subject to throw error when no policy has been selected
    policySelected$ = new BehaviorSubject(true);
    // Behavior subject to trigger submit
    saveAndSubmit$ = new BehaviorSubject(false);
    // Behavior subject to throw error when no policy has been found
    noPoliciesFound$ = new BehaviorSubject(false);
    // Behavior subject to change enroll status
    aflacAlwaysEnrolled$ = new BehaviorSubject(null);

    hasClickedNext$ = new BehaviorSubject(false);

    /**
     * Returns loading$ as an Observable
     * @returns Observable<boolean>
     */
    isLoading$(): Observable<boolean> {
        return this.loading$.asObservable();
    }

    /**
     * Sets value of loading$ to true
     */
    setLoading(isLoading: boolean): void {
        this.loading$.next(isLoading);
    }
}
