import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormArray } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import {
    StaticService,
    MemberService,
    AccountService,
    PolicyTransactionForms,
    FindPolicyholderModel,
    AffectedPolicies,
    BillingName,
} from "@empowered/api";
import { Subscription, Observable } from "rxjs";
import { PolicyChangeRequestList, AppSettings } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { Select, Store } from "@ngxs/store";
import { PolicyChangeRequestState, SetTransferToPayrollRequest, SharedState } from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import { SideNavService } from "../../side-nav/services/side-nav.service";
import { HttpEvent } from "@angular/common/http";
import { NgxMaskPipe } from "ngx-mask";
import { PolicyChangeRequestComponent } from "../../../policy-change-request.component";
import { PolicyChangeRequestCancelPopupComponent, PolicyChangeRequestConfirmationPopupComponent } from "@empowered/ui";

const FORM = {
    CURRENT_ACCOUNT_NAME: "currentAccountName",
    CURRENT_ACCOUNT_NUMBER: "currentAccountNumber",
    FIRST_NAME: "firstName",
    LAST_NAME: "lastName",
};

@Component({
    selector: "empowered-transfer-to-payroll",
    templateUrl: "./transfer-to-payroll.component.html",
    styleUrls: ["./transfer-to-payroll.component.scss"],
    providers: [DatePipe],
})
export class TransferToPayrollComponent implements OnInit, OnDestroy {
    transferToPayrollForm: FormGroup;
    affectedPolicyForm: FormGroup;
    minDate = new Date();
    suffixes$: Observable<string[]>;
    acceptableFormats = "png, jpeg, jpg or pdf";
    policyList: AffectedPolicies[] = [];
    isAllPolicySelected: boolean;
    subscriptions: Subscription[] = [];
    mpGroup: any;
    memberId: any;
    showSpinner: boolean;
    counter = 0;
    isSubmitted: boolean;
    documentIdArray = [];
    cifNumber: any;
    selectedPolicyIds = [];
    formArray: any;
    storePolicy: any;
    uploadApi: Observable<HttpEvent<any>>;
    isIndeterminate: boolean;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.transferPayroll.header",
        "primary.portal.policyChangeRequest.transactions.continue",
        "primary.portal.policyChangeRequest.transactions.cancel",
        "primary.portal.policyChangeRequest.transactions.changeName.supportiveDocsTooltip",
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.cancel",
        "primary.portal.common.search",
        "primary.portal.common.back",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portals.accounts.importAccount.errors.invalidGroupNumber",
        "primary.portal.policyChangeRequest.transactions.back",
        "primary.portal.common.next",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.newAccountLabel",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.billingNameLabel",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.currentAccountName",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.newAccountName",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.empOrMemberNumber",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.currentAccountNumber",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.newAccountNumber",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.deptNumber",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.firstname",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.mi",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.lastName",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.effectiveDate",
    ]);
    @Select(PolicyChangeRequestState.GetmemberInfo) memberInfo$: Observable<FindPolicyholderModel>;
    @Select(PolicyChangeRequestState.GetTransferToPayrollRequest) payrollRequest$: Observable<any>;
    @Select(SharedState.regex) regex$: Observable<any>;

    memberInfo: FindPolicyholderModel;
    validationRegex: any;
    nameWithHypenApostrophesValidation: any;
    transferToPayrollRequestInitialData: any;
    isShowTooltip: boolean;
    policyHolderFirstName: any;
    employeeNumberMaxLength = AppSettings.MAX_LENGTH_5;
    accountMaxLength = AppSettings.MAX_LENGTH_5;
    isMultipleAccounts: boolean;
    selectedAccountNumber: string;
    billingInfo: BillingName;
    currentAccName: string;
    currentAccNumber: string;

    constructor(
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        private readonly staticService: StaticService,
        private readonly languageService: LanguageService,
        private readonly memberService: MemberService,
        private readonly datePipe: DatePipe,
        private readonly accountService: AccountService,
        private readonly store: Store,
        private readonly sideNavService: SideNavService,
        private readonly maskPipe: NgxMaskPipe,
        private cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
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
            this.memberInfo$.subscribe((memberInfo) => {
                if (memberInfo) {
                    this.memberInfo = memberInfo;
                    this.mpGroup = memberInfo["groupId"];
                    this.memberId = memberInfo["memberId"];
                    this.cifNumber = memberInfo["cifNumber"];
                    if (memberInfo.policies.length > 1) {
                        const accNumber = memberInfo.policies[0].accountNumber;
                        this.isMultipleAccounts = !memberInfo.policies.every((policy) => policy.accountNumber === accNumber);
                    }
                }
            }),
        );
    }

    /**
     * ngOnInit() : Lifecycle hook to initialize the component
     * It creates transferToPayroll form and fetches member info details
     */
    ngOnInit(): void {
        this.suffixes$ = this.staticService.getSuffixes();
        this.nameWithHypenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
        this.transferToPayrollForm = this.fb.group(
            {
                currentAccountName: ["", Validators.required],
                currentAccountNumber: [
                    "",
                    Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.GROUP_NUMBER))]),
                ],
                newAccountName: ["", Validators.required],
                newAccountNumber: [
                    "",
                    Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.GROUP_NUMBER))]),
                ],
                departmentNumber: [""],
                employeeNumber: [
                    "",
                    Validators.compose([
                        Validators.compose([Validators.maxLength(AppSettings.MAX_LENGTH_5)]),
                        Validators.pattern(new RegExp(this.validationRegex.ALPHANUMERIC)),
                    ]),
                ],
                billingName: this.fb.group({
                    firstName: ["", Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.NAME))])],
                    middleName: [
                        "",
                        Validators.compose([Validators.maxLength(60), Validators.pattern(new RegExp(this.validationRegex.NAME))]),
                    ],
                    lastName: ["", Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.NAME))])],
                    suffix: [""],
                }),
                documentIds: [[]],
                effectiveDate: [new Date(), Validators.required],
                policyNumbers: this.fb.array([], { updateOn: "change" }),
                type: [Object.keys(PolicyTransactionForms)[2]],
            },
            { updateOn: "blur" },
        );
        if (this.memberInfo.policies.length >= 1) {
            this.setBillingDetails(this.memberInfo.policies[0]);
        }
        if (!this.isMultipleAccounts) {
            this.setAccountDetails(this.memberInfo.policies[0]);
        }
        this.transferToPayrollRequestInitialData = { ...this.transferToPayrollForm.value };
        if (this.store.selectSnapshot(PolicyChangeRequestState.GetmemberInfo)) {
            this.policyList = this.store.selectSnapshot(PolicyChangeRequestState.GetmemberInfo).policies;
        }
        this.subscriptions.push(
            this.payrollRequest$.subscribe((payrollRequest) => {
                if (payrollRequest) {
                    this.getDataFromStore(payrollRequest);
                } else {
                    this.getMemberData();
                }
            }),
        );
    }

    getDataFromStore(payrollRequest: any): void {
        this.documentIdArray = payrollRequest["documentIds"];
        this.transferToPayrollRequestInitialData = {
            ...this.store.selectSnapshot(PolicyChangeRequestState.GetTransferToPayrollInitialData),
        };
        this.counter = payrollRequest["policyNumbers"].length;
        this.storePolicy = [...payrollRequest["policyNumbers"]];
        if (this.storePolicy.length) {
            this.policyList.forEach((policy) => {
                const matchedPolicy = this.storePolicy.find((policyNumber) => policyNumber === policy.policyNumber);
                if (matchedPolicy) {
                    this.storePolicy[this.storePolicy.indexOf(matchedPolicy)] = policy;
                }
            });
        }
        this.policyHolderFirstName = this.transferToPayrollRequestInitialData["billingName"].firstName;
        this.transferToPayrollForm.patchValue({ ...payrollRequest });
        this.createPolicyFormContol(true);
        this.checkForIntermidiateValue();
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
                    this.store.dispatch(new SetTransferToPayrollRequest(null, null));
                    this.PCRDialogRef.close(PolicyChangeRequestList.cancel);
                }
            }),
        );
    }

    back(): void {
        this.sideNavService.onBackClick();
    }

    getMemberData(): void {
        this.createPolicyFormContol(false);
        this.getMemeberInfo();
    }

    /**
     * get member information and assign it to form values.
     * @returns void
     */
    getMemeberInfo(): void {
        if (this.memberId && this.mpGroup) {
            this.showSpinner = true;
            this.subscriptions.push(
                this.memberService.getMember(this.memberId, false, this.mpGroup).subscribe(
                    (result) => {
                        this.billingInfo = result.body.name;
                        this.transferToPayrollRequestInitialData = { ...this.transferToPayrollForm.value };
                        this.policyHolderFirstName = this.transferToPayrollForm.value["billingName"]["firstName"];
                        this.showSpinner = false;
                    },
                    () => {
                        this.showSpinner = false;
                    },
                ),
            );
        }

        if (this.mpGroup) {
            this.showSpinner = true;
            this.subscriptions.push(
                this.accountService.getAccount(this.mpGroup.toString()).subscribe(
                    (result) => {
                        this.currentAccName = result.name;
                        this.currentAccNumber = result.groupNumber;
                        this.showSpinner = false;
                    },
                    (error) => {
                        this.showSpinner = false;
                    },
                ),
            );
        }
    }

    private createPolicyFormContol(selected?: boolean): void {
        this.isAllPolicySelected = selected;
        this.formArray = this.transferToPayrollForm.get("policyNumbers") as FormArray;
        if (this.storePolicy) {
            this.policyList.forEach((element) => {
                const setValue = this.storePolicy.indexOf(element) !== -1;
                this.formArray.push(this.fb.control(setValue));
            });
        } else {
            this.policyList.forEach((x) => this.formArray.push(this.fb.control(false)));
        }
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

    selectSingle(isChecked: boolean, policy: AffectedPolicies): void {
        if (!isChecked) {
            this.counter = this.counter > 0 ? --this.counter : this.counter;
            if (this.counter === 0 && this.isMultipleAccounts) {
                this.clearAccountDetails();
            }
            this.isAllPolicySelected = isChecked;
        } else {
            this.counter++;
            this.isAllPolicySelected = this.counter === this.formControl["policyNumbers"].controls.length;
            this.setAccountDetails(policy);
        }
        this.checkForIntermidiateValue();
    }

    checkForIntermidiateValue(): void {
        this.isAllPolicySelected = this.counter === this.policyList.length;
        this.isIndeterminate = this.counter !== 0 && !this.isAllPolicySelected;
    }

    /**
     * Populate the form with account name, number and billing name and disable the fields
     * based on the selected policy
     * @param selectedPolicy: Policy used for filling the form details
     * @returns void
     */
    setAccountDetails(selectedPolicy: AffectedPolicies): void {
        if (this.selectedAccountNumber !== selectedPolicy.accountNumber) {
            this.selectedAccountNumber = selectedPolicy.accountNumber;
            if (selectedPolicy.accountName) {
                this.formControl[FORM.CURRENT_ACCOUNT_NAME].setValue(selectedPolicy.accountName);
                this.formControl[FORM.CURRENT_ACCOUNT_NAME].disable();
            }
            this.formControl[FORM.CURRENT_ACCOUNT_NUMBER].setValue(selectedPolicy.accountNumber);
            this.formControl[FORM.CURRENT_ACCOUNT_NUMBER].disable();
        }
    }

    /**
     * Populate the form with billing name and disable the fields
     * @param selectedPolicy: Policy used for filling the form details
     * @returns void
     */
    setBillingDetails(selectedPolicy: AffectedPolicies): void {
        this.billingFormControl[FORM.FIRST_NAME].setValue(selectedPolicy.billingName.firstName);
        this.billingFormControl[FORM.LAST_NAME].setValue(selectedPolicy.billingName.lastName);
        this.billingFormControl[FORM.FIRST_NAME].disable();
        this.billingFormControl[FORM.LAST_NAME].disable();
    }

    /**
     * On un-checking the policy in form, the policy details are reset and enabled.
     * @returns void
     */
    clearAccountDetails(): void {
        this.selectedAccountNumber = null;
        this.formControl[FORM.CURRENT_ACCOUNT_NAME].reset();
        this.formControl[FORM.CURRENT_ACCOUNT_NUMBER].reset();
        this.formControl[FORM.CURRENT_ACCOUNT_NAME].enable();
        this.formControl[FORM.CURRENT_ACCOUNT_NUMBER].enable();
    }
    /**
     * Get form controls
     */
    get formControl(): any {
        return this.transferToPayrollForm.controls;
    }
    /**
     * Get billing form controls
     */
    get billingFormControl(): any {
        return this.formControl["billingName"].controls;
    }
    /**
     * Submit transfer to payroll request
     */
    transferToPayroll(): void {
        if (!this.transferToPayrollForm.dirty && !this.store.selectSnapshot(PolicyChangeRequestState.GetTransferToPayrollRequest)) {
            this.openConfirmationPopup();
        } else {
            this.transferToPayrollForm.value["documentIds"] = this.documentIdArray;
            this.isSubmitted = true;
            this.validateAllFormFields(this.transferToPayrollForm);
            this.setAffectedPolicy();
            this.storeRequest();
        }
    }

    getDocumentId(documentID: number): void {
        if (documentID) {
            this.documentIdArray.push(documentID);
        } else {
            this.formControl["documentIds"].patchValue(null);
            this.documentIdArray = [];
        }
    }

    setDateFormat(): void {
        this.transferToPayrollForm.value["effectiveDate"] = this.datePipe.transform(
            this.transferToPayrollForm.value["effectiveDate"],
            AppSettings.DATE_FORMAT,
        );
    }

    setAffectedPolicy(): void {
        this.selectedPolicyIds = this.policyList.filter((x, i) => !!this.transferToPayrollForm.value.policyNumbers[i]);
        this.selectedPolicyIds = this.selectedPolicyIds.map((policy) => policy.policyNumber);
    }

    /**
     * Populate form value to store the data
     * @returns void
     */
    storeRequest(): void {
        this.transferToPayrollForm.patchValue({ documentIds: this.documentIdArray });
        this.setDateFormat();
        this.counter = this.selectedPolicyIds.length;
        if (this.transferToPayrollForm.valid && this.counter) {
            const selectedPolicy = this.policyList.find((policy) => this.selectedPolicyIds.some((id) => policy.policyNumber === id));
            const accName = this.transferToPayrollForm.value[FORM.CURRENT_ACCOUNT_NAME];
            const accNumber = this.transferToPayrollForm.value[FORM.CURRENT_ACCOUNT_NUMBER];
            const billingName = this.transferToPayrollForm.value[FORM.FIRST_NAME];
            this.store.dispatch(
                new SetTransferToPayrollRequest(
                    {
                        ...this.transferToPayrollForm.value,
                        billingName:
                            billingName && billingName.firstName && billingName.lastName ? billingName : { ...selectedPolicy.billingName },
                        policyNumbers: this.selectedPolicyIds,
                        currentAccountNumber: accNumber ? accNumber : selectedPolicy.accountNumber,
                        currentAccountName: accName ? accName : selectedPolicy.accountName,
                    },
                    this.transferToPayrollRequestInitialData,
                ),
            );
            this.sideNavService.onNextClick(1);
        }
    }
    /**
     * Validate all fiels on form submit
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
     * Set or remove validations on from control
     * @param formControlName
     * @param action
     */
    clearOrSetValidator(formControlName: string, action: string): void {
        if (action === "clear") {
            this.formControl[formControlName].clearValidators();
        } else {
            this.formControl[formControlName].setValidators([Validators.required]);
        }
        this.formControl[formControlName].updateValueAndValidity();
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
                requestType: this.languageStrings["primary.portal.policyChangeRequest.transactions.transferPayroll.header"],
            },
        });
        this.subscriptions.push(
            dialogRef.afterClosed().subscribe((result) => {
                if (result === AppSettings.CONTINUE) {
                    this.sideNavService.onNextClick(1);
                } else {
                    dialogRef.close();
                }
            }),
        );
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
