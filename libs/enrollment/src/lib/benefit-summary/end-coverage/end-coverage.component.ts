import { Inject, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Component, OnInit, ViewChild } from "@angular/core";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
// TODO: MatHorizontalStepper is deprecated https://material.angular.io/components/stepper/api#MatHorizontalStepper
// This Component will be removed in an upcoming Angular release and receives breaking changes in Angular 13, please use MatStepper instead
import { MatStepper } from "@angular/material/stepper";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { FormBuilder, FormGroup, Validators, ValidationErrors } from "@angular/forms";
import { Store, Select } from "@ngxs/store";
import { Subscription, Observable } from "rxjs";
import { EnrollmentService, EndCoverageSummary } from "@empowered/api";

import { SharedState, RegexDataType, AppFlowService } from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";

import { filter } from "rxjs/operators";
import { PortalType, TPI, AppSettings, TaxStatus } from "@empowered/constants";
import { DateService } from "@empowered/date";

interface DialogData {
    memberId: number;
    mpGroup: number;
    enrollmentId: number;
    enrollmentTaxStatus: string;
    planName: string;
    employeeName: string;
    coverageStartDate: string;
    expiresAfter: string;
    isShop: boolean;
    isCoverageSummary: boolean;
    agEndDate: string;
    productId?: number;
    isArgus: boolean;
}

