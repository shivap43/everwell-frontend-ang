import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl, FormArray } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";

import { PolicyChangeRequestList, AppSettings, MemberBeneficiary } from "@empowered/constants";
import { SideNavService } from "./../../side-nav/services/side-nav.service";
import { PolicyTransactionForms, MemberService, FindPolicyholderModel, AffectedPolicies, ThirdPartyBeneficiaryType } from "@empowered/api";
import { Subscription, Observable } from "rxjs";
import { filter } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import {
    PolicyChangeRequestState,
    SetChangeBeneficiaryRequest,
    SetBeneficiary,
    SharedState,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { Select, Store } from "@ngxs/store";
import { DatePipe } from "@angular/common";
import { RemoveBeneficiaryPopupComponent } from "./remove-beneficiary-popup/remove-beneficiary-popup.component";
import { NgxMaskPipe } from "ngx-mask";
import { PolicyChangeRequestComponent } from "../../../policy-change-request.component";
import { PolicyChangeRequestCancelPopupComponent, PolicyChangeRequestConfirmationPopupComponent } from "@empowered/ui";

interface Beneficiary {
    firstName: string;
    lastName: string;
    maidenName?: string;
    suffix?: string;
    nickname?: string;
    address1: string;
    address2?: string;
    allocation: string;
    birthDate: string;
    city: string;
    phoneNumber: number;
    relationship: string;
    ssn?: number;
    state: string;
    zip: string;
}

const BENEFICIARY_REQ_FIELDS = [
    "firstName",
    "lastName",
    "address1",
    "city",
    "state",
    "zip",
    "relationship",
    "birthDate",
    "phoneNumber",
    "allocation",
];

@Component({
    selector: "empowered-change-beneficiary",
    templateUrl: "./change-beneficiary.component.html",
    styleUrls: ["./change-beneficiary.component.scss"],
    providers: [DatePipe],
})
export class ChangeBeneficiaryComponent implements OnInit, OnDestroy {
    subscriptions: Subscription[] = [];
    changeBeneficiaryForm: FormGroup;
    initialChangeBeneficiaryData: any;
    beneficiaries: MemberBeneficiary[];
    primaryBeneficiaryList = [];
    contingentBeneficiaryList = [];
    policyList: AffectedPolicies[] = [];
    counter = 0;
    isAllPolicySelected: boolean;
    isSubmitted: boolean;
    changeBeneficiaryRequestInitialData: any;
    selectedBeneficiary: number;
    expandBeneficiaryToggle: boolean;
    expandContingentBeneficiaryToggle: boolean;
    totalSecondaryBeneficiaryAllocation = 0;
    selectedSecondaryBeneficiary: any;
    isPrimaryAllocationRequired: boolean;
    isSecondaryAllocationRequired: boolean;
    isAllocationZero: boolean;
    totalPrimaryBeneficiaryAllocation = 0;
    minDate: string;
    showErrorMessage: boolean;
    validationRegex: any;
    primaryAllocationMaxLength = 3;
    secondaryAllocationMaxLength = 3;
    editBeneficiary: boolean;
    showSpinner: boolean;
    selectedPolicyIds = [];
    isPrimaryBeneficiary: boolean;
    beneficiaryId: number;
    formArray: any;
    storePolicy = [];
    isBeneFiciarySaved: boolean;
    isIndeterminate: boolean;
    primaryPatternError: boolean;
    secondaryPatternError: boolean;
    primaryBeneficiaryMissingDetails: string[] = [];
    secondaryBeneficiaryMissingDetails: string[] = [];
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.header",
        "primary.portal.policyChangeRequest.transactions.continue",
        "primary.portal.policyChangeRequest.transactions.cancel",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.note",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.totalAllocationMustBeHundread",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.allocationMustNotBeZero",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.allocationMustNotBe98",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.allocationMustNotBe99",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.allocationMustNotBe97",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.decimalNotAllwed",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.allocation",
        "primary.portal.policyChangeRequest.transactions.back",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.affectedPolicyTooltip",
        "primary.portal.policyChangeRequest.transactions.validationDecimalsAreNotAllowed",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.allocationValidation",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.allocationRequired",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.noPrimaryBeneficiaryAvailable",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addPrimaryBeneficiaryMessage",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addContingentBeneficiaryMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.isBeneficiarySaved",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.affectedPolicies",
        "primary.portal.policyChangeRequest.transactions.selectAll",
        "primary.portal.policyChangeRequest.transactions.selectionRequired",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.effectiveDate",
        "primary.portal.policyChangeRequest.transactions.requiredField",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.validationError.noPastTransferEffectiveDate",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.primaryBeneficiary",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.allocation",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.remove",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiaryl.Edit",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addPrimaryBeneficiary",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.contingentBeneficiary",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.noContingentBeneficiaryMessage",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.contingentBeneficiaryValidationMessage",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addContingentBeneficiary",
        "primary.portal.common.next",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.incompleteBeneficiaryDetails",
    ]);
    mpGroup: number;
    memberId: number;

    @Select(PolicyChangeRequestState.GetChangeBebeficiaryRequest) beneficiaryRequest$: Observable<any>;
    @Select(SharedState.regex) regex$: Observable<any>;
    @Select(PolicyChangeRequestState.GetmemberInfo) memberInfo$: Observable<FindPolicyholderModel>;

    constructor(
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        private readonly sideNavService: SideNavService,
        private readonly languageService: LanguageService,
        private readonly datePipe: DatePipe,
        private readonly store: Store,
        private cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
        private readonly maskPipe: NgxMaskPipe,
        private readonly memberService: MemberService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    // Assign the data object to the local object(i.e validationRegex)
                    this.validationRegex = data;
                }
            }),
        );
        this.subscriptions.push(
            this.memberInfo$.subscribe((data) => {
                if (data) {
                    this.mpGroup = data.groupId;
                    this.memberId = data.memberId;
                }
            }),
        );
    }

    /**
     * Angular life-cycle hook : ngOnInit
     * Set required data and create change beneficiary form control
     */
    ngOnInit(): void {
        this.policyList = this.store.selectSnapshot(PolicyChangeRequestState.GetmemberInfo).policies;
        this.minDate = this.datePipe.transform(new Date(), AppSettings.DATE_FORMAT);
        this.createFormControl();
        this.subscriptions.push(
            this.staticUtilService
                .cacheConfigValue("general.policy_change_request.beneficiary_info.applicable_product_ids")
                .subscribe((value) => {
                    if (value) {
                        const allowedProductIds = value.split(",").map((id) => +id);
                        if (allowedProductIds.length) {
                            this.policyList = this.policyList.filter((policy) => allowedProductIds.some((id) => id === policy.productId));
                        }
                        this.createPolicyFormContol();
                    }
                }),
        );
        this.getBenificiaryLists();
        this.changeBeneficiaryRequestInitialData = { ...this.changeBeneficiaryForm.value };
        this.setDatafromStore();
    }

    private createPolicyFormContol(selected?: boolean): void {
        this.isAllPolicySelected = selected;
        this.formArray = this.changeBeneficiaryForm.get("policyNumbers") as FormArray;
        if (this.storePolicy) {
            this.policyList.forEach((element) => {
                const setValue = this.storePolicy.indexOf(element) !== -1;
                this.formArray.push(this.fb.control(setValue));
            });
        } else {
            this.policyList.forEach((x) => this.formArray.push(this.fb.control(false)));
        }
    }

    createFormControl(): void {
        this.changeBeneficiaryForm = this.fb.group({
            policyNumbers: this.fb.array([]),
            effectiveDate: [new Date(), Validators.required],
            primaryBeneficiaries: this.fb.array([]),
            contingentBeneficiaries: this.fb.array([]),
            type: Object.keys(PolicyTransactionForms)[5],
        });
    }

    setDatafromStore(): void {
        this.subscriptions.push(
            this.beneficiaryRequest$.subscribe((beneficiaryRequest) => {
                if (beneficiaryRequest) {
                    this.storePolicy = [...beneficiaryRequest["policyNumbers"]];
                    if (this.storePolicy.length) {
                        this.policyList.forEach((policy) => {
                            const matchedPolicy = this.storePolicy.find((policyNumber) => policyNumber === policy.policyNumber);
                            if (matchedPolicy) {
                                this.storePolicy[this.storePolicy.indexOf(matchedPolicy)] = policy;
                            }
                        });
                    }
                    this.getBenificiaryLists();
                    this.changeBeneficiaryForm.patchValue(beneficiaryRequest);
                    this.createBeneficiaryFormControl();
                } else {
                    this.createBeneficiaryFormControl();
                    this.getBenificiaryLists();
                }
                this.checkForIntermidiateValue();
            }),
        );
    }

    selectAll(isChecked: boolean): void {
        this.formControl["policyNumbers"].controls = [];
        if (isChecked) {
            this.counter = this.policyList.length;
            this.isAllPolicySelected = true;
            this.policyList.forEach((x) => this.formArray.push(this.fb.control(true)));
        } else {
            this.isAllPolicySelected = false;
            this.counter = 0;
            this.isIndeterminate = false;
            this.policyList.forEach((x) => this.formArray.push(this.fb.control(false)));
        }
    }

    checkAllpolicySelected(): void {
        if (this.counter > 0) {
            this.counter--;
        }
    }

    selectSingle(isChecked: boolean): void {
        if (!isChecked) {
            this.counter = this.counter > 0 ? --this.counter : this.counter;
            this.isAllPolicySelected = isChecked;
        } else {
            this.counter++;
            this.isAllPolicySelected = this.counter === this.formControl["policyNumbers"].controls.length ? true : false;
        }
        this.checkForIntermidiateValue();
    }

    checkForIntermidiateValue(): void {
        this.isAllPolicySelected = this.counter === this.policyList.length ? true : false;
        this.isIndeterminate = this.counter !== 0 && !this.isAllPolicySelected ? true : false;
    }
    /**
     * Get form control
     */
    get formControl(): unknown {
        return this.changeBeneficiaryForm.controls;
    }

    /**
     * Show add beneficiary form
     * @param {boolean} show display primary or contingent beneficiary form details
     * @param {boolean} isPrimary primary or contingent beneficiary form details
     * @returns void
     *
     */
    toggleBeneficiaryForm(show?: boolean, isPrimary?: boolean): void {
        if (isPrimary) {
            this.showErrorMessage = false;
            this.isPrimaryBeneficiary = isPrimary;
            this.expandBeneficiaryToggle = show ? !this.expandBeneficiaryToggle : show;
            this.setAllocation(true, false);
        } else {
            this.expandContingentBeneficiaryToggle = true;
            this.setAllocation(false, true);
        }
        this.store.dispatch(new SetBeneficiary(this.primaryBeneficiaryList, this.contingentBeneficiaryList));
    }
    /**
     * Submit change beneficiary request
     */
    changeBeneficiary(): void {
        if (
            !this.changeBeneficiaryForm.dirty &&
            !this.primaryBeneficiaryList.length &&
            !this.store.selectSnapshot(PolicyChangeRequestState.GetChangeBebeficiaryRequest)
        ) {
            this.openConfirmationPopup();
        } else {
            this.isSubmitted = true;
            this.validateAllFormFields(this.changeBeneficiaryForm);
            this.checkIsBeneficarySaved();
            this.validateBeneficiarySelection();
            this.checkForPrimaryAllocation();
            this.checkForSecondaryAllocation();

            if (!this.isPrimaryAllocationRequired) {
                // eslint-disable-next-line no-unused-expressions, @typescript-eslint/no-unused-expressions
                if (this.primaryBeneficiaryList.length) {
                    this.validateAllocation("primaryBeneficiaries", true);
                } else {
                    this.removeValidation("primaryBeneficiaries");
                }
            }
            if (!this.isSecondaryAllocationRequired) {
                if (this.contingentBeneficiaryList.length) {
                    this.validateAllocation("contingentBeneficiaries", false);
                } else {
                    this.removeValidation("contingentBeneficiaries");
                }
            }
            this.setAffectedPolicy();
            this.setAllocation(true, true);
            this.storeRequestData();
        }
    }

    checkIsBeneficarySaved(): void {
        this.isBeneFiciarySaved = false;
        if (this.expandBeneficiaryToggle || this.expandContingentBeneficiaryToggle) {
            this.isBeneFiciarySaved = true;
        }
    }

    checkForPrimaryAllocation(): void {
        this.isPrimaryAllocationRequired = false;
        this.primaryPatternError = false;
        if (this.primaryBeneficiaryList && this.primaryBeneficiaryList.length <= 0 && !this.showErrorMessage) {
            this.isPrimaryAllocationRequired = true;
        }
        this.formControl["primaryBeneficiaries"].controls.forEach((element) => {
            if (element.errors && element.errors.required) {
                this.isPrimaryAllocationRequired = true;
            }
            if (element.errors && element.errors.pattern) {
                this.primaryPatternError = true;
            }
        });
    }

    checkForSecondaryAllocation(): void {
        this.isSecondaryAllocationRequired = false;
        this.secondaryPatternError = false;
        this.formControl["contingentBeneficiaries"].controls.forEach((element) => {
            if (element.errors && element.errors.required) {
                this.isSecondaryAllocationRequired = true;
            }
            if (element.errors && element.errors.pattern) {
                this.secondaryPatternError = true;
            }
        });
    }

    setAffectedPolicy(): void {
        this.selectedPolicyIds = this.policyList.filter((x, i) => !!this.changeBeneficiaryForm.value.policyNumbers[i]);
        this.selectedPolicyIds = this.selectedPolicyIds.map((policy) => policy.policyNumber);
        this.changeBeneficiaryForm.patchValue({
            policyNumbers: this.selectedPolicyIds,
        });
    }
    /**
     * Allocation amount setting for primary beneficiary and contingent beneficiary
     * @param isPrimaryBene: boolean validating primary beneficiary
     * @param isContingentBene: boolean validating contingent beneficiary
     * @returns void
     */
    setAllocation(isPrimaryBene: boolean, isContingentBene: boolean): void {
        if (isPrimaryBene) {
            this.primaryBeneficiaryList = this.primaryBeneficiaryList.map((primaryBeneFiciary, index) => {
                const primaryBeneficiary = { ...primaryBeneFiciary };
                primaryBeneficiary.allocation = this.changeBeneficiaryForm.value["primaryBeneficiaries"][index];
                return primaryBeneficiary;
            });
        }
        if (isContingentBene) {
            this.contingentBeneficiaryList = this.contingentBeneficiaryList.map((contingentBeneFiciary, index) => {
                const contingentBeneficiary = { ...contingentBeneFiciary };
                contingentBeneficiary.allocation = this.changeBeneficiaryForm.value["contingentBeneficiaries"][index];
                return contingentBeneficiary;
            });
        }
    }

    validateBeneficiarySelection(): void {
        this.showErrorMessage = false;
        if (this.primaryBeneficiaryList.length === 0) {
            this.showErrorMessage = true;
        }
    }
    setDateFormat(): void {
        this.changeBeneficiaryForm.value["effectiveDate"] = this.datePipe.transform(
            this.changeBeneficiaryForm.value["effectiveDate"],
            AppSettings.DATE_FORMAT,
        );
        this.changeBeneficiaryForm.value["birthDate"] = this.datePipe.transform(
            this.changeBeneficiaryForm.value["birthDate"],
            AppSettings.DATE_FORMAT,
        );
    }

    /**
     * Validate the form fields and store details after verifying
     * @returns void
     */
    storeRequestData(): void {
        this.counter = this.selectedPolicyIds.length;
        this.changeBeneficiaryForm.value["primaryBeneficiaries"] = this.primaryBeneficiaryList;
        this.changeBeneficiaryForm.value["contingentBeneficiaries"] = this.contingentBeneficiaryList;
        this.changeBeneficiaryForm.value["policyNumbers"] = this.selectedPolicyIds;
        if (this.changeBeneficiaryForm.valid && this.counter && !this.showErrorMessage && this.validateBeneficiaryInfo()) {
            this.setDateFormat();
            this.store.dispatch(new SetBeneficiary(this.primaryBeneficiaryList, this.contingentBeneficiaryList));
            this.store.dispatch(
                new SetChangeBeneficiaryRequest(this.changeBeneficiaryForm.value, this.changeBeneficiaryRequestInitialData),
            );
            this.sideNavService.onNextClick(1);
        }
    }

    /**
     * Validate all fields on form submit
     * @param formGroup: formGroup
     * @returns void
     */
    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            if (control["controls"]) {
                for (const subField in control["controls"]) {
                    if (subField) {
                        control["controls"][subField].markAsTouched({ onlySelf: true });
                    }
                }
            } else {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }

    /**
     * get primary and contingent beneficiary lists
     */
    getBenificiaryLists(): void {
        const primaryBeneficiary = this.store.selectSnapshot(PolicyChangeRequestState.GetPrimaryBeneficiary);
        const contingentBeneficiary = this.store.selectSnapshot(PolicyChangeRequestState.GetContingentBeneficiary);
        if (primaryBeneficiary) {
            this.primaryBeneficiaryList = [...primaryBeneficiary];
        }
        if (contingentBeneficiary) {
            this.contingentBeneficiaryList = [...contingentBeneficiary];
        }
        if (this.primaryBeneficiaryList.length || this.contingentBeneficiaryList.length) {
            this.createBeneficiaryFormControl();
        } else if (this.memberId && this.mpGroup && !this.beneficiaries) {
            this.fetchMemberBeneficiaries();
        }
    }

    createBeneficiaryFormControl(): void {
        this.formArray = this.changeBeneficiaryForm.get("primaryBeneficiaries") as FormArray;
        this.formArray.controls = [];
        this.primaryBeneficiaryList.forEach((primaryBeneficiary) => {
            this.formArray.push(
                this.fb.control(
                    primaryBeneficiary.allocation,
                    Validators.compose([
                        Validators.required,
                        Validators.pattern(new RegExp(this.validationRegex.POSITIVENUMBER_NONDECIMAL)),
                    ]),
                ),
            );
        });

        this.formArray = this.changeBeneficiaryForm.get("contingentBeneficiaries") as FormArray;
        this.formArray.controls = [];
        this.contingentBeneficiaryList.forEach((contingentBeneficiary) => {
            this.formArray.push(
                this.fb.control(
                    contingentBeneficiary.allocation,
                    Validators.compose([
                        Validators.required,
                        Validators.pattern(new RegExp(this.validationRegex.POSITIVENUMBER_NONDECIMAL)),
                    ]),
                ),
            );
        });
    }

    /**
     * API call to fetch member beneficiaries
     * Only beneficiaries of type individual and have existing allocations are filtered
     * Based on allocation type, beneficiaries are sorted and pushed to either primary or secondary beneficiary list.
     * @returns void
     */
    fetchMemberBeneficiaries(): void {
        // maskSsn value to getMemberBeneficiaries api call need to be pass as false because
        // while editing beneficiaries if click on SSN input field then it requires unmasked ssn value
        this.memberService.getMemberBeneficiaries(this.memberId, this.mpGroup, false).subscribe((response) => {
            this.beneficiaries = response;
            this.primaryBeneficiaryList = [];
            this.contingentBeneficiaryList = [];
            if (response && response.length) {
                response
                    .filter((benf) => benf.type === "INDIVIDUAL" && benf.allocations.length)
                    .forEach((beneficiary) => {
                        const beneficiaryObject = {
                            ...beneficiary.name,
                            relationship: beneficiary.relationshipToMember,
                            ssn: beneficiary.ssn,
                            birthDate: beneficiary.birthDate,
                            ...beneficiary.contact.address,
                            phoneNumber: beneficiary.contact.phoneNumber,
                            allocation: null,
                            allocationType: beneficiary.allocations.some((alloc) => alloc.type === ThirdPartyBeneficiaryType.PRIMARY)
                                ? ThirdPartyBeneficiaryType.PRIMARY
                                : ThirdPartyBeneficiaryType.CONTINGENT,
                        };
                        if (beneficiary.allocations.some((alloc) => alloc.type === "PRIMARY")) {
                            this.primaryBeneficiaryList.push(beneficiaryObject);
                        } else if (beneficiary.allocations.some((alloc) => alloc.type === "SECONDARY")) {
                            this.contingentBeneficiaryList.push(beneficiaryObject);
                        }
                    });
            }
            this.store.dispatch(new SetBeneficiary(this.primaryBeneficiaryList, this.contingentBeneficiaryList));
            this.createBeneficiaryFormControl();
        });
    }

    /**
     * Get beneficiary
     */
    getBeneficiary(): void {
        this.expandContingentBeneficiaryToggle = false;
        this.expandBeneficiaryToggle = false;
        this.editBeneficiary = false;
        this.isPrimaryBeneficiary = false;
        this.showErrorMessage = false;
        this.isBeneFiciarySaved = false;
        this.getBenificiaryLists();
    }
    /**
     * Validating allocation amount for primary and contingent beneficiary
     * @param beneficiariesType: string primary or contingent model name
     * @param isPrimary: boolean primary or contingent
     */
    validateAllocation(beneficiariesType: string, isPrimary?: boolean): void {
        this.isSecondaryAllocationRequired = false;
        this.isAllocationZero = false;
        if (isPrimary) {
            this.isPrimaryAllocationRequired = false;
            this.totalPrimaryBeneficiaryAllocation = 0;
        } else {
            this.isSecondaryAllocationRequired = false;
            this.totalSecondaryBeneficiaryAllocation = 0;
        }
        this.formControl[beneficiariesType].controls.some((beneficiary) => {
            if (beneficiary.value || +beneficiary.value === 0) {
                if (Number(beneficiary.value) === 0) {
                    this.isAllocationZero = true;
                    this.validateAllocationForZero(beneficiary, beneficiariesType);
                    return;
                }
                if (isPrimary) {
                    this.totalPrimaryBeneficiaryAllocation = this.totalPrimaryBeneficiaryAllocation + Number(beneficiary.value);
                } else {
                    this.totalSecondaryBeneficiaryAllocation = this.totalSecondaryBeneficiaryAllocation + Number(beneficiary.value);
                }
            }
        });

        if (beneficiariesType === "primaryBeneficiaries" && !this.isAllocationZero) {
            this.validatePrimaryAllocationTotalNotHundread(beneficiariesType);
        }

        if (beneficiariesType === "contingentBeneficiaries" && !this.isAllocationZero) {
            this.validateSecondaryAllocationTotalNotHundread(beneficiariesType);
        }

        if (this.totalPrimaryBeneficiaryAllocation > AppSettings.HUNDRED) {
            this.maxValidationAllocation("primaryBeneficiaries", this.primaryBeneficiaryList.length);
        }

        if (this.totalSecondaryBeneficiaryAllocation > AppSettings.HUNDRED) {
            this.maxValidationAllocation("contingentBeneficiaries", this.contingentBeneficiaryList.length);
        }
    }

    removeValidation(beneficiaryType: string): void {
        this.formControl[beneficiaryType].controls.some((beneficiary) => {
            beneficiary.clearValidators();
        });
        this.formControl[beneficiaryType].clearValidators();
        this.formControl[beneficiaryType].updateValueAndValidity();
    }

    validateAllocationForZero(allocation: FormControl, beneficiariesType: string): void {
        allocation.setErrors({
            allocationMustNotBeZero: true,
        });
        this.formControl[beneficiariesType].setErrors({
            allocationMustNotBeZero: true,
        });
    }

    validatePrimaryAllocationTotalNotHundread(beneficiariesType: string, isPrimary?: boolean): void {
        this.removeValidation(beneficiariesType);
        this.formControl[beneficiariesType].setErrors({
            totalAllocationMustBeHundread: this.totalPrimaryBeneficiaryAllocation !== AppSettings.HUNDRED ? true : null,
            allocationMustNotBeZero: this.isAllocationZero ? true : null,
        });
        this.formControl[beneficiariesType].controls[this.primaryBeneficiaryList.length - 1].setErrors({
            totalAllocationMustBeHundread: this.totalPrimaryBeneficiaryAllocation !== AppSettings.HUNDRED ? true : null,
        });
        if (this.totalPrimaryBeneficiaryAllocation === AppSettings.HUNDRED && !this.isAllocationZero) {
            this.formControl[beneficiariesType].clearValidators();
            this.formControl[beneficiariesType].controls.forEach((element) => {
                element.setErrors({
                    totalAllocationMustBeHundread: null,
                });
                element.clearValidators();
                element.updateValueAndValidity();
            });
        }
        this.changeBeneficiaryForm.updateValueAndValidity();
    }

    validateSecondaryAllocationTotalNotHundread(beneficiariesType: string): void {
        this.removeValidation(beneficiariesType);
        this.formControl[beneficiariesType].setErrors({
            totalAllocationMustBeHundread: this.totalSecondaryBeneficiaryAllocation !== AppSettings.HUNDRED ? true : null,
            allocationMustNotBeZero: this.isAllocationZero ? true : null,
        });

        if (this.contingentBeneficiaryList.length) {
            this.formControl[beneficiariesType].controls[this.contingentBeneficiaryList.length - 1].setErrors({
                totalAllocationMustBeHundread: this.totalSecondaryBeneficiaryAllocation !== AppSettings.HUNDRED ? true : null,
            });
        }
        if (this.totalSecondaryBeneficiaryAllocation === AppSettings.HUNDRED) {
            this.formControl[beneficiariesType].clearValidators();
            this.formControl[beneficiariesType].controls.forEach((element) => {
                element.setErrors({
                    totalAllocationMustBeHundread: null,
                });
                element.clearValidators();
                element.updateValueAndValidity();
            });
        }
        this.changeBeneficiaryForm.updateValueAndValidity();
    }

    maxValidationAllocation(beneficiariesType: string, beneficiaryRecordLength: number): void {
        this.formControl[beneficiariesType].controls.some((beneficiary) => {
            if (beneficiaryRecordLength === 4 && beneficiary.value > AppSettings.NINETY_SEVEN) {
                this.removeValidation(beneficiariesType);
                beneficiary.setErrors({
                    allocationMustNotBe97: true,
                    allocationMustNotBeZero: this.isAllocationZero ? true : null,
                });
                this.formControl[beneficiariesType].setErrors({
                    allocationMustNotBe97: true,
                    allocationMustNotBeZero: this.isAllocationZero ? true : null,
                });
                return;
            } else if (beneficiaryRecordLength === 3 && beneficiary.value > AppSettings.NINETY_EIGHT) {
                this.removeValidation(beneficiariesType);
                beneficiary.setErrors({
                    allocationMustNotBe98: true,
                    allocationMustNotBeZero: this.isAllocationZero ? true : null,
                });
                this.formControl[beneficiariesType].setErrors({
                    allocationMustNotBe98: true,
                    allocationMustNotBeZero: this.isAllocationZero ? true : null,
                });
                return;
            } else if (beneficiaryRecordLength === 2 && beneficiary.value > AppSettings.NINETY_NINE) {
                this.removeValidation(beneficiariesType);
                beneficiary.setErrors({
                    allocationMustNotBe99: true,
                    allocationMustNotBeZero: this.isAllocationZero ? true : null,
                });
                this.formControl[beneficiariesType].setErrors({
                    allocationMustNotBe99: true,
                    allocationMustNotBeZero: this.isAllocationZero ? true : null,
                });
                return;
            }
        });
    }

    /**
     * Validate primary and secondary beneficiary details.
     * Required when pre-populating data from existing beneficiaries.
     * @returns boolean: returns true when all details from both beneficiary types are verified
     */
    validateBeneficiaryInfo(): boolean {
        this.primaryBeneficiaryMissingDetails = this.changeBeneficiaryForm.value["primaryBeneficiaries"]
            .map((beneficiary) => this.getBeneficiaryIncompleteFields(beneficiary))
            .filter((message) => message !== null);
        this.secondaryBeneficiaryMissingDetails = this.changeBeneficiaryForm.value["contingentBeneficiaries"]
            .map((beneficiary) => this.getBeneficiaryIncompleteFields(beneficiary))
            .filter((message) => message !== null);
        return this.primaryBeneficiaryMissingDetails.length === 0 && this.secondaryBeneficiaryMissingDetails.length === 0;
    }

    /**
     * Validate all required fields and prepare a string which lists the missing fields
     * @param beneficiary: Beneficiary details which needs to be validated
     * @returns string: Construct error message containing the missing fields
     */
    getBeneficiaryIncompleteFields(beneficiary: Beneficiary): string {
        const fields = BENEFICIARY_REQ_FIELDS.filter((field) => beneficiary[field] == null);
        return fields.length
            ? this.languageStrings["primary.portal.policyChangeRequest.transactions.changeBeneficiary.incompleteBeneficiaryDetails"]
                  .replace("#name", beneficiary.firstName + " " + beneficiary.lastName)
                  .replace("#fields", fields.join(", "))
            : null;
    }
    /**
     * Remove beneficiary
     */
    removeBeneficiaryConfirmationPopup(beneficiary: any, isPrimary?: boolean, index?: number): void {
        const dialogRef = this.dialog.open(RemoveBeneficiaryPopupComponent, {
            width: "667px",
        });
        this.subscriptions.push(
            dialogRef
                .afterClosed()
                .pipe(filter((result) => result.remove))
                .subscribe((result) => {
                    this.removePrimaryBeneficiary(beneficiary, isPrimary, index);
                }),
        );
    }

    /**
     * remove the selected beneficiary
     * @param beneficiary beneficiary to be deleted
     * @param isPrimary is the beneficiary primary
     * @param index index of the beneficiary
     */
    removePrimaryBeneficiary(beneficiary: any, isPrimary: boolean, index: number): void {
        if (isPrimary) {
            this.primaryBeneficiaryList.splice(index, 1);
            this.formControl["primaryBeneficiaries"].removeAt(index);
            if (!this.primaryBeneficiaryList.length) {
                this.isPrimaryAllocationRequired = false;
            }
        } else {
            this.contingentBeneficiaryList.splice(index, 1);
            this.formControl["contingentBeneficiaries"].removeAt(index);
            if (!this.contingentBeneficiaryList.length) {
                this.isSecondaryAllocationRequired = false;
            }
        }
        this.store.dispatch(new SetBeneficiary(this.primaryBeneficiaryList, this.contingentBeneficiaryList));
        this.getBenificiaryLists();
    }
    /**
     * Show policy change confirmation popup
     */
    openConfirmationPopup(): void {
        const dialogRef = this.dialog.open(PolicyChangeRequestConfirmationPopupComponent, {
            width: "667px",
            data: {
                cancelButton: this.languageStrings["primary.portal.policyChangeRequest.transactions.cancel"],
                continueButton: this.languageStrings["primary.portal.policyChangeRequest.transactions.continue"],
                requestType: this.languageStrings["primary.portal.policyChangeRequest.transactions.changeBeneficiary.header"],
            },
        });
        this.subscriptions.push(
            dialogRef.afterClosed().subscribe((result) => {
                if (result === AppSettings.CONTINUE) {
                    this.sideNavService.onNextClick(1);
                }
            }),
        );
    }

    /**
     * Edit beneficiary
     * @param beneficiary
     */
    edit(index: number, isPrimary: boolean): void {
        this.editBeneficiary = true;
        this.beneficiaryId = index;
        this.isPrimaryBeneficiary = isPrimary;
        if (isPrimary) {
            this.expandBeneficiaryToggle = true;
            this.selectedBeneficiary = index;
        } else {
            this.expandContingentBeneficiaryToggle = true;
            this.selectedSecondaryBeneficiary = index;
        }
    }

    cancel(): void {
        this.cancelDialogRef = this.dialog.open(PolicyChangeRequestCancelPopupComponent, {
            width: "667px",
            data: {
                cancelModalDisplayType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.pcrFlow"],
                cancelButton: this.languageStrings["primary.portal.common.cancel"],
                backButton: this.languageStrings["primary.portal.common.back"],
                requestType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessage"],
                description: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved"],
            },
        });
        this.subscriptions.push(
            this.cancelDialogRef.afterClosed().subscribe((result) => {
                if (result === AppSettings.CANCEL) {
                    this.sideNavService.removeTransactionScreenFromStore(true);
                    this.store.dispatch(new SetChangeBeneficiaryRequest(null, null));
                    this.PCRDialogRef.close(PolicyChangeRequestList.cancel);
                }
            }),
        );
    }

    back(): void {
        this.sideNavService.onBackClick();
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }
    /**
     * This method will unsubscribe all the api subscription.
     */
    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
