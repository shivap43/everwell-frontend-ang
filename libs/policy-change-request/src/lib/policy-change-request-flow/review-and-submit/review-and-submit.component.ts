import { Component, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy } from "@angular/core";
import { SideNavService } from "../side-nav/services/side-nav.service";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { Select, Store } from "@ngxs/store";
import { Observable, BehaviorSubject, Subscription, of } from "rxjs";
import { MemberService, PolicyChangeRequestService, PolicyTransactionForms } from "@empowered/api";
import { PolicyChangeRequestState, SharedState, UtilService } from "@empowered/ngxs-store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { UserService } from "@empowered/user";
import { DatePipe } from "@angular/common";
import { PolicyChangeRequestComponent } from "../../policy-change-request.component";
import { switchMap, tap } from "rxjs/operators";
import { Router } from "@angular/router";
import {
    ClientErrorResponseCode,
    BeneficiaryType,
    PolicyChangeRequestList,
    AppSettings,
    CarrierId,
    BillingAddress,
    AddPayment,
    PaymentType,
} from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";
import { PolicyChangeRequestCancelPopupComponent } from "@empowered/ui";
import { SharedService, PortalType } from "@empowered/common-services";
import { PAYROLL } from "../policy-transactions/transfer-to-direct/transfer-to-direct.constants";

export interface PeriodicElement {
    changetype: string;
    change: string;
    manage: string;
}
export interface ChangedData {
    id?: string;
    name?: string;
}

const OBJECT = "object";
const CREDIT_CARD_ACCESS_TOKEN = "creditCardAccessToken";
const BANK_ACCOUNT = "BANK_ACCOUNT";
const ACCOUNT_NUMBER = "accountNumber";
const MASK_FIRST_SEVEN = "*******";
const DISPLAY_ACCOUNT_NUMBER_MAX_LENGTH = 11;

@Component({
    selector: "empowered-review-and-submit",
    templateUrl: "./review-and-submit.component.html",
    styleUrls: ["./review-and-submit.component.scss"],
    providers: [DatePipe],
})
export class ReviewAndSubmitComponent implements OnInit, AfterViewInit, OnDestroy {
    subscriptions: Subscription[] = [];
    @Select(SharedState.regex) regex$: Observable<any>;

    @Select(PolicyChangeRequestState.GetDowngradeAccidentRequest) downgradeAccidentRequest$: Observable<any>;
    @Select(PolicyChangeRequestState.GetmemberInfo) memberInfo$: Observable<any>;
    reviewAndSubmitForm: FormGroup;
    producerId: number;
    displayedColumns: string[] = ["changetype", "change", "manage"];
    languageStrings: Record<string, string>;
    changeDataArray = [];
    portalAdmin: PortalType = "admin";
    data = [];
    errorMessage: string;
    errorMessageArray = [];
    ERROR = "error";
    DETAILS = "details";
    isAdmin = false;
    isMember: boolean;
    isDirect: boolean;
    showErrorMessage: boolean;

    electronicallySignedOnDate: string;
    agentName: string;
    isLoading: boolean;

    reviewAndSubmitControls: any;
    validationRegex: any;
    policyHolderDetails: any;
    storeDataArray: any;
    mpGroup: any;
    memberId: any;
    memberData: any;
    reviewAndSubmitFormControl: any;

    PCRLanguagePath = "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit";
    transactionFlow$ = new BehaviorSubject<string>("");
    removedForms = [];
    finalDatatype = [];
    warningMessage: boolean;
    isDisabledSignature: boolean;
    transactionForms: any;
    CHANGE_NAME = PolicyTransactionForms.NAME;
    CHANGE_IN_BENEFICIARY_INFO = PolicyTransactionForms.BENEFICIARY_INFORMATION;
    beneficiaryTypes = BeneficiaryType;
    CHANGE_NAME_PERSONAL_DETAILS = ["title", "firstName", "middleName", "lastName", "suffix"];
    paymentDataPayload: AddPayment;
    bankName: string;
    tempusPostalCode: string;
    isPayroll: boolean;

