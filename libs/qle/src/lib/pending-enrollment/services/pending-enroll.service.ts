import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class PendingEnrollService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public nextChange$ = new Subject<boolean>();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public staticStepDone$ = new Subject<any>();
    constructor() {}
}
