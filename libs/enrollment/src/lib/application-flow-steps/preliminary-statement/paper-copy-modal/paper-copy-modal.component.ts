import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { NGRXStore } from "@empowered/ngrx-store";
import { EnrollmentsActions, EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { select } from "@ngrx/store";
import { Subject } from "rxjs";
import { tap, switchMap, takeUntil } from "rxjs/operators";
import { PaperCopyModel } from "../../models/paper-copy.model";

const PDF_SETTINGS = "#toolbar=0&zoom=115";

@Component({
    selector: "empowered-paper-copy-modal",
    templateUrl: "./paper-copy-modal.component.html",
    styleUrls: ["./paper-copy-modal.component.scss"],
})
export class PaperCopyModalComponent implements OnInit, OnDestroy {
    formIndex = 0;
    isSpinnerLoading = false;
    unsubscribe$ = new Subject<void>();
    safeUrl: SafeResourceUrl;
    unsignedFileURL: string;
    unsignedFileURLs: string[] = [];
    preliminaryStatementAcknowledgement = new FormControl();

    constructor(
        private readonly dialogRef: MatDialogRef<PaperCopyModalComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: PaperCopyModel,
        private readonly ngrxStore: NGRXStore,
        private readonly sanitizer: DomSanitizer,
    ) {}

    /**
     * initializes the component
     */
    ngOnInit(): void {
        this.downloadPreliminaryForm();
    }

    /**
     * Downloads preliminary form by making downloadPreliminaryForm api call
     */
    downloadPreliminaryForm(): void {
        this.data.memberId$
            .pipe(
                tap((memberId) => {
                    this.isSpinnerLoading = true;
                    // downloadPreliminaryForm api is called
                    this.ngrxStore.dispatch(
                        EnrollmentsActions.downloadPreliminaryForm({
                            memberId: memberId,
                            preliminaryFormPath: this.data.preliminaryFormPaths[this.formIndex],
                            cartItemId: this.data.cartIds[this.formIndex],
                            mpGroupId: this.data.mpGroupId,
                        }),
                    );
                }),
                switchMap((memberId) =>
                    // gets the downloadPreliminaryForm api response from the store
                    this.ngrxStore.onAsyncValue(
                        select(
                            EnrollmentsSelectors.getDownloadPreliminaryFormResponse(
                                memberId,
                                this.data.preliminaryFormPaths[this.formIndex],
                                this.data.cartIds[this.formIndex],
                                this.data.mpGroupId,
                            ),
                        ),
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((response) => {
                this.unsignedFileURL = response;
                // PDF_SETTINGS hides the toolbar visible in paper copy modal and zoom makes pdf fit in iframe
                this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response + PDF_SETTINGS);
                this.unsignedFileURLs.push(this.unsignedFileURL);
                this.isSpinnerLoading = false;
            });
    }

    /**
     * executes on click of print button in paper copy modal and opens the preliminary form pdf in new window
     */
    onPrint(): void {
        window.open(this.unsignedFileURL);
    }

    /**
     * executes on click of next button in paper copy modal to view next form
     */
    onNext(): void {
        if (this.preliminaryStatementAcknowledgement.value) {
            this.preliminaryStatementAcknowledgement.reset();
            this.formIndex++;
            this.downloadPreliminaryForm();
        } else {
            this.preliminaryStatementAcknowledgement.setErrors({ required: true });
            this.preliminaryStatementAcknowledgement.markAsTouched();
        }
    }

    /**
     * executes on click of back button in paper copy modal to view previous form
     */
    onBack(): void {
        this.preliminaryStatementAcknowledgement.setValue(true);
        this.formIndex--;
        this.unsignedFileURL = this.unsignedFileURLs[this.formIndex];
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.unsignedFileURL);
    }

    /**
     * executes on click of continue button in paper copy modal
     */
    onContinue(): void {
        if (this.preliminaryStatementAcknowledgement.value) {
            this.dialogRef.close({ routeToAppFlow: true });
        } else {
            this.preliminaryStatementAcknowledgement.setErrors({ required: true });
            this.preliminaryStatementAcknowledgement.markAsTouched();
        }
    }

    /**
     * unsubscribes all subscriptions on destroy
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
