import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { RoutingNumberModel } from "@empowered/constants";
@Injectable({
    providedIn: "root",
})
export class ReviewFlowService {
    stepChanged$ = new Subject<string>();
    updateMemberId$ = new Subject<number>();
    reviewCompleted$ = new Subject<boolean>();
    paymentDetails: RoutingNumberModel[] = [];

    constructor() {}

    setPaymentInfo(payment: RoutingNumberModel[]): void {
        this.paymentDetails = payment;
    }
}

export enum StepTitle {
    VERIFY_USER = "VERIFYUSER",
    REVIEW_SIGN = "REVIEWSIGN",
    PDA = "PDA",
    CONFIRMATION = "CONFIRMATION",
}
