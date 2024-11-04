import { HttpParams } from "@angular/common/http";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MemberService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { EMPTY, interval, Observable, of, Subject, Subscription } from "rxjs";
import { catchError, first, startWith, switchMap, takeUntil, takeWhile, tap } from "rxjs/operators";

const API = "/api/auth";
const MEMBER_ID = "memberId";
const PAYLOGIX = "/initiatePaylogixSSO";
const QUESTION = "?";
const MP_GROUP = "groupId";
const EBSPAYMENTONFILE = "ebsPaymentOnFile";
const IN_PROGRESS = "IN_PROGRESS";
const COMPLETED = "COMPLETED";

export interface EBSDialogData {
    isFromNonEnrollmentFlow: boolean;
    mpGroup: string;
    memberId: number;
    ebsPaymentOnFile: string;
    fromComponentName: string;
}

@Component({
    selector: "empowered-ebs-info-modal",
    templateUrl: "./ebs-info-modal.component.html",
    styleUrls: ["./ebs-info-modal.component.scss"],
})
export class EBSInfoModalComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.ebs.modal.title",
        "primary.portal.applicationFlow.ebs.modal.content",
        "primary.portal.applicationFlow.ebs.modal.summaryContent",
        "primary.portal.applicationFlow.ebs.modal.continue",
        "primary.portal.common.cancel",
        "primary.portal.census.manualEntry.stepperBack",
        "primary.portal.common.back",
    ]);
    modalText: string;
    pollingSubscription: Subscription;
    unsubscribe$ = new Subject<void>();
    ebsPaymentOnFile = 0;
    paylogixWindow: Window;
    fromEnrollmentDetails = false;
    fromContEbs = false;
    failedEbsPaymentCallback = false;

    constructor(
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) readonly data: EBSDialogData,
        private readonly memberService: MemberService,
        private dialogRef: MatDialogRef<EBSInfoModalComponent>,
    ) {}

    /**
     * Life cycle hook to initialize component data
     */
    ngOnInit(): void {
        this.modalText =
            this.data.fromComponentName === "CoverageSummaryComponent"
                ? this.languageStrings["primary.portal.applicationFlow.ebs.modal.summaryContent"]
                : this.languageStrings["primary.portal.applicationFlow.ebs.modal.content"];
        this.ebsPaymentOnFile = this.data.ebsPaymentOnFile ? 1 : 0;
        this.fromEnrollmentDetails = this.data.fromComponentName === "EnrollmentDetailsComponent";
        interval(250)
            .pipe(
                first(() => this.paylogixWindow?.closed),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(() => this.goBack());
    }

    /**
     * Method to invoke Paylogix sites
     * @returns void
     */
    gotoAflacEBS(): void {
        this.fromContEbs = true;
        if (!this.paylogixWindow || this.paylogixWindow?.closed) {
            const params = new HttpParams()
                .set(MP_GROUP, this.data.mpGroup)
                .set(MEMBER_ID, this.data.memberId)
                .set(EBSPAYMENTONFILE, this.ebsPaymentOnFile);
            this.memberService
                .updateEbsPaymentCallbackStatus(this.data.memberId, this.data.mpGroup, IN_PROGRESS)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    catchError(() => {
                        this.failedEbsPaymentCallback = true;
                        return EMPTY;
                    }),
                )
                .subscribe(() => {
                    this.startPolling(this.paylogixWindow);
                });
            this.paylogixWindow = window.open(window.location.origin + API + PAYLOGIX + QUESTION + params.toString());
        }
    }

    /**
     * Close modal dialog and go back to the previous page
     * @returns void
     */
    goBack(): void {
        const dialogParams = {
            fromContEbs: this.fromContEbs,
            failedEbsPaymentCallback: this.failedEbsPaymentCallback,
        };
        this.dialogRef.close(dialogParams);
    }

    /**
     * Method to start and stop polling and check for EBS payment callback status and paylogix window
     * @param paylogixWindow window object to Paylogix
     * @returns void
     */
    private startPolling(paylogixWindow: Window): void {
        this.pollingSubscription = interval(5000)
            .pipe(
                startWith(0),
                switchMap(() => this.memberService.getEbsPaymentCallbackStatus(this.data.memberId, this.data.mpGroup)),
                takeWhile((res) => !paylogixWindow?.closed && res === IN_PROGRESS),
            )
            .subscribe();
    }

    /**
     * Method to get the EbsPaymentCallbackStatus
     * @returns Boolean if completed
     */
    getEbsPaymentCallbackStatus(): Observable<string | boolean> {
        return this.memberService.getEbsPaymentCallbackStatus(this.data.memberId, this.data.mpGroup).pipe(
            takeUntil(this.unsubscribe$),
            tap((res) => of(res === COMPLETED)),
        );
    }

    /**
     * Life cycle hook to clean component data
     */
    ngOnDestroy(): void {
        this.pollingSubscription?.unsubscribe();
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
