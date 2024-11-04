import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class CommissionSplitsService {
    private actionSource$: Subject<boolean> = new Subject<boolean>();
    action$ = this.actionSource$.asObservable();

    constructor() {}

    /**
     * function to set the value of the action i.e. is Commission Split replaced
     * @param action: boolean, value of the event
     * @returns void
     */
    setAction(action: boolean): void {
        this.actionSource$.next(action);
    }
}
