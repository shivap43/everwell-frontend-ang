import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
@Injectable({
    providedIn: "root",
})
export class ReviewFlowService {
    stepChanged$ = new Subject<string>();
    updateMemberId$ = new BehaviorSubject<number>(null);
    mpGroup$ = new BehaviorSubject<number>(null);
    constructor() {}
}

export enum StepTitle {
    VERIFY_USER = "VERIFYUSER",
    ENROLLMENT_SUMMARY = "ENROLLMENTSUMMARY",
}
