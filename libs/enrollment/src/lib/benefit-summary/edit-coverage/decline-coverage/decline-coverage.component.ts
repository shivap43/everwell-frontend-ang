import { Component, OnInit, Inject, Optional, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { ShoppingService, EnrollmentService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { AppSettings, DeclineEnrollmentMethod } from "@empowered/constants";
import { Subscription } from "rxjs";
import { Router } from "@angular/router";
import { TPIState, EnrollmentMethodState } from "@empowered/ngxs-store";

interface DeclineCoverageDialogData {
    mpGroup: number;
    memberId: number;
    enrollData: any;
    planName: string;
    productName: string;
    planYear: number;
    productOfferingId: number;
    enrollId: number;
}

@Component({
    selector: "empowered-decline-coverage",
    templateUrl: "./decline-coverage.component.html",
    styleUrls: ["./decline-coverage.component.scss"],
})
export class DeclineCoverageComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.cancel",
        "primary.portal.declineCoverage.declinecoverage",
        "primary.portal.declineCoverage.declineheading",
        "primary.portal.declineCoverage.declinecontent",
        "primary.portal.declineCoverage.declinecontentlist1",
        "primary.portal.declineCoverage.declinecontentlist2",
        "primary.portal.declineCoverage.declinecontentlist3",
        "primary.portal.declineCoverage.declinecontentlist4",
        "primary.portal.declineCoverage.declinecontentlist5",
        "primary.portal.declineCoverage.declinecontentlist6",
        "primary.portal.declineCoverage.declineheadingFuture",
    ]);
    product = "product";
    firstName = "FirstName";
    planName = "PlanName";
    date = "Date";
    year = "Year";
    currentDate = new Date();
    PYflag = false;
    continousFlag = false;
    pyExpireDate;
    pyStartDate;
    continousStartDate;
    currentCoverage = "current coverage";
    futureCoverage = "future coverage";
    isCurrent: boolean;
    declineProductPreviewData: DeclineEnrollmentMethod;
    effectiveDate: string;
    declineDate: string;
    popupHeading: string;
    isLoading: boolean;
    previewDataExists: boolean;
    subscription: Subscription[] = [];
    isFuture: boolean;
    dateToday;
    enrollmentState;
    isTPI = false;
    employeeFirstName: string;

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: DeclineCoverageDialogData,
        private readonly dialogRef: MatDialogRef<DeclineCoverageComponent>,
        private readonly language: LanguageService,
        private readonly shoppingService: ShoppingService,
        private readonly datePipe: DatePipe,
        private readonly store: Store,
        private readonly enrollmentService: EnrollmentService,
        private readonly router: Router,
    ) {}

    ngOnInit(): void {
        this.enrollmentState = this.store.selectSnapshot(EnrollmentMethodState.getMemberInfo);
        this.isTPI = this.router.url.indexOf(AppSettings.TPI) > 0;
        this.employeeFirstName = this.isTPI
            ? this.store.selectSnapshot(TPIState.tpiSsoDetail).user.name.firstName
            : this.enrollmentState.firstName;
        this.dateToday = this.datePipe.transform(this.currentDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
        if (this.data.enrollData.statusCoverage === this.currentCoverage) {
            this.isCurrent = true;
        } else if (this.data.enrollData.statusCoverage === this.futureCoverage) {
            this.isFuture = true;
        }
        if (this.data.planYear) {
            this.PYflag = true;
            this.pyExpireDate = this.datePipe.transform(this.data.enrollData.validity.expiresAfter, AppSettings.DATE_FORMAT_MM_DD_YYYY);
            this.pyStartDate = this.datePipe.transform(this.data.enrollData.validity.effectiveStarting, AppSettings.DATE_FORMAT_MM_DD_YYYY);
        } else {
            this.continousFlag = true;
            this.continousStartDate = this.datePipe.transform(
                this.data.enrollData.validity.effectiveStarting,
                AppSettings.DATE_FORMAT_MM_DD_YYYY,
            );
        }
        this.getTheHeader();
        this.declineProductPreview();
    }
    onCancelClick(): void {
        this.dialogRef.close();
    }
    /**
     * Get the response on decline the product and set the values in the popup
     */
    declineProductPreview(): void {
        this.isLoading = true;
        this.subscription.push(
            this.enrollmentService
                .getDeclineProductPreview(this.data.memberId, this.data.productOfferingId, this.data.mpGroup)
                .subscribe((res) => {
                    if (res) {
                        this.previewDataExists = true;
                        this.isLoading = false;
                        this.declineProductPreviewData = res;
                        this.effectiveDate = this.datePipe.transform(
                            this.declineProductPreviewData.coverageEffectiveDate,
                            AppSettings.DATE_FORMAT_MM_DD_YYYY,
                        );
                        this.declineDate = this.datePipe.transform(
                            this.declineProductPreviewData.declineCoverageStartDate,
                            AppSettings.DATE_FORMAT_MM_DD_YYYY,
                        );
                    }
                }),
        );
    }
    /**
     * Get the header response from the language on the basis of current or future coverage
     */
    getTheHeader(): void {
        if (this.isFuture) {
            this.popupHeading = this.languageStrings["primary.portal.declineCoverage.declineheadingFuture"];
        } else {
            this.popupHeading = this.languageStrings["primary.portal.declineCoverage.declineheading"];
        }
    }
    /**
     * Life cycle hook used to unsubscribe the data
     */
    ngOnDestroy(): void {
        this.subscription.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
    // TO-DO: Clarifications pending for API usage, to be developed

    onDeclineCoverage(): void {
        this.isLoading = true;
        this.subscription.push(
            this.shoppingService
                .declineProduct(this.data.productOfferingId.toString(), this.data.memberId, undefined, this.data.mpGroup)
                .subscribe((res) => {
                    this.isLoading = false;
                    this.dialogRef.close(this.data.enrollId);
                }),
        );
    }
}