    constructor(
        private readonly sideNavService: SideNavService,
        private readonly sharedService: SharedService,
        private readonly fb: FormBuilder,
        private readonly langService: LanguageService,
        private readonly dialog: MatDialog,
        private readonly user: UserService,
        private readonly datePipe: DatePipe,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
        private removeDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private readonly policyChangeRequestService: PolicyChangeRequestService,
        private readonly store: Store,
        private readonly cdRef: ChangeDetectorRef,
        private readonly util: UtilService,
        private readonly router: Router,
        private readonly memberService: MemberService,
    ) {}
    /**
     * Angular life-cycle hook : ngOnInit
     * Set necessary flags, data and create review form
     */
    ngOnInit(): void {
        this.getLanguageStrings();
        this.isMember = this.router.url.split("/").some((str) => str === "member");
        this.isDirect = this.router.url.split("/").some((str) => str === "direct");
        this.isPayroll = this.router.url.split("/").some((str) => str === PAYROLL);
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.subscriptions.push(
            this.sharedService.userPortal$
                .pipe(
                    tap((portal) => {
                        if (portal.type === this.portalAdmin) {
                            this.isAdmin = true;
                        }
                    }),
                )
                .subscribe(),
        );
        this.storeDataArray = [
            {
                finalData: this.store.selectSnapshot(PolicyChangeRequestState.GetChangeAddressRequest),
                initialData: this.store.selectSnapshot(PolicyChangeRequestState.GetInitialAddressData),
            },
            {
                finalData: this.store.selectSnapshot(PolicyChangeRequestState.GetChangeNameRequest),
                initialData: this.store.selectSnapshot(PolicyChangeRequestState.GetChangeNameInitialData),
            },
            {
                finalData: this.store.selectSnapshot(PolicyChangeRequestState.GetChangeOccupationalClassRequest),
                initialData: this.store.selectSnapshot(PolicyChangeRequestState.GetChangeOccupationalClassInitialData),
            },
            {
                finalData: this.store.selectSnapshot(PolicyChangeRequestState.GetChangeGenderRequest),
                initialData: this.store.selectSnapshot(PolicyChangeRequestState.GetChangeGenderInitialData),
            },
            {
                finalData: this.store.selectSnapshot(PolicyChangeRequestState.GetDowngradeAccidentRequest),
                initialData: this.store.selectSnapshot(PolicyChangeRequestState.GetDowngradeAccidentInitialData),
            },
            {
                finalData: this.store.selectSnapshot(PolicyChangeRequestState.GetDowngradeCancerRequest),
                initialData: this.store.selectSnapshot(PolicyChangeRequestState.GetDowngradeCancerInitialData),
            },
            {
                finalData: this.store.selectSnapshot(PolicyChangeRequestState.GetDowngradeDisabilityRequest),
                initialData: this.store.selectSnapshot(PolicyChangeRequestState.GetDowngradeDisabilityInitialData),
            },
            {
                finalData: this.store.selectSnapshot(PolicyChangeRequestState.GetRemoveDependantRequest),
                initialData: this.store.selectSnapshot(PolicyChangeRequestState.GetRemoveDependantInitialData),
            },
            {
                finalData: this.store.selectSnapshot(PolicyChangeRequestState.GetRemoveRiderRequest),
                initialData: this.store.selectSnapshot(PolicyChangeRequestState.GetRemoveRiderInitialData),
            },
            {
                finalData: this.store.selectSnapshot(PolicyChangeRequestState.GetTransferToDirectRequest),
                initialData: this.store.selectSnapshot(PolicyChangeRequestState.GetTransferToDirectInitialData),
            },
            {
                finalData: this.store.selectSnapshot(PolicyChangeRequestState.GetTransferToPayrollRequest),
                initialData: this.store.selectSnapshot(PolicyChangeRequestState.GetTransferToPayrollInitialData),
            },
            {
                finalData: this.store.selectSnapshot(PolicyChangeRequestState.GetChangeBebeficiaryRequest),
                initialData: this.store.selectSnapshot(PolicyChangeRequestState.GetChangeBebeficiaryInitialData),
            },
        ];

        this.getDataFromStore();
        this.subscriptions.push(
            this.memberInfo$.subscribe((memberInfo) => {
                if (memberInfo) {
                    this.mpGroup = memberInfo.groupId;
                    this.memberId = memberInfo.memberId;
                }
            }),
        );

        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                }
            }),
        );
        this.createFormControl();
        const currentDate = new Date();
        this.electronicallySignedOnDate = this.datePipe.transform(currentDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);

        this.subscriptions.push(
            this.user.credential$.subscribe((credential) => {
                if (credential) {
                    this.agentName = credential.name.firstName + " " + credential.name.lastName;
                }
                if ("producerId" in credential) {
                    this.producerId = credential.producerId;
                }
                if ("memberId" in credential && !this.memberId) {
                    this.memberId = credential.memberId;
                }
                if ("groupId" in credential && !this.isMember && !this.mpGroup) {
                    this.mpGroup = credential.groupId;
                }
            }),
        );
    }
    getDataFromStore(): void {
        this.policyHolderDetails = this.store.selectSnapshot(PolicyChangeRequestState.GetFindPolicyHolderDetails);
        const requestPolicyChanges = this.store.selectSnapshot(PolicyChangeRequestState.GetRequestPolicyChanges);
        if (requestPolicyChanges) {
            this.transactionForms = requestPolicyChanges;
        }
        this.storeDataArray.forEach((value) => {
            if (value.finalData && value.finalData.type) {
                this.finalDatatype.push(PolicyTransactionForms[value.finalData.type]);
            }
        });
        this.storeDataArray = this.storeDataArray.filter((request) => {
            if (request.initialData && !request.finalData) {
                const formdata = {
                    transactionForm: PolicyTransactionForms[request.initialData.type],
                    changedData: this.data,
                };
                this.data = [];
                if (!this.removedForms.indexOf(formdata.transactionForm)) {
                    this.changeDataArray.push(formdata);
                }
            }
            return request.finalData;
        });
        this.checkTransactionChanges();
        if (this.transactionForms) {
            this.transactionForms.requestPolicyChanges.forEach((element) => {
                if (this.finalDatatype.indexOf(element) === -1) {
                    this.data = [
                        {
                            name: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.noUpdateMessage"],
                        },
                    ];
                    const formdata = {
                        transactionForm: element,
                        changedData: this.data,
                    };
                    this.data = [];
                    this.changeDataArray.push(formdata);
                }
            });
        }
        this.checkForChangeField();
    }

    checkTransactionChanges(): void {
        if (this.storeDataArray.length === 0) {
            this.isDisabledSignature = true;
            this.warningMessage = true;
        } else {
            this.isDisabledSignature = false;
            this.warningMessage = false;
        }
    }

    /**
     * Compare initial and final store data and create changed data array
     */
    checkForChangeField(): void {
        this.storeDataArray.forEach((transaction) => {
            if (transaction.initialData && transaction.finalData) {
                this.compareObj(transaction.initialData, transaction.finalData);
                if (PolicyTransactionForms[transaction.finalData.type] === PolicyTransactionForms.GENDER_CHANGE) {
                    this.data = this.data.map((form) =>
                        form.id === "genderChangeDate"
                            ? { ...form, name: this.datePipe.transform(form.name, AppSettings.DATE_FORMAT_MM_DD_YYYY) }
                            : form,
                    );
                }
                if (PolicyTransactionForms[transaction.finalData.type] === PolicyTransactionForms.BENEFICIARY_INFORMATION) {
                    this.data = [];
                    this.data.push(...transaction.finalData.primaryBeneficiaries);
                    this.data.push(...transaction.finalData.contingentBeneficiaries);
                }
                const formdata = {
                    transactionForm: PolicyTransactionForms[transaction.initialData.type],
                    changedData: this.data,
                };
                this.data = [];
                // logic to avoid showing credit card access token on UI
                if (transaction?.finalData?.tempusTokenIdentityGuid) {
                    const index = formdata?.changedData?.findIndex((data) => data?.id === CREDIT_CARD_ACCESS_TOKEN);
                    if (index > -1) {
                        formdata?.changedData?.splice(index, 1);
                    }
                }
                // logic to display mask account number on review and submit page when the bank draft tempus config is on
                if (transaction?.finalData?.accountNumber && transaction?.finalData?.tempusTokenIdentityGuid) {
                    const indexOfAccountNumber = formdata?.changedData?.findIndex((data) => data?.id === ACCOUNT_NUMBER);
                    if (indexOfAccountNumber > -1) {
                        formdata.changedData[indexOfAccountNumber].name = this.getMaskedAccountNumber(
                            formdata?.changedData[indexOfAccountNumber].name,
                        );
                    }
                }
                this.changeDataArray.push(formdata);
            }
        });
    }

    compareDowngradeList(obj1: any, obj2: any): void {
        if (
            obj1["type"] === Object.keys(PolicyTransactionForms)[7] ||
            obj1["type"] === Object.keys(PolicyTransactionForms)[9] ||
            obj1["type"] === Object.keys(PolicyTransactionForms)[8]
        ) {
            for (const request in obj2) {
                if (request !== "type") {
                    if (request === "decreasedRider") {
                        this.showDecreasedRiderChange(request, obj2);
                    } else {
                        this.data.push({ id: request + "-" });
                        this.data.push({ id: " From Value -", name: obj2[request]["from"] });
                        this.data.push({ id: " To Value -", name: obj2[request]["to"] });
                    }
                }
            }
        }
    }
    /**
     * @description to show decreased rider changes
     * @param request policy change request data
     * @param obj2 rider policy data
     * @returns void
     */
    showDecreasedRiderChange(request: string, obj2: any): void {
        this.data.push({ id: request + "-" });
        if (obj2[request].id) {
            this.data.push({ id: " From Value -", name: obj2[request]["amount"]["from"] });
            this.data.push({ id: " To Value -", name: obj2[request]["amount"]["to"] });
        } else {
            this.store.select(PolicyChangeRequestState.GetmemberInfo).subscribe((riderData) => {
                riderData.riderPolicies.forEach((riderPolicy, $index) => this.data.push({ id: $index, name: riderPolicy.policyName }));
            });
        }
    }

    /**
     * Compare initial and final pcr form data
     * @param obj1 initial form data object
     * @param obj2 final form data objet
     * @param isArray: is array comparison
     */
    compareObj(obj1: any, obj2: any, isArray?: any): void {
        if (obj1 && obj2) {
            this.compareDowngradeList(obj1, obj2);
        }
        if (typeof obj1 === "object") {
            for (const p in obj1) {
                // eslint-disable-next-line no-prototype-builtins
                if (obj1.hasOwnProperty(p) === obj2.hasOwnProperty(p) && p !== "riderIds") {
                    if (Array.isArray(obj1[p])) {
                        if (obj1[p].length > 0) {
                            for (let i = 0; i <= obj1[p].length; i++) {
                                for (let j = 0; j <= obj2[p].length; j++) {
                                    if (i === j) {
                                        this.compareObj(obj1[p][i], obj2[p][j], p);
                                    }
                                }
                            }
                        } else if (obj2[p].length > 0) {
                            obj2[p].forEach((form) => this.compareObj(undefined, form, p));
                        }
                    } else {
                        switch (typeof obj1[p]) {
                            case "object":
                                this.compareObj(obj1[p], obj2[p]);
                                break;

                            default:
                                if (obj1[p] !== obj2[p]) {
                                    if (isArray && obj2[p]) {
                                        this.data.push({ array: isArray, id: p, name: obj2[p] });
                                    } else if (obj2[p]) {
                                        this.data.push({ id: p, name: obj2[p] });
                                    }
                                }
                        }
                    }
                }
            }
        } else {
            this.checkForArrayWithDiffObj(obj1, obj2, isArray);
        }
    }
    /**
     * Compare initial and final pcr form data
     * @param obj1 initial form data object
     * @param obj2 final form data objet
     * @param isArray: is array comparison
     */
    checkForArrayWithDiffObj(obj1: any, obj2: any, isArray: any): void {
        if (obj1 !== obj2 && isArray !== "policyNumbers") {
            if (isArray) {
                if (obj2 && typeof obj2 !== OBJECT) {
                    this.data.push({ array: isArray, id: isArray, name: obj2 });
                }
                this.checkForObject(obj2);
            } else if (obj2) {
                this.data.push({ id: "-", name: obj2 });
            }
        }
    }

    checkForObject(obj2: any): void {
        if (typeof obj2 === "object") {
            // eslint-disable-next-line guard-for-in
            for (const p in obj2) {
                // eslint-disable-next-line no-unused-expressions, @typescript-eslint/no-unused-expressions
                obj2[p] ? this.data.push({ id: p + "-", name: obj2[p] }) : null;
            }
        }
    }

    createFormControl(): void {
        this.reviewAndSubmitForm = this.fb.group(
            {
                signature: [
                    {
                        value: "",
                        disabled: this.isDisabledSignature,
                    },
                    [
                        Validators.maxLength(60),
                        Validators.pattern(new RegExp(this.validationRegex.ALPHANUMERIC_WITH_SPACES)),
                        Validators.required,
                    ],
                ],
            },
            { updateOn: "blur" },
        );
    }

    toTitleCase(property: string): string {
        return property
            ? property.toLowerCase().charAt(0).toUpperCase() +
                  property
                      .slice(1)
                      .split(/(?=[A-Z])/)
                      .join(" ")
            : null;
    }

    onCancel(): void {
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
            this.cancelDialogRef.afterClosed().subscribe((response) => {
                if (response === PolicyChangeRequestList.cancel) {
                    this.resetData(PolicyChangeRequestList.cancel);
                }
            }),
        );
    }
    removeTransaction(event: any): void {
        this.removeDialogRef = this.dialog.open(PolicyChangeRequestCancelPopupComponent, {
            width: "667px",
            data: {
                cancelModalDisplayType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.remove"],
                cancelButton: this.languageStrings["primary.portal.common.cancel"],
                removeButton: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.remove"],
                description: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.removeMessage"],
            },
        });
        this.subscriptions.push(
            this.removeDialogRef.afterClosed().subscribe((response) => {
                if (response === "remove") {
                    this.sideNavService.onRemoveClick(2);
                    this.removedForms.push(event.transactionForm);
                    this.removeTransactionFormData(event.transactionForm);
                    if (this.changeDataArray.length === 0) {
                        this.sideNavService.defaultStepPositionChanged$.next(2);
                    }
                    this.checkTransactionChanges();
                }
            }),
        );
    }

    onClickSubmitWithNoUpdate(): void {
        this.dialog.open(PolicyChangeRequestCancelPopupComponent, {
            width: "667px",
            data: {
                cancelModalDisplayType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.noUpdateOnReviewSubmit"],
                cancelButton: this.languageStrings["primary.portal.common.cancel"],
                gotItButton: this.languageStrings["primary.portal.common.gotIt"],
                description: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.gotItMessage"],
            },
        });
    }

    /**
     * Removes a transaction form data on click
     * @param formName form object to be removed
     */
    removeTransactionFormData(formName: string): void {
        this.sideNavService.removeTransactionForm(formName);
        this.changeDataArray = this.changeDataArray.filter((form) => form.transactionForm !== formName);
        this.sideNavService.removeTransactionScreenFromStore(false);
        this.storeDataArray = this.storeDataArray.filter((transaction) => PolicyTransactionForms[transaction.finalData.type] !== formName);
    }

    ngAfterViewInit(): void {
        this.cdRef.detectChanges();
    }
    editTransaction(event: any): void {
        this.sideNavService.onEditClick(event.transactionForm);
        this.sideNavService.defaultStepPositionChanged$.next(3);
    }

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
     * Changes all the zip values to required format
     */
    validateZipField(): void {
        const tempStoreArray = this.util.copy(this.storeDataArray);
        if (tempStoreArray && tempStoreArray.length) {
            tempStoreArray.forEach((requests) => {
                if (requests.zip) {
                    requests.zip = this.getZipFormat(requests.zip);
                }
                if (requests.primaryBeneficiaries) {
                    requests.primaryBeneficiaries.forEach((beneficiary) => {
                        beneficiary.zip = this.getZipFormat(beneficiary.zip);
                    });
                }
                if (requests.otherDependentAddress && requests.otherDependentAddress.zip) {
                    requests.otherDependentAddress.zip = this.getZipFormat(requests.otherDependentAddress.zip);
                }
                if (requests.contingentBeneficiaries) {
                    requests.contingentBeneficiaries.forEach((beneficiary) => {
                        beneficiary.zip = this.getZipFormat(beneficiary.zip);
                    });
                }
            });
        }
        this.storeDataArray = tempStoreArray;
    }
    /**
     * This method changes zip to required format
     * @param zipValue the zip entered in the form
     * @returns formatted zip value
     */
    getZipFormat(zipValue: string): string {
        return zipValue.replace(/-/g, "");
    }
    /**
     * Submits the requested policy changes
     */
    onSubmit(): void {
        if (this.storeDataArray.length > 0) {
            this.validateAllFormFields(this.reviewAndSubmitForm);
            if (this.reviewAndSubmitForm.valid) {
                this.storeDataArray = this.storeDataArray.map((request) => request.finalData);
                this.validateZipField();
                this.restoringStoreArray();
                if (this.memberId && this.mpGroup && (this.isMember || this.isDirect)) {
                    this.savePolicyChangeRequestMember();
                } else {
                    this.savePolicyChangeRequest();
                }
            }
        } else {
            this.onClickSubmitWithNoUpdate();
        }
    }

    restoringStoreArray(): void {
        let billingName;
        const tempStoreArray = this.util.copy(this.storeDataArray);
        if (tempStoreArray && tempStoreArray.length) {
            tempStoreArray.forEach((dataArray) => {
                if (dataArray["billingName"] && dataArray["billingName"].billingFirstName) {
                    billingName = {
                        firstName: dataArray["billingName"].billingFirstName,
                        middleName: dataArray["billingName"].billingMiddleName,
                        lastName: dataArray["billingName"].billingLastName,
                        suffix: dataArray["billingName"].billingSuffix,
                    };
                    dataArray["billingName"] = billingName;
                }
            });
        }
        this.storeDataArray = tempStoreArray;
    }

    /**
     * Updates member payment data
     * @param indexOfTempusCard holds index of change request which has credit/debit card or bank draft with tempus token
     * @param tempusPostalCode postal code added in tempus iframe
     * @returns member payment data
     */
    updateMemberPaymentData(indexOfTempusCard: number, tempusPostalCode: string): Observable<HttpResponse<void>> {
        if (indexOfTempusCard > -1 && this.memberId && (this.isMember || this.isDirect || this.isPayroll || this.isAdmin)) {
            const storeDataWithTempusToken = this.storeDataArray[indexOfTempusCard];
            const billingAddress: BillingAddress = {
                address1: storeDataWithTempusToken?.address1,
                city: storeDataWithTempusToken?.city,
                state: storeDataWithTempusToken?.state,
                zip: storeDataWithTempusToken?.zip,
            };
            if (storeDataWithTempusToken.billingType === BANK_ACCOUNT) {
                this.paymentDataPayload = {
                    accountName:
                        storeDataWithTempusToken.accountHoldersName.firstName + " " + storeDataWithTempusToken.accountHoldersName.lastName,
                    paymentType: PaymentType.BANKDRAFT,
                    accountNumber: storeDataWithTempusToken.accountNumber,
                    tempusTokenIdentityGuid: storeDataWithTempusToken.tempusTokenIdentityGuid,
                    routingNumber: storeDataWithTempusToken.transitNumber,
                    accountType: storeDataWithTempusToken.accountType,
                    sameAddressAsHome: false,
                    tokens: [{ carrierId: CarrierId.AFLAC, token: "" }],
                    billingName: storeDataWithTempusToken.accountHoldersName,
                    bankName: this.bankName,
                    billingAddress,
                };
            } else {
                this.paymentDataPayload = {
                    accountName:
                        storeDataWithTempusToken.cardHoldersName.firstName + " " + storeDataWithTempusToken.cardHoldersName.lastName,
                    paymentType: storeDataWithTempusToken.billingType,
                    type: storeDataWithTempusToken.creditCardType,
                    tempusTokenIdentityGuid: storeDataWithTempusToken.tempusTokenIdentityGuid,
                    sameAddressAsHome: false,
                    tokens: [{ carrierId: CarrierId.AFLAC, token: "" }],
                    lastFour: storeDataWithTempusToken.lastFour,
                    expirationMonth: storeDataWithTempusToken.creditCardExpirationMonth,
                    expirationYear: storeDataWithTempusToken.creditCardExpirationYear,
                    billingName: storeDataWithTempusToken.cardHoldersName,
                    billingAddress,
                    tempusPostalCode,
                };
            }
            return this.memberService.getPaymentMethods(this.memberId, this.mpGroup).pipe(
                switchMap((paymentMethods) => {
                    const paymentId = paymentMethods.find(
                        (method) => method.tempusTokenIdentityGuid === storeDataWithTempusToken.tempusTokenIdentityGuid,
                    )?.id;
                    return this.memberService.updatePaymentMethod(this.memberId, this.mpGroup, this.paymentDataPayload, paymentId);
                }),
            );
        }
        return of({} as HttpResponse<void>);
    }
    /**
     * This method will return the masked account number
     * @param accountNumber selected bank account number
     * @return string masked account number
     */
    getMaskedAccountNumber(accountNumber: string): string {
        return this.util.getMaskedString(accountNumber, DISPLAY_ACCOUNT_NUMBER_MAX_LENGTH - accountNumber?.length);
    }

    /**
     * This method is used to set tempus postal code or bank name according to billing type and
     * if billing type is BANK_ACCOUNT then delete bank name as bank name is not required to
     * pass in payload of policyChangeRequest api call
     * @param index which holds the index of credit/debit card or bank draft with tempus token
     * @returns void
     */
    setPostalCodeOrBankName(index: number): void {
        if (index > -1) {
            if (this.storeDataArray[index].billingType === PaymentType.CREDITCARD) {
                this.tempusPostalCode = this.fetchPaymentPostalCode(index);
            } else if (this.storeDataArray[index].billingType === BANK_ACCOUNT) {
                this.bankName = this.storeDataArray[index].bankName;
                delete this.storeDataArray[index].bankName;
            }
        }
    }
    /**
     * This method is used to save the policy change request
     * @returns void
     */
    savePolicyChangeRequestMember(): void {
        this.isLoading = true;
        const indexOfTempusCard = this.storeDataArray.findIndex((storeData) => storeData.tempusTokenIdentityGuid);
        this.setPostalCodeOrBankName(indexOfTempusCard);
        this.subscriptions.push(
            this.policyChangeRequestService
                .savePolicyChangeRequestMemeber(
                    this.storeDataArray,
                    Number.parseInt(this.mpGroup, AppSettings.MAX_LENGTH_10),
                    this.memberId,
                    this.reviewAndSubmitForm.value.signature,
                    this.policyHolderDetails?.policyNumber,
                )
                .pipe(switchMap(() => this.updateMemberPaymentData(indexOfTempusCard, this.tempusPostalCode)))
                .subscribe(
                    () => {
                        this.resetData(PolicyChangeRequestList.submitted);
                    },
                    (error) => {
                        this.showErrorAlertMessage(error);
                    },
                ),
        );
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.isLoading = false;
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS] && error[this.DETAILS].length > 0) {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(
                `secondary.portal.dashboard.reviewAndSubmit.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }
    /**
     * Fetches payment postal code
     * @param indexOfCard
     * @returns payment postal code
     */
    fetchPaymentPostalCode(indexOfCard: number): string {
        let paymentPostalCode = "";
        if (indexOfCard > -1) {
            // if there is tempus postal code then store it for put payment method call, and
            // set it to undefined as we don't need to send it to save policy change request
            paymentPostalCode = this.storeDataArray[indexOfCard].tempusPostalCode;
            this.storeDataArray[indexOfCard].tempusPostalCode = undefined;
        }
        return paymentPostalCode;
    }

    /**
     * This method is used to save the policy change request of global PCR
     * @returns void
     */
    savePolicyChangeRequest(): void {
        this.isLoading = true;
        const indexOfTempusCard = this.storeDataArray.findIndex((storeData) => storeData.tempusTokenIdentityGuid);
        this.setPostalCodeOrBankName(indexOfTempusCard);
        this.subscriptions.push(
            this.policyChangeRequestService
                .savePolicyChangeRequest(this.reviewAndSubmitForm.value.signature, this.storeDataArray, this.policyHolderDetails)
                .pipe(switchMap(() => this.updateMemberPaymentData(indexOfTempusCard, this.tempusPostalCode)))
                .subscribe(
                    () => {
                        this.resetData(PolicyChangeRequestList.submitted);
                    },
                    (error) => {
                        this.showErrorAlertMessage(error);
                    },
                ),
        );
    }

    resetData(type: string): void {
        this.isLoading = false;
        if (type === PolicyChangeRequestList.submitted) {
            this.PCRDialogRef.close(PolicyChangeRequestList.submitted);
        } else {
            this.PCRDialogRef.close(PolicyChangeRequestList.cancel);
        }
        this.changeDataArray.forEach((form) => {
            this.sideNavService.removeTransactionScreenFromStore(true);
        });

        this.sideNavService.onSubmitClick();
    }
    onBack(): void {
        this.sideNavService.defaultStepPositionChanged$.next(3);
        this.sideNavService.onBackClick();
    }
    /**
     * function is for returning the flag if inside loop personal details of change name is compeleted
     * @param changedData
     * @param index
     * @returns boolean
     */
    checkForNextLine(changedData: ChangedData[], index: number): boolean {
        return changedData.filter((data) => this.CHANGE_NAME_PERSONAL_DETAILS.indexOf(data.id) !== -1).length === index + 1;
    }

    getLanguageStrings(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
            "primary.portal.common.cancel",
            "primary.portal.common.back",
            "primary.portal.common.gotIt",
            "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
            "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.reviewSubmit",
            "primary.portal.dashboard.policyChangeRequestFlow.noUpdateOnReviewSubmit",
            "primary.portal.dashboard.policyChangeRequestFlow.noUpdateMessage",
            "primary.portal.dashboard.policyChangeRequestFlow.remove",
            "primary.portal.dashboard.policyChangeRequestFlow.removeMessage",
            "primary.portal.dashboard.policyChangeRequestFlow.gotItMessage",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.submittedChangesMessage",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.changeType",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.change",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.manage",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.remove",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.signature",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.agentSignature",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.agentName",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.electronicallySignedOn",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.acknowledgement",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.disclaimer",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.customerSignature",
            "primary.portal.dashboard.policyChangeRequestFlow.reviewAndSubmit.signatureRequired",
            "primary.portal.common.selectOption",
            "primary.portal.common.edit",
            "primary.portal.common.submit",
        ]);
    }
    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
