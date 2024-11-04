import { Component, OnInit, OnDestroy } from "@angular/core";
import { Validators, FormBuilder, FormGroup } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { MPGroupAccountService, SharedService } from "@empowered/common-services";
import { SharedState } from "@empowered/ngxs-store";
import { AflacService, NewHireRule, BenefitsOfferingService, ApprovalRequestStatus } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { iif, Observable, Subscription } from "rxjs";
import { Permission, PagePrivacy, UserPermissionList, CoverageStartType } from "@empowered/constants";

@Component({
    selector: "empowered-rules",
    templateUrl: "./rules.component.html",
    styleUrls: ["./rules.component.scss"],
})
export class RulesComponent implements OnInit, OnDestroy {
    windowLength = "enrollment_window_length";
    responseCoverageStartReference = "coverage_start_reference";
    daysAfterCoverageStartReference = "days_after_coverage_start_reference";
    daysBeforeCoverageStart = "daysBeforeCoverageStart";
    monthsBeforeCoverageStart = "monthsBeforeCoverageStart";
    coverageStartDateString = "coverageStartDate";
    daysConst = "days";
    monthsConst = "months";
    immediatelyConst = "immediately";
    coverageStartConst = "coverage_start";
    enrollmentPeriodFormControl = "enrollmentPeriod";
    COVERAGE_START_REF = "EVENT_DATE";
    COVERAGE_START_IMMEDIATE = "IMMEDIATELY";
    COVERAGE_START_NEXT_FIRST_MONTH = "NEXT_FIRST_OF_MONTH";
    COVERAGE_START_REF_ENROLL_DATE = "ENROLLMENT_DATE";
    stepThreeForm: FormGroup;
    isAfterEvent = true;
    mpGroup: number;
    isFirstOfTheMonethAfter = true;
    ruleId: number;
    editPermission = true;
    newHireDetails: NewHiredetails = {
        coverageStart: "",
        daysToEnroll: 0,
        daysBeforeCoverageStart: 0,
    };
    subscriptions: Subscription[] = [];
    validationRegex: RegExp;
    @Select(SharedState.regex) regex$: Observable<any>;
    coverageStart: string;
    coverageStartReference: string;
    showSpinner: boolean;
    isFormValueChange = false;
    isSaved = false;
    readonly DEFAULT_ENROLLMENT_PERIOD = 60;
    permissionEnum = Permission;
    isEnroller: boolean;
    isPrivacyOnForEnroller: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portals.accounts.importAccount.newhireEligibility",
        "primary.portals.accounts.importAccount.settingsDetermine",
        "primary.portals.accounts.importAccount.enrollmentPeriod",
        "primary.portals.accounts.importAccount.newEmployees",
        "primary.portals.accounts.importAccount.daystoEnroll",
        "primary.portals.accounts.importAccount.coveragestartDate",
        "primary.portals.accounts.importAccount.immediatelySigned",
        "primary.portals.accounts.importAccount.immediatelyAfter",
        "primary.portals.accounts.importAccount.daysofEmployment",
        "primary.portals.accounts.importAccount.firstDay",
        "primary.portals.accounts.importAccount.enrollmentTooltip",
        "primary.portal.common.selectOption",
        "primary.portal.common.update",
        "primary.portal.dashboard.rules",
        "primary.portal.accounts.rules.create",
    ]);

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly language: LanguageService,
        private readonly aflacService: AflacService,
        private readonly store: Store,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly benefitOffering: BenefitsOfferingService,
        private readonly sharedService: SharedService,
    ) {
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.ACCOUNT_RULES);
        }
    }
    /**
     * Initialize forms, get hire rules, permissions and approval request to set data.
     */
    ngOnInit(): void {
        this.showSpinner = true;
        this.subscriptions.push(
            this.mpGroupAccountService.mpGroupAccount$.subscribe((account) => {
                if (account.id) {
                    this.mpGroup = account.id;
                }
            }),
        );
        this.subscriptions.push(
            this.regex$.subscribe((regexData) => {
                if (regexData) {
                    this.validationRegex = new RegExp(regexData.NUMERIC);
                }
            }),
        );
        this.getNewHireRule();
        this.stepThreeForm = this.formBuilder.group({
            enrollmentPeriod: [{ value: this.DEFAULT_ENROLLMENT_PERIOD, disabled: this.isPrivacyOnForEnroller }, [Validators.required]],
            coverageStartDate: [CoverageStartType.IMMEDIATELY, Validators.required],
            daysBeforeCoverageStart: ["", Validators.required],
            monthsBeforeCoverageStart: ["", Validators.required],
        });
        this.subscriptions.push(
            this.benefitOffering.getApprovalRequests(this.mpGroup).subscribe((response) => {
                if (
                    (response.some((res) => res.status === ApprovalRequestStatus.APPROVED) &&
                        !this.store.selectSnapshot(SharedState.hasPermission(UserPermissionList.HIRE_RULE_UPDATE_ROLE20))) ||
                    this.store.selectSnapshot(SharedState.hasPermission(Permission.ACCOUNT_BO_RESTRICT_MANAGE_PLANS))
                ) {
                    this.editPermission = false;
                    this.stepThreeForm.controls[this.enrollmentPeriodFormControl].disable();
                    this.stepThreeForm.controls[this.coverageStartDateString].disable();
                    this.stepThreeForm.controls[this.daysBeforeCoverageStart].disable();
                    this.stepThreeForm.controls[this.monthsBeforeCoverageStart].disable();
                }
            }),
        );
    }
    /**
     * Gets all new hire rules
     * @return Returns void
     */

    /**
     * API call to get new hire rules of account
     */
    getNewHireRule(): void {
        // get the hire rule and disable the required inputs
        this.subscriptions.push(
            this.aflacService.getNewHireRules().subscribe(
                (response) => {
                    if (response.length) {
                        this.ruleId = response[0].id;
                        if (this.ruleId) {
                            this.getMultipleRulesForNewHire();
                        }
                    } else {
                        this.onClickCoverageStart(this.immediatelyConst);
                        this.showSpinner = false;
                    }
                },
                (error) => {
                    this.showSpinner = false;
                },
            ),
        );
    }
    /**
     * Gets new hire rules based in ruleId
     * @return Returns void
     */
    getMultipleRulesForNewHire(): void {
        this.subscriptions.push(
            this.aflacService.getNewHireRule(this.ruleId).subscribe(
                (data) => {
                    this.setDataValues(data);
                    this.showSpinner = false;
                },
                (err) => {
                    this.showSpinner = false;
                },
            ),
        );
    }
    /**
     * sets the data in required inputs and disables elements based on data
     * @param data Data is the new hire rule data from getNewHireRule API.
     * @return Returns void
     */
    setDataValues(data: NewHireRule): void {
        // set the input values or reset and disable inputs
        const attribute = data.actions[0].attributes;
        const enrollmentWindowLength = attribute.find((obj) => obj.name === this.windowLength).value;

        this.stepThreeForm.controls[this.enrollmentPeriodFormControl].setValue(enrollmentWindowLength);
        this.coverageStartReference = attribute.find((obj) => obj.name === this.responseCoverageStartReference).value;
        this.coverageStart = attribute.find((obj) => obj.name === this.coverageStartConst).value;
        const days = attribute.find((obj) => obj.name === this.daysAfterCoverageStartReference).value;
        if (this.coverageStartReference === this.COVERAGE_START_REF) {
            if (this.coverageStart === this.COVERAGE_START_IMMEDIATE) {
                // 2nd option
                this.stepThreeForm.controls[this.daysBeforeCoverageStart].setValue(days);
                this.stepThreeForm.controls[this.coverageStartDateString].setValue(this.daysConst);
                this.stepThreeForm.controls[this.monthsBeforeCoverageStart].disable();
            } else if (this.coverageStart === this.COVERAGE_START_NEXT_FIRST_MONTH) {
                // 3rd option
                this.stepThreeForm.controls[this.monthsBeforeCoverageStart].setValue(days);
                this.stepThreeForm.controls[this.coverageStartDateString].setValue(this.monthsConst);
                this.stepThreeForm.controls[this.daysBeforeCoverageStart].disable();
            }
        } else if (
            this.coverageStartReference === this.COVERAGE_START_REF_ENROLL_DATE &&
            this.coverageStart === this.COVERAGE_START_IMMEDIATE
        ) {
            // option1 selected
            this.stepThreeForm.controls[this.coverageStartDateString].setValue(this.immediatelyConst);
            this.stepThreeForm.controls[this.daysBeforeCoverageStart].disable();
            this.stepThreeForm.controls[this.monthsBeforeCoverageStart].disable();
        }
    }
    /**
     * Takes the data of change event in radio-group and sets/disables the inputs as required.
     * @param coverageStartTime Refers to the event value of change in options of radio-group
     * @return Returns void
     */
    onClickCoverageStart(coverageStartTime: string): void {
        this.isFormValueChange = true;
        if (coverageStartTime === this.immediatelyConst) {
            // if option 1  of coverage start date selected
            this.coverageStart = this.COVERAGE_START_IMMEDIATE;
            this.coverageStartReference = this.COVERAGE_START_REF_ENROLL_DATE;
            this.stepThreeForm.controls[this.daysBeforeCoverageStart].disable();
            this.stepThreeForm.controls[this.monthsBeforeCoverageStart].disable();
            this.stepThreeForm.controls[this.daysBeforeCoverageStart].reset();
            this.stepThreeForm.controls[this.monthsBeforeCoverageStart].reset();
        } else if (coverageStartTime === this.daysConst) {
            // if option 2  of coverage start date selected
            this.coverageStart = CoverageStartType.AFTER_EVENT;
            this.coverageStartReference = this.COVERAGE_START_REF;
            this.stepThreeForm.controls[this.monthsBeforeCoverageStart].reset();
            this.stepThreeForm.controls[this.monthsBeforeCoverageStart].disable();
            this.stepThreeForm.controls[this.daysBeforeCoverageStart].enable();
        } else if (coverageStartTime === this.monthsConst) {
            // if option 3  of coverage start date selected
            this.coverageStart = this.COVERAGE_START_NEXT_FIRST_MONTH;
            this.coverageStartReference = this.COVERAGE_START_REF;
            this.stepThreeForm.controls[this.daysBeforeCoverageStart].reset();
            this.stepThreeForm.controls[this.daysBeforeCoverageStart].disable();
            this.stepThreeForm.controls[this.monthsBeforeCoverageStart].enable();
        }
    }
    /**
     * Takes the data of keypress event and allows only numeric input
     * @param coverageStartTime Refers to the keypress event in input
     * @return Returns void
     */
    numberValidation(event: KeyboardEvent): void {
        if (!this.validationRegex.test(event.key)) {
            event.preventDefault();
        }
        this.isFormValueChange = true;
    }
    /**
     * Takes the data of paste event and allows only numeric input
     * @param coverageStartTime Refers to the Clipboard event in input
     * @return Returns void
     */
    onPasteNumberValidation(event: ClipboardEvent): void {
        if (!this.validationRegex.test(event.clipboardData.getData("Text"))) {
            event.preventDefault();
        }
        this.isFormValueChange = true;
    }
    /**
     * Updates or creates the new hire rules based on the input from user
     * @param update: Updates existing rule if true, else new hire rule is created
     * @return Returns void
     */
    submitHireRules(update: boolean): void {
        if (this.stepThreeForm.valid) {
            this.showSpinner = true;
            this.newHireDetails.daysToEnroll = this.stepThreeForm.controls[this.enrollmentPeriodFormControl].value;
            if (this.coverageStartReference === this.COVERAGE_START_REF) {
                // if coverage start reference is EVENT_DATE
                if (this.coverageStart === CoverageStartType.AFTER_EVENT || this.coverageStart === this.COVERAGE_START_IMMEDIATE) {
                    this.newHireDetails.coverageStart = CoverageStartType.AFTER_EVENT;
                    this.newHireDetails.daysBeforeCoverageStart = this.stepThreeForm.controls[this.daysBeforeCoverageStart].value;
                } else if (this.coverageStart === this.COVERAGE_START_NEXT_FIRST_MONTH) {
                    this.newHireDetails.daysBeforeCoverageStart = this.stepThreeForm.controls[this.monthsBeforeCoverageStart].value;
                    this.newHireDetails.coverageStart = CoverageStartType.FIRST_OF_THE_MONTH_AFTER_EVENT;
                }
            } else if (this.coverageStartReference === this.COVERAGE_START_REF_ENROLL_DATE) {
                // if coverage start reference is not EVENT_DATE
                this.newHireDetails.coverageStart = CoverageStartType.IMMEDIATELY;
                this.newHireDetails.daysBeforeCoverageStart = 0;
            }
            this.subscriptions.push(
                iif(
                    () => update,
                    this.aflacService.updateNewHireRule(this.ruleId, this.newHireDetails),
                    this.aflacService.addNewHireRule(this.newHireDetails, this.mpGroup),
                ).subscribe(
                    (resp) => {
                        this.showSpinner = false;
                        this.isSaved = true;
                        this.isFormValueChange = false;
                    },
                    (err) => {
                        this.showSpinner = false;
                    },
                ),
            );
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}

export interface NewHiredetails {
    daysToEnroll: number;
    coverageStart: string;
    daysBeforeCoverageStart?: number;
}