const ARGUS_ALLOWED_DAYS = 90;
@Component({
    selector: "empowered-end-coverage",
    templateUrl: "./end-coverage.component.html",
    styleUrls: ["./end-coverage.component.scss"],
})
export class EndCoverageComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    @ViewChild("horizontalStepper", { static: true }) horizontalStepper: MatStepper;
    stepperIndex = 0;
    preTaxContent: SafeHtml;
    TEXT_AREA_LENGTH = 250;
    isSpinnerLoading = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.back",
        "primary.portal.common.confirm",
        "primary.portal.common.next",
        "primary.portal.common.optional",
        "primary.portal.endCoverage.stepOne",
        "primary.portal.endCoverage.planNameCoverage",
        "primary.portal.endCoverage.endCoverage",
        "primary.portal.endCoverage.coverageEndDate",
        "primary.portal.endCoverage.description",
        "primary.portal.endCoverage.maxCharacters",
        "primary.portal.endCoverage.stepTwo",
        "primary.portal.endCoverage.confirmEndCoverage",
        "primary.portal.endCoverage.endingCoverage",
        "primary.portal.endCoverage.comments",
        "primary.portal.endCoverage.pretaxPlan",
        "primary.portal.endCoverage.ended",
        "primary.portal.endCoverage.producerPlanNameCoverage",
        "primary.portal.endCoverage.pretaxPlanContent",
        "primary.portal.endCoverage.producerEndingCoverage",
        "primary.portal.endCoverage.memberEndingCoverage",
        "primary.portal.endCoverage.note",
        "primary.portal.endCoverage.endingMemberCoverage",
        "primary.portal.common.requiredField",
        "primary.portal.common.datePast",
        "primary.portal.qle.notesLabel",
        "primary.portal.qle.autoApprovedByAdmin",
        "primary.portal.endCoverage.argus.datePast",
    ]);
    secondaryLanguageStrings: Record<string, string>;
    endCoverageSummaryObj: EndCoverageSummary;
    cancelCoverageForm: FormGroup;
    errorMessage: string;
    showErrorMessage = false;
    enrollmentTaxStatus: string;
    preTax = TaxStatus.PRETAX;
    date: Date;
    todayDate: Date | string = new Date();
    finalCoverageEndDate: string;
    finalCoverageEndDateForAPI: string;
    finalDescription: string;
    onNextClicked = false;
    isProducer = false;
    isMember = false;
    isAdmin = false;
    subscriptions: Subscription[] = [];
    defaultCoverageEndDate = this.data.expiresAfter;
    validationRegex: RegexDataType;
    spaceValidation: boolean;

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        private readonly store: Store,
        private readonly formBuilder: FormBuilder,
        private readonly language: LanguageService,
        private readonly domSanitizer: DomSanitizer,
        private readonly enrollmentService: EnrollmentService,
        private readonly datePipe: DatePipe,
        private readonly router: Router,
        private readonly dialogRef: MatDialogRef<EndCoverageComponent>,
        private readonly appFlowService: AppFlowService,
        private readonly dateService: DateService,
    ) {
        this.subscriptions.push(
            this.regex$.pipe(filter((regexData) => regexData !== undefined && regexData !== null)).subscribe((regexData) => {
                this.validationRegex = regexData;
            }),
        );
    }

    /**
     * This is the initial function that gets executed in this component
     */
    ngOnInit(): void {
        if (this.data.agEndDate) {
            this.todayDate = this.data.agEndDate;
        }
        // Coverage end date can be set to 90 days prior to today's date or upto coverage start date for Argus plans
        if (this.data.isArgus) {
            const argusDate = this.dateService.subtractDays(new Date(), ARGUS_ALLOWED_DAYS);
            this.todayDate = this.dateService.checkIsAfter(this.data.coverageStartDate, argusDate)
                ? this.dateService.toDate(this.data.coverageStartDate)
                : argusDate;
        }
        this.isProducer = this.store.selectSnapshot(SharedState.portal) === PortalType.PRODUCER;
        this.isMember = this.store.selectSnapshot(SharedState.portal) === PortalType.MEMBER;
        this.isAdmin = this.store.selectSnapshot(SharedState.portal) === PortalType.ADMIN;
        this.getSecondaryLanguageStrings();
        this.subscriptions.push(
            this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*")).subscribe(() => {
                this.getSecondaryLanguageStrings();
            }),
        );
        this.initializeForm();
        this.preTaxContent = this.domSanitizer.bypassSecurityTrustHtml(
            this.languageStrings["primary.portal.endCoverage.pretaxPlanContent"],
        );
    }

    /**
     * method to initialize the forms
     * @returns void
     */
    initializeForm(): void {
        this.cancelCoverageForm = this.formBuilder.group({
            coverageEndDate: ["", Validators.required],
            description: [
                {
                    value: this.isAdmin ? this.languageStrings["primary.portal.qle.autoApprovedByAdmin"] : "",
                    disabled: this.isAdmin,
                },
            ],
        });
    }

    /**
     * function called on click of next button in Step 1 page of End Coverage popup
     * @returns void
     */
    onNext(): void {
        this.onNextClicked = true;
        this.showErrorMessage = false;
        const controlErrors: ValidationErrors = this.cancelCoverageForm.get("coverageEndDate").errors;
        if (controlErrors === null) {
            this.stepperIndex++;
        }
        this.finalCoverageEndDate = this.datePipe.transform(
            this.cancelCoverageForm.controls.coverageEndDate.value,
            AppSettings.DATE_FORMAT_MM_DD_YYYY,
        );
        this.finalCoverageEndDateForAPI = this.datePipe.transform(
            this.cancelCoverageForm.controls.coverageEndDate.value,
            AppSettings.DATE_FORMAT_YYYY_MM_DD,
        );
        this.finalDescription = this.cancelCoverageForm.controls.description.value;
        if (this.finalDescription) {
            this.spaceValidation = !this.finalDescription.match(new RegExp(this.validationRegex?.INITIAL_SPACES_NOT_ALLOWED));
        }
        this.endCoverageSummaryObj = {
            coverageEndDate: this.finalCoverageEndDateForAPI,
            description: this.finalDescription,
        };
    }

    /**
     * function called on click of back button in Step 2 page of End Coverage popup
     * @returns void
     */
    onBack(): void {
        this.stepperIndex--;
        this.onNextClicked = false;
    }

    /**
     * function called on click of confirm button in Step 2 page of End Coverage popup
     * @returns void
     */
    onConfirm(): void {
        this.isSpinnerLoading = true;
        this.subscriptions.push(
            this.enrollmentService
                .cancelCoverage(this.data.memberId, this.data.enrollmentId, this.endCoverageSummaryObj, this.data.mpGroup)
                .subscribe(
                    (resp) => {
                        this.isSpinnerLoading = false;
                        if (this.data.isCoverageSummary) {
                            this.directToCoverageSummary();
                        } else if (this.data.isShop) {
                            this.directToShopPage();
                        }
                    },
                    (error) => {
                        this.isSpinnerLoading = false;
                        this.showErrorMessage = true;
                    },
                ),
        );
    }

    /**
     * function called on click of confirm if successful to direct to coverage summary page
     * @returns void
     */
    directToCoverageSummary(): void {
        this.dialogRef.close();
    }
    /**
     * function called on click of confirm if successful to direct to the shop page
     * @returns void
     */
    directToShopPage(): void {
        let url = "";
        if (this.router.url.includes(TPI.TPI)) {
            url = "tpi/shop";
        } else if (this.isMember) {
            this.appFlowService.exitStatus(false);
            url = "member/wizard/enrollment/shop";
        } else if (this.isProducer) {
            // eslint-disable-next-line max-len
            url = `producer/payroll/${this.data.mpGroup}/member/${this.data.memberId}/enrollment/quote-shop/${this.data.mpGroup}/specific/${this.data.memberId}`;
        }
        this.router.navigateByUrl("/", { skipLocationChange: true }).then(() => {
            if (this.isMember) {
                this.router.navigate([url], {
                    state: {
                        landOnPlanList: true,
                        productId: this.data?.productId,
                    },
                });
            } else if (this.isProducer) {
                this.router.navigate([url], {
                    state: {
                        productId: this.data?.productId,
                    },
                });
            } else {
                this.router.navigate([url]);
            }
        });
        this.dialogRef.close();
    }

    /**
     * This method validates the coverage end date.
     * @param event: string, the date value entered
     * @returns language string on the basis of error response.
     */
    validateDate(event: string): string {
        const REQUIRED_FIELD = this.languageStrings["primary.portal.common.requiredField"];
        let errorMessage = "";
        const inputDate = this.dateService.toDate(event);
        const todayDate = this.dateService.toDate(this.todayDate);
        todayDate.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);
        if (this.onNextClicked && (!this.cancelCoverageForm.controls.coverageEndDate.value || event === "")) {
            errorMessage = REQUIRED_FIELD;
        }
        if (event === "") {
            errorMessage = REQUIRED_FIELD;
        }
        if (
            (this.cancelCoverageForm.controls.coverageEndDate.value === null ||
                this.cancelCoverageForm.controls.coverageEndDate.value === "") &&
            event !== ""
        ) {
            errorMessage = this.secondaryLanguageStrings["secondary.portal.common.invalidDateFormat"];
        }
        // If Argus, show error when input date is more than 90 days in the past else if less than today's date
        if (event !== "" && this.dateService.isBefore(inputDate, todayDate)) {
            this.cancelCoverageForm.controls.coverageEndDate.setErrors(
                this.data.isArgus ? { argusMaxAgeError: true } : { maxAgeError: true },
            );
        }
        return errorMessage;
    }

    /**
     * method to initialize secondary language strings
     * @returns void
     */
    getSecondaryLanguageStrings(): void {
        this.secondaryLanguageStrings = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.common.invalidDateFormat",
            "secondary.portal.endCoverage.pretaxErrorMessage",
            "secondary.portal.endCoverage.dateErrorMsg",
        ]);
    }

    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
