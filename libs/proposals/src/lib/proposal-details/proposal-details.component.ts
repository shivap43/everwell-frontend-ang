/* eslint-disable no-underscore-dangle */
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { AccountDetails, BenefitsOfferingService, DeductionFrequencyTypes } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { FormGroup, FormBuilder, Validators, FormControl, ValidationErrors } from "@angular/forms";
import { Store } from "@ngxs/store";
import { UpdateArgusEmployeeCountComponent } from "@empowered/ui";
import { Subscription, Observable, merge, combineLatest } from "rxjs";
import { tap, switchMap } from "rxjs/operators";
import {
    ArgusConfig,
    ModalDialogAction,
    AbstractComponentStep,
    PayFrequency,
    ArgusEligibleEmployeeData,
    AppSettings,
    Accounts,
    DateFormats,
} from "@empowered/constants";
import { Router } from "@angular/router";
import { AccountListState, AccountInfoState, ProposalsState, StaticUtilService } from "@empowered/ngxs-store";
import { MPGroupAccountService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";
import { DatePipe } from "@angular/common";
const PROPOSAL = "proposal-detail";

@Component({
    selector: "empowered-proposal-details",
    templateUrl: "./proposal-details.component.html",
    styleUrls: ["./proposal-details.component.scss"],
})
export class ProposalDetailsComponent extends AbstractComponentStep implements OnInit, OnDestroy {
    account$: Observable<Accounts> = this.mpGroupAccountService.mpGroupAccount$;
    subscriptions: Subscription[] = [];
    routerLink;
    dateArray: string[] = [];
    isProspect = false;
    @Input() proposal!: any;
    form: FormGroup = this.fb.group({
        name: this.fb.control(this.proposal ? this.proposal.name : "", Validators.required),
        coverageStartDate: this.fb.control(
            this.proposal ? this.datepipe.transform(this.proposal.coverageStartDate, DateFormats.MONTH_DAY_YEAR) : "",
            Validators.required,
        ),
        payrollFrequencyId: [],
        censusEstimate: this.fb.control(this.proposal ? this.proposal.censusEstimate : "", Validators.required),
        eligibleADVEmp: [{ value: "", disabled: true }, [Validators.required, this.validateNumber.bind(this), Validators.min(1)]],
    });
    languageString: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.proposals.create.proposalDetails",
        "primary.portal.proposals.create.proposalDetails.name",
        "primary.portal.proposals.create.proposalDetails.coverageStartDate",
        "primary.portal.proposals.create.proposalDetails.censusEstimate",
        "primary.portal.proposals.create.proposalDetails.employeePage.message2",
        "primary.portal.benefitsOffering.aflac.ADVEnrollment",
        "primary.portal.proposals.create.proposalDetails.eligibleAdvEmployee",
    ]);
    argusTotalEligibleEmployees: number;
    eligibleADVMinEmployeeCount: number;
    eligibleADVMaxEmployeeCount: number;
    minEligibleADVEmpMsg: string;
    argusEmployeesInRange = false;
    mpGroup: number;
    selectedItem: DeductionFrequencyTypes;
    readonly MAX_ELIGIBLE_EMPLOYEE_COUNT = 6;
    constructor(
        private readonly language: LanguageService,
        private readonly _bottomSheetRef: MatBottomSheetRef<ProposalDetailsComponent>,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly staticUtilService: StaticUtilService,
        private readonly route: Router,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly dateService: DateService,
        private readonly datepipe: DatePipe,
    ) {
        super();
    }

    /**
     * set up form data and get account id for employee link
     */
    ngOnInit(): void {
        this.constructDateArray();
        this.mpGroup = this.store.selectSnapshot(AccountListState.getMpGroupId);
        const defaultDeductionFrequencyId = this.getDefaultDeductionFrequencyId(
            this.store.selectSnapshot(ProposalsState.getDeductionFrequencies),
            this.store.selectSnapshot(AccountInfoState.getAccountInfo),
        );
        this.form = this.fb.group({
            name: this.fb.control(this.proposal ? this.proposal.name : "", Validators.required),
            coverageStartDate: this.fb.control(
                this.proposal ? this.datepipe.transform(this.proposal.coverageStartDate, DateFormats.MONTH_DAY_YEAR) : this.dateArray[0],
                Validators.required,
            ),
            payrollFrequencyId: [defaultDeductionFrequencyId],
            censusEstimate: this.fb.control(this.proposal ? this.proposal.eligibleEmployeeEstimate : "", [
                Validators.required,
                this.validateNumber.bind(this),
                Validators.min(1),
            ]),
            eligibleADVEmp: [{ value: "", disabled: true }, [Validators.required, this.validateNumber.bind(this), Validators.min(1)]],
        });
        this.subscriptions.push(
            combineLatest([
                this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MIN_VALUE),
                this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MAX_VALUE),
            ])
                .pipe(
                    switchMap(([argusMinValue, argusMaxValue]) => {
                        this.eligibleADVMinEmployeeCount = Number(argusMinValue);
                        this.eligibleADVMaxEmployeeCount = Number(argusMaxValue);
                        return this.benefitsOfferingService.benefitOfferingSettingsData.pipe(
                            tap((censusEstimate) => {
                                if (censusEstimate.totalEligibleEmployees !== 0 && !this.proposal) {
                                    this.form.patchValue({
                                        censusEstimate: censusEstimate.totalEligibleEmployees.toString(),
                                    });
                                }
                                this.argusTotalEligibleEmployees = censusEstimate.argusTotalEligibleEmployees;
                                this.form.controls.eligibleADVEmp.setValue(this.argusTotalEligibleEmployees);
                                this.employeeADVCountChanged(this.argusTotalEligibleEmployees);
                            }),
                            switchMap((censusEstimate) => this.form.controls.censusEstimate.valueChanges),
                            tap((cenEstVal) => this.isTouched.emit(true)),
                        );
                    }),
                )
                .subscribe(),
        );
        this.subscriptions.push(
            merge(this.form.controls.name.valueChanges, this.form.controls.coverageStartDate.valueChanges)
                .pipe(tap((val) => this.isTouched.emit(true)))
                .subscribe(),
        );

        if (this.route.url.indexOf("prospect") !== -1) {
            this.isProspect = true;
        }
    }

    // trigger error state if need be on submit
    onInvalidTraversal(): void {
        if (this.form.value.name === null || this.form.value.name.trim() === "") {
            this.form.controls.name.setErrors({ requirement: true });
            this.form.controls.name.markAsTouched();
        }

        if (this.form.value.coverageStartDate === null || this.form.value.coverageStartDate === "") {
            this.form.controls.coverageStartDate.setErrors({ requirement: true });
            this.form.controls.coverageStartDate.markAsTouched();
        }

        if (this.form.value.censusEstimate === null || this.form.value.censusEstimate.trim() === "") {
            this.form.controls.censusEstimate.setErrors({ requirement: true });
            this.form.controls.censusEstimate.markAsTouched();
        }
    }

    /**
     * validating a number input field
     * @param control: the number input field
     */
    validateNumber(control: FormControl): ValidationErrors | null {
        const value = control.value;
        const numberCheck = /^[0-9]*$/;
        return !numberCheck.test(value) && value ? { requirements: true } : null;
    }

    // close out bottom sheet
    dismissSheet(): void {
        this._bottomSheetRef.dismiss();
    }

    // to contruct an array for next 3 months with 1st date of month
    constructDateArray(): void {
        this.dateArray = Array.from(new Array(3), (val, index) =>
            this.dateService.getFormattedFirstOfMonths(new Date(), index + 1, DateFormats.MONTH_DAY_YEAR),
        );
    }

    /**
     * This method is used to display employee eligiblity message for ADV plans in the settings page
     * @param employeeCount : contains current value of the input field
     */
    employeeADVCountChanged(employeeCount: number): void {
        this.minEligibleADVEmpMsg = this.languageString["primary.portal.benefitsOffering.aflac.ADVEnrollment"]
            .replace("##empMinCount##", String(this.eligibleADVMinEmployeeCount))
            .replace("##empMaxCount##", String(this.eligibleADVMaxEmployeeCount));
        this.argusEmployeesInRange = !(
            employeeCount >= this.eligibleADVMinEmployeeCount && employeeCount <= this.eligibleADVMaxEmployeeCount
        );
    }

    /**
     * function to open dialog for update argus employee count
     */
    openArgusDialogOnEdit(): void {
        const dialogData: ArgusEligibleEmployeeData = {
            eligibleADVMinEmployeeCount: this.eligibleADVMinEmployeeCount,
            eligibleADVMaxEmployeeCount: this.eligibleADVMaxEmployeeCount,
            employeeCount: this.argusTotalEligibleEmployees,
            mpGroup: this.mpGroup,
            isProposal: PROPOSAL,
        };

        this.subscriptions.push(
            this.empoweredModal
                .openDialog(UpdateArgusEmployeeCountComponent, {
                    data: dialogData,
                })
                .afterClosed()
                .pipe(
                    tap((employeeCountResp) => {
                        const showEmployeeCountMsg = "showEmployeeCountMsg";
                        if (employeeCountResp && employeeCountResp.action === ModalDialogAction.SAVED) {
                            this._bottomSheetRef.dismiss(showEmployeeCountMsg);
                        }
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * Gets the default deduction frequency id.
     *
     * @param allDeductionFrequencies array of all deduction frequencies
     * @param currently selected account or prospect
     * @returns deduction frequency with which the deduction frequency dropdown is pre-populated
     */
    getDefaultDeductionFrequencyId(allDeductionFrequencies: PayFrequency[], account: AccountDetails): number {
        // If a proposal is partially completed or if the user is trying to edit an existing proposal,
        // set the deduction frequency from that data.
        // If not, set it as per the default pay frequency of the account if it exists.
        const defaultDeductionFrequencyId = this.proposal ? this.proposal.payrollFrequencyId : account?.payFrequencyId;

        // If the account is a prospect or if it does not have a default. set it as 'Monthly'.
        return allDeductionFrequencies.find((deductionFrequency) =>
            defaultDeductionFrequencyId
                ? deductionFrequency.id === defaultDeductionFrequencyId
                : deductionFrequency.frequencyType === DeductionFrequencyTypes.MONTHLY,
        )?.id;
    }

    // unsubscribe
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
