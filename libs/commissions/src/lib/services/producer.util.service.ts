import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
@Injectable({
    providedIn: "root",
})
export class ProducerUtilService {
    private readonly fetchRMDetailsSubject$ = new BehaviorSubject<boolean>(false);
    fetchRMDetails$ = this.fetchRMDetailsSubject$.asObservable();

    /**
     * Set the status to reset producers tab
     * @param isRefreshed boolean value to check if Reporting manager details is refreshed
     */
    updateRMDetails(isRefreshed: boolean): void {
        this.fetchRMDetailsSubject$.next(isRefreshed);
    }
}
