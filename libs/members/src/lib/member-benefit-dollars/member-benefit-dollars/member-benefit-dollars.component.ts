import { Component, OnInit, OnDestroy } from "@angular/core";
import { AccountService, MemberService, BenefitsOfferingService } from "@empowered/api";
import { Name } from "@empowered/constants";
import { ActivatedRoute } from "@angular/router";
import { FormGroup, FormBuilder, FormArray, Validators } from "@angular/forms";
import { NgxMaskPipe } from "ngx-mask";
import { AppSettings } from "@empowered/constants";
import { DatePipe } from "@angular/common";
import { forkJoin, Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";
import { take, tap } from "rxjs/operators";
import { UserService } from "@empowered/user";

const PERCENTAGE = "PERCENTAGE";
const EMPTY = "";

@Component({
    selector: "empowered-member-benefit-dollars",
    templateUrl: "./member-benefit-dollars.component.html",
    styleUrls: ["./member-benefit-dollars.component.scss"],
})
export class MemberBenefitDollarsComponent implements OnInit, OnDestroy {
    offeringList = [];
    mpGroup: number;
    memberId: number;
    offeringForm: FormGroup;
    panelExpanded = "";
    editingIndex: number = null;
    displaySuffixPrefix = false;
    payFrequencyId: number;
    payFrequency = "";
    flexDollarId = null;
    isZeroState = false;
    memberName = "";
    isLoading: boolean;
    requestArray = [];
    getOfferingRequestArray = [];
    getExceptionRequestArray = [];
    focusedGroup = null;
    edExceptions = [];
    datesRangeArray = [];
    dateValidation: boolean;
    CONTROLS = "controls";
    AUDIENCEGROUPINGID = "audienceGroupingId";
    START = "start";
    ENDDATE = "endDate";
    STARTDATE = "startDate";
    subscriptions: Subscription[] = [];
    isAdmin = false;
    ADMIN_PORTAL = "admin";
    minStartDate = new Date();
    allowEdit: boolean;
    response: Name;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.memberBenefitDollars.memberBenefitDollars.benefitDollars",
        "primary.portal.memberBenefitDollars.memberBenefitDollars.memberNameNonZeroState",
        "primary.portal.memberBenefitDollars.memberBenefitDollars.memberNameZeroState",
        "primary.portal.memberBenefitDollars.memberBenefitDollars.note",
        "primary.portal.memberBenefitDollars.memberBenefitDollars.discount",
        "primary.portal.memberBenefitDollars.memberBenefitDollars.addNewAmount",
        "primary.portal.memberBenefitDollars.memberBenefitDollars.offeringAmount",
        "primary.portal.memberBenefitDollars.memberBenefitDollars.startDate",
        "primary.portal.memberBenefitDollars.memberBenefitDollars.endDate",
        "primary.portal.common.edit",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.common.requiredField",
        "primary.portal.common.invalidDateFormat",
        "primary.portal.memberBenefitDollars.dateRange",
        "primary.portal.common.optional",
        "primary.portal.resources.invalidStartDate",
        "primary.portal.thirdParty.date_past",
        "primary.portal.applicationFlow.beneficiary.benefitPercentages",
        "primary.portal.benefitDollars.payment.message",
    ]);
    isPercentage: boolean;
    companyName: string;

    constructor(
        private readonly accountService: AccountService,
        private readonly route: ActivatedRoute,
        private readonly fb: FormBuilder,
        private readonly maskPipe: NgxMaskPipe,
        private readonly memberService: MemberService,
        private readonly datepipe: DatePipe,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly language: LanguageService,
        private readonly user: UserService,
    ) {}

    /**
     * To set-up initial data for the component
     * @returns {void}
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.allowEdit = false;
        this.mpGroup = this.route.snapshot.parent.parent.params.mpGroupId;
        this.memberId = this.route.snapshot.parent.parent.params.memberId;
        this.subscriptions.push(this.user.portal$.pipe(tap((portal) => (this.isAdmin = portal === this.ADMIN_PORTAL))).subscribe());
        this.getMemberDetail();
        this.subscriptions.push(
            this.accountService.getAccount(this.mpGroup.toString()).subscribe((res) => {
                this.companyName = res ? res.name : EMPTY;
            }),
        );
        this.getPayFrequency();
        this.getFlexDollars();
        this.initializeForm();
    }

    /**
     * get employee payFrequency type
     */
    getPayFrequency(): void {
        this.subscriptions.push(
            this.accountService.getPayFrequencies(this.mpGroup?.toString()).subscribe(
                (payFrequencies) => {
                    this.payFrequency = payFrequencies?.find((x) => x.id === this.payFrequencyId)?.name;
                },
                () => {
                    this.isLoading = false;
                },
            ),
        );
    }

    /**
     * This method is used to fetch member details
     * @returns void
     */
    getMemberDetail(): void {
        this.subscriptions.push(
            this.memberService.getMember(this.memberId, true, this.mpGroup.toString()).subscribe(
                (res) => {
                    this.response = res.body.name;
                    this.memberName = `${this.response.firstName} ${this.response.lastName}`;
                    this.payFrequencyId = res.body?.workInformation?.payrollFrequencyId;
                },
                () => {
                    this.isLoading = false;
                },
            ),
        );
    }

    initializeForm(): void {
        this.offeringForm = this.fb.group(
            {
                offeringAmounts: this.fb.array([]),
            },
            { updateOn: "blur" },
        );
    }
    /**
     * Method to return list of flexdollars of specific member
     * @return void
     */
    getFlexDollars(): void {
        this.offeringList = [];
        this.subscriptions.push(
            this.accountService.getFlexDollarsOfMember(this.memberId, this.mpGroup.toString()).subscribe(
                (res) => {
                    const offeringResultArray = [];
                    res.forEach((element) => {
                        offeringResultArray.push(element);
                    });
                    const result = offeringResultArray.map((x) => {
                        const obj = Object.assign({}, x);
                        obj.isException = false;
                        return obj;
                    });
                    this.offeringList.push(...result);
                    this.offeringList.sort((a, b) => (a.id > b.id ? 1 : b.id > a.id ? -1 : 0));
                    if (this.offeringList.length <= 0) {
                        this.isZeroState = true;
                    } else {
                        this.isZeroState = false;
                    }
                    this.isLoading = false;
                    this.getExceptions();
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
    }
    /**
     * This method is used to retrieve exceptions based on offering ids
     * @returns void
     */
    getExceptions(): void {
        this.offeringList.forEach((offeringItem) => {
            offeringItem.isPercentage = offeringItem.contributionType === PERCENTAGE;
            if (!offeringItem.isException) {
                this.subscriptions.push(
                    this.memberService.getFlexDollarExceptions(this.memberId, offeringItem.id, this.mpGroup).subscribe(
                        (exception) => {
                            if (exception.length > 0) {
                                this.offeringList = this.offeringList.filter((x) => x.id !== offeringItem.id);
                                const result = exception.map((x) => {
                                    const obj = Object.assign({}, x);
                                    obj.isException = true;
                                    obj.offeringId = offeringItem.id;
                                    obj.name = offeringItem.name;
                                    obj.amount = offeringItem.amount;
                                    obj.exceptionAmount = x.amount;
                                    obj.description = offeringItem.description;
                                    obj.isPercentage = offeringItem.contributionType === PERCENTAGE;
                                    return obj;
                                });
                                this.offeringList.push(...result);
                            }
                        },
                        (err) => {
                            this.isLoading = false;
                        },
                    ),
                );
            }
        });
    }
    /**
     * This method is used to handle edit operation
     * @param offering is used to handle single object
     * @param editIndex is used to store user selected item to edit
     * @returns void
     */
    editOffering(offering: any, editIndex: number): void {
        this.flexDollarId = offering.isException ? offering.offeringId : offering.id;
        this.isPercentage = offering.isPercentage;
        this.editingIndex = editIndex;
        this.panelExpanded = offering.id.toString();
        this.initializeForm();
        if (offering.isException) {
            this.populateForm(offering);
        } else {
            this.addNewAmount(offering.amount, offering.contributionType);
        }
    }

    populateForm(exception: any): void {
        this.addFormGroup(exception);
    }

    addFormGroup(exception: any): void {
        this.offeringAmountFormArray.push(this.setOfferingFormArray(exception));
    }
    /**
     * This method is used to create form group for exception amount
     * @param exception is used to handle exception object
     * @returns FormGroup
     */
    setOfferingFormArray(exception: any): FormGroup {
        const operation = exception.isException ? exception.id : null;
        const validatorsForAmount =
            exception.contributionType === PERCENTAGE
                ? [Validators.required, Validators.min(AppSettings.MIN_AMOUNT), Validators.max(AppSettings.MAX_LENGTH_100)]
                : [Validators.required, Validators.min(AppSettings.MIN_AMOUNT)];
        return this.fb.group(
            {
                amount: [exception.exceptionAmount.toFixed(2), validatorsForAmount],
                startDate: [exception.validity.effectiveStarting, Validators.required],
                endDate: [exception.validity.expiresAfter],
                operation: [operation],
            },
            { updateOn: "blur" },
        );
    }

    saveOfferingForm(): void {
        if (this.offeringForm.valid) {
            this.requestArray = [];
            this.isLoading = true;
            this.offeringForm.value.offeringAmounts.forEach((element) => {
                if (element.operation) {
                    this.updateFlexDollarException(element);
                } else {
                    this.createFlexDollarException(element);
                }
            });
            this.subscriptions.push(
                forkJoin(this.requestArray).subscribe(
                    (res) => {
                        this.getFlexDollars();
                        this.isLoading = false;
                        this.cancel();
                        this.benefitsOfferingService
                            .submitApprovalRequest(this.mpGroup, false)
                            .pipe(take(1))
                            .subscribe(
                                (r) => {
                                    this.isLoading = false;
                                },
                                (err) => {
                                    this.isLoading = false;
                                },
                            );
                    },
                    (err) => {
                        this.isLoading = false;
                    },
                ),
            );
        }
    }

    createFlexDollarException(exceptionObject: any): void {
        const saveExceptionObject = {
            amount: exceptionObject.amount,
            validity: {
                effectiveStarting: this.datepipe.transform(exceptionObject.startDate, AppSettings.DATE_FORMAT),
                expiresAfter: this.datepipe.transform(exceptionObject.endDate, AppSettings.DATE_FORMAT),
            },
        };
        this.requestArray.push(
            this.memberService.createFlexDollarException(this.memberId, this.flexDollarId, saveExceptionObject, this.mpGroup),
        );
    }

    updateFlexDollarException(exceptionObject: any): void {
        const saveExceptionObject = {
            amount: exceptionObject.amount,
            validity: {
                effectiveStarting: this.datepipe.transform(exceptionObject.startDate, AppSettings.DATE_FORMAT),
                expiresAfter: this.datepipe.transform(exceptionObject.endDate, AppSettings.DATE_FORMAT),
            },
        };
        this.requestArray.push(
            this.memberService.updateFlexDollarException(
                this.memberId,
                this.flexDollarId,
                exceptionObject.operation,
                saveExceptionObject,
                this.mpGroup,
            ),
        );
    }

    cancel(): void {
        this.panelExpanded = "";
        this.editingIndex = null;
    }

    setPanelExpanded(offering: any): void {
        this.panelExpanded = offering.id;
    }

    get offeringAmountFormArray(): FormArray {
        return this.offeringForm.get("offeringAmounts") as FormArray;
    }
    /**
     * This method is used to add new benefit amount
     * @param amount is used to store benefit amount
     * @param contributionType represents contribution type
     * @returns void
     */
    addNewAmount(amount: number, contributionType: string): void {
        this.offeringAmountFormArray.insert(0, this.addOfferingFormArray(amount, contributionType));
        this.makePreviousEndDatesMandatory();
    }
    /**
     * This method is used to validate date range
     * @param index is used to store index
     * @param startOrEndDate represents start or end date
     * @returns void
     */
    validateDateRange(index: number, startOrEndDate: string): void {
        let startDateError = false;
        let endDateError = false;
        for (const [i, element] of this.offeringAmountFormArray.controls.entries()) {
            if (index !== i) {
                if (startOrEndDate === this.START) {
                    this.populatePreviousEndDate(index);
                }
                let elementStartDateError = false;
                let elementEndDateError = false;
                const currentStartDate = this.datepipe.transform(
                    this.returnFormArrayControls(index).startDate.value,
                    AppSettings.DATE_FORMAT,
                );
                const currentEndDate = this.datepipe.transform(this.returnFormArrayControls(index).endDate.value, AppSettings.DATE_FORMAT);
                const startDate = this.datepipe.transform(element.value.startDate, AppSettings.DATE_FORMAT);
                const endDate = this.datepipe.transform(element.value.endDate, AppSettings.DATE_FORMAT);
                if (currentStartDate) {
                    const inRange = this.checkDateInRange(currentStartDate, startDate, endDate);
                    if (inRange) {
                        startDateError = true;
                        elementStartDateError = true;
                        elementEndDateError = true;
                        this.setErrors(element, true, true);
                    }
                }
                if (currentEndDate) {
                    this.checkDateInRange(currentEndDate, startDate, endDate);
                    const inRange = this.checkDateInRange(currentEndDate, startDate, endDate);
                    if (inRange) {
                        endDateError = true;
                        elementStartDateError = true;
                        elementEndDateError = true;
                        this.setErrors(element, true, true);
                    }
                }
                if (currentStartDate && currentEndDate) {
                    const startInRange = this.checkDateInRange(startDate, currentStartDate, currentEndDate);
                    const endInRange = this.checkDateInRange(endDate, currentStartDate, currentEndDate);
                    if (startInRange && endInRange) {
                        startDateError = true;
                        endDateError = true;
                        elementStartDateError = true;
                        elementEndDateError = true;
                        this.setErrors(element, true, true);
                    }
                }
                if (elementStartDateError) {
                    this.setErrors(element, true, false);
                } else {
                    element.get(this.STARTDATE).setErrors(null);
                }
                if (elementEndDateError) {
                    this.setErrors(element, false, true);
                } else {
                    element.get(this.ENDDATE).setErrors(null);
                }
            }
        }
        if (startDateError) {
            this.returnFormArrayControls(index).startDate.setErrors({ isDateOverlapping: true });
            this.returnFormArrayControls(index).startDate.markAsTouched();
        } else {
            this.returnFormArrayControls(index).startDate.setErrors(null);
        }
        if (endDateError) {
            this.returnFormArrayControls(index).endDate.setErrors({ isDateOverlapping: true });
            this.returnFormArrayControls(index).endDate.markAsTouched();
        } else {
            this.returnFormArrayControls(index).endDate.setErrors(null);
        }
    }

    checkDateInRange(currentDate: string, startDate: string, endDate: string): boolean {
        return currentDate >= startDate && currentDate <= endDate;
    }

    setErrors(element: any, start: boolean, end: boolean): void {
        if (start) {
            element.get(this.STARTDATE).setErrors({ isDateOverlapping: true });
            element.get(this.STARTDATE).markAsTouched();
        }
        if (end) {
            element.get(this.ENDDATE).setErrors({ isDateOverlapping: true });
            element.get(this.ENDDATE).markAsTouched();
        }
    }

    returnFormArrayControls(index: number): any {
        return this.offeringAmountFormArray.at(index)[this.CONTROLS];
    }

    makePreviousEndDatesMandatory(): void {
        for (const [i, element] of this.offeringAmountFormArray.controls.entries()) {
            if (i > 0 && this.offeringAmountFormArray.controls.length > 1) {
                element[this.CONTROLS][this.ENDDATE].setValidators([Validators.required]);
                element.get(this.ENDDATE).updateValueAndValidity();
                break;
            }
        }
    }

    populatePreviousEndDate(index: number): void {
        if (
            this.offeringAmountFormArray.controls.length > 1 &&
            index + 1 <= this.offeringAmountFormArray.controls.length &&
            !this.datepipe.transform(this.offeringAmountFormArray.at(index + 1)[this.CONTROLS].endDate.value, AppSettings.DATE_FORMAT)
        ) {
            const previousExpirationDate = new Date(
                this.datepipe.transform(this.returnFormArrayControls(index).startDate.value, AppSettings.DATE_FORMAT),
            );
            previousExpirationDate.setDate(previousExpirationDate.getDate() - 1);
            this.offeringAmountFormArray.at(index + 1)[this.CONTROLS].endDate.patchValue(previousExpirationDate);
        }
    }

    getMaxStartDate(i: number): Date | null {
        return this.returnFormArrayControls(i).endDate.value ? this.returnFormArrayControls(i).endDate.value : null;
    }
    getMinEndDate(i: number): Date | null {
        return this.returnFormArrayControls(i).startDate.value ? this.returnFormArrayControls(i).startDate.value : null;
    }
    /**
     * This method is used to add form group
     * @param defaultAmount is used to pass benefit amount
     * @param contributionType represents contribution type
     * @returns FormGroup
     */
    addOfferingFormArray(defaultAmount: number = 0, contributionType: string): FormGroup {
        const validatorsForAmount =
            contributionType === PERCENTAGE
                ? [Validators.required, Validators.min(AppSettings.MIN_AMOUNT), Validators.max(100)]
                : [Validators.required, Validators.min(AppSettings.MIN_AMOUNT)];
        return this.fb.group(
            {
                amount: [defaultAmount.toFixed(2), validatorsForAmount],
                startDate: ["", Validators.required],
                endDate: [""],
                operation: [null],
            },
            { updateOn: "blur" },
        );
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    onFocus(i: number): void {
        this.focusedGroup = i;
    }

    onBlur(i: number): void {
        this.focusedGroup = null;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
