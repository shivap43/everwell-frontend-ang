import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { BenefitsOfferingService, CarrierFormResponse } from "@empowered/api";
import { of, Subject } from "rxjs";
import { Store } from "@ngxs/store";
import { AccountListState } from "@empowered/ngxs-store";
import { catchError, takeUntil } from "rxjs/operators";
import { ConfirmQ60Data } from "@empowered/api";
import { ConfirmQ60Constants } from "@empowered/constants";

@Component({
    selector: "empowered-confirm-q60-popup",
    templateUrl: "./confirm-q60-popup.component.html",
    styleUrls: ["./confirm-q60-popup.component.scss"],
})
export class ConfirmQ60PopupComponent implements OnInit {
    mpGroup: number;
    isLoading: boolean;
    eligibleEmployees: string;
    ridersSelected: string[] = [];
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly dialogRef: MatDialogRef<ConfirmQ60PopupComponent>,
        private readonly store: Store,
        @Inject(MAT_DIALOG_DATA) private readonly data: ConfirmQ60Data,
        private readonly benefitsOfferingService: BenefitsOfferingService,
    ) {}

    ngOnInit(): void {
        this.isLoading = true;
        this.mpGroup = this.store.selectSnapshot(AccountListState.getMpGroupId);

        this.benefitsOfferingService
            .getCarrierFormResponses(this.mpGroup, this.data.carrierId)
            .pipe(
                catchError((error) => of([])),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((carrierFormResponses: CarrierFormResponse[]) => {
                this.eligibleEmployees = carrierFormResponses.find(
                    (response) => response.questionName === ConfirmQ60Constants.ELIGIBLE_EMPLOYEE_TEXT,
                ).response;
                carrierFormResponses.forEach((rider) => {
                    if (rider.questionName === ConfirmQ60Constants.WHOLE_LIFE_RIDERS) {
                        this.ridersSelected.push(rider.response + ConfirmQ60Constants.WHOLE_LIFE_TEXT);
                    }
                    if (rider.questionName === ConfirmQ60Constants.TERM_LIFE_RIDERS) {
                        this.ridersSelected.push(rider.response + ConfirmQ60Constants.TERM_LIFE_TEXT);
                    }
                });
                this.isLoading = false;
            });
    }

    /**
     * Close dialog box and submit offering
     */
    goTo(): void {
        this.dialogRef.close("SUBMIT_OFFERING");
    }

    /**
     * Close dialog on click of cancel
     */
    onCancelClick(): void {
        this.dialogRef.close();
    }
}
