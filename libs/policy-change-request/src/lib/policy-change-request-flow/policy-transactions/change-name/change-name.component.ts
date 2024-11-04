import { Component, OnInit, OnDestroy } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { PolicyChangeRequestList, AppSettings, ReasonForChange, Title } from "@empowered/constants";
import { StaticService, PolicyTransactionForms, FindPolicyholderModel } from "@empowered/api";
import { Subscription, Observable } from "rxjs";
import { DatePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { PolicyChangeRequestState, SetNameChangeRequest, SharedState } from "@empowered/ngxs-store";
import { Select, Store } from "@ngxs/store";
import { SideNavService } from "./../../side-nav/services/side-nav.service";
import { HttpEvent } from "@angular/common/http";
import { PolicyChangeRequestComponent } from "../../../policy-change-request.component";
import { PolicyChangeRequestCancelPopupComponent, PolicyChangeRequestConfirmationPopupComponent } from "@empowered/ui";

@Component({
    selector: "empowered-change-name",
    templateUrl: "./change-name.component.html",
    styleUrls: ["./change-name.component.scss"],
    providers: [DatePipe],
})
export class ChangeNameComponent implements OnInit, OnDestroy {
    changeNameForm: FormGroup;
    nameChangeRequestInitialData: any;
    reasonForChangeList = Object.values(ReasonForChange);
    policyHolderInfo;
    suffixes$: Observable<string[]>;
    subscriptions: Subscription[] = [];
    acceptableFormats = "png, jpeg, jpg or pdf";
    isSupportiveDocumentsRequired: boolean;
    titleList = Object.values(Title);
    isBillingNameSame = true;
    showSpinner: boolean;
    uploadApi: Observable<HttpEvent<any>>;
    formId: number;
    isFileUploadFromTransaction = true;
    documentIdArray = [];
    documentIds = [];
    isShowTooltip: boolean;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.changeName.supportiveDocsTooltip",
        "primary.portal.policyChangeRequest.transactions.changeName.header",
        "primary.portal.policyChangeRequest.transactions.continue",
        "primary.portal.policyChangeRequest.transactions.cancel",
        "primary.portal.policyChangeRequest.transactions.back",
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.dashboard.policyChangeRequestFlow.nextStep",
        "primary.portal.policyChangeRequest.transactions.changeName.billingName.firstName",
        "primary.portal.policyChangeRequest.transactions.changeName.billingName.mi",
        "primary.portal.policyChangeRequest.transactions.changeName.mi",
        "primary.portal.policyChangeRequest.transactions.changeName.lastName",
        "primary.portal.policyChangeRequest.transactions.changeName.firstName",
        "primary.portal.policyChangeRequest.transactions.changeName.billingName.lastName",
        "primary.portal.common.next",
    ]);

    @Select(PolicyChangeRequestState.GetmemberInfo) memberInfo$: Observable<FindPolicyholderModel>;
    @Select(PolicyChangeRequestState.GetChangeNameRequest) nameRequest$: Observable<any>;
    @Select(SharedState.regex) regex$: Observable<any>;
    @Select(PolicyChangeRequestState.GetChangeRequestData) changeRequestData$: Observable<any>;

    validationRegex: any;
    nameWithHypenApostrophesValidation: any;
    memberInfo: FindPolicyholderModel;
    mpGroup: any;
    memberId: any;
    cifNumber: any;
    policyHolderFirstName: string;
    policyHolderLastName: string;
    FIRST_NAME = "firstName";
    LAST_NAME = "lastName";
    REASON_FOR_CHANGE = "reasonForChange";
    DOCUMENT_IDS = "documentIds";

    constructor(
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        private readonly staticService: StaticService,
        private readonly languageService: LanguageService,
        private readonly store: Store,
        private readonly sideNavService: SideNavService,
        private readonly datePipe: DatePipe,
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
            this.memberInfo$.subscribe((data) => {
                if (data) {
                    this.memberInfo = data;
                    this.policyHolderFirstName = data.memberFirstName;
                    this.policyHolderLastName = data.memberLastName;
                    this.mpGroup = data.groupId;
                    this.memberId = data.memberId;
                    this.cifNumber = data.cifNumber;
                }
            }),
        );
    }

    ngOnInit(): void {
        this.createFormControl();
        this.suffixes$ = this.staticService.getSuffixes();
        this.nameWithHypenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
        this.nameChangeRequestInitialData = { ...this.changeNameForm.value };

        this.subscriptions.push(
            this.nameRequest$.subscribe((nameRequest) => {
                if (nameRequest) {
                    this.changeNameForm.patchValue(nameRequest);
                    this.documentIds = nameRequest.documentIds;
                    this.nameChangeRequestInitialData = {
                        ...this.store.selectSnapshot(PolicyChangeRequestState.GetChangeNameInitialData),
                    };
                    this.policyHolderFirstName = this.nameChangeRequestInitialData.name.firstName;
                    this.policyHolderLastName = this.nameChangeRequestInitialData.name.lastName;
                    this.documentIdArray = this.changeNameForm.value["documentIds"].slice(0);
                    this.checkedBillingNameSame();
                }
            }),
        );
    }

    checkedBillingNameSame(): void {
        const name = JSON.stringify(this.changeNameForm.value.name);
        const billingName = JSON.stringify(this.changeNameForm.value.billingName);
        if (name === billingName) {
            this.isBillingNameSame = true;
            this.addBillingName(this.isBillingNameSame);
        } else {
            this.isBillingNameSame = false;
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
                    this.store.dispatch(new SetNameChangeRequest(null, null));
                    this.PCRDialogRef.close(PolicyChangeRequestList.cancel);
                }
            }),
        );
    }

    back(): void {
        this.sideNavService.onBackClick();
    }

    getDocumentId(documentID: number): void {
        if (documentID) {
            this.documentIdArray.push(documentID);
            this.isSupportiveDocumentsRequired = false;
            this.clearOrSetValidator("documentIds", "clear");
        }
    }

    removeDocument(documentId: number): void {
        this.documentIds = this.documentIds.filter((x) => x === documentId);
        this.documentIdArray = this.documentIdArray.filter((x) => x !== documentId);
        if (this.documentIds.length === 0 && this.documentIdArray.length === 0) {
            this.formControl["documentIds"].patchValue(null);
            this.clearOrSetValidator("documentIds", "set");
            this.isSupportiveDocumentsRequired = false;
        }
    }
    /**
     * Create form control
     */
    createFormControl(): void {
        this.changeNameForm = this.fb.group(
            {
                title: [""],
                name: this.fb.group({
                    firstName: [
                        this.memberInfo && this.memberInfo.memberFirstName ? this.memberInfo.memberFirstName : "",
                        Validators.compose([
                            Validators.maxLength(60),
                            Validators.required,
                            Validators.pattern(new RegExp(this.validationRegex.NAME)),
                        ]),
                    ],
                    middleName: [
                        "",
                        Validators.compose([Validators.maxLength(60), Validators.pattern(new RegExp(this.validationRegex.NAME))]),
                    ],
                    lastName: [
                        this.memberInfo && this.memberInfo.memberLastName ? this.memberInfo.memberLastName : "",
                        Validators.compose([
                            Validators.maxLength(60),
                            Validators.required,
                            Validators.pattern(new RegExp(this.validationRegex.NAME)),
                        ]),
                    ],
                    suffix: [""],
                }),
                billingName: this.fb.group({
                    billingFirstName: [
                        "",
                        Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.NAME))]),
                    ],
                    billingMiddleName: [
                        "",
                        Validators.compose([Validators.maxLength(60), Validators.pattern(new RegExp(this.validationRegex.NAME))]),
                    ],
                    billingLastName: [
                        "",
                        Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.NAME))]),
                    ],
                    billingSuffix: [""],
                }),
                reasonForChange: ["", Validators.required],
                documentIds: [[]],
                effectiveDate: [this.datePipe.transform(new Date(), AppSettings.DATE_FORMAT), Validators.required],
                type: Object.keys(PolicyTransactionForms)[1],
            },
            { updateOn: "blur" },
        );
    }
    get nameControl(): void {
        return this.formControl["name"].controls;
    }
    get billingNameControl(): void {
        return this.formControl["billingName"].controls;
    }

    /**
     * Add biiling name form group on unchecked of same billing name
     * @param event
     */
    addBillingName(checked: boolean, resetBillingName?: boolean): void {
        this.isBillingNameSame = checked;
        if (checked) {
            this.changeNameForm.patchValue({
                billingName: {
                    billingFirstName: this.changeNameForm.value.name.firstName,
                    billingMiddleName: this.changeNameForm.value.name.middleName,
                    billingSuffix: this.changeNameForm.value.name.suffix,
                    billingLastName: this.changeNameForm.value.name.lastName,
                },
            });
        } else if (resetBillingName) {
            this.changeNameForm.patchValue({
                billingName: {
                    billingFirstName: null,
                    billingMiddleName: null,
                    billingSuffix: null,
                    billingLastName: null,
                },
            });
        }
    }

    /**
     * Get form control
     */
    get formControl(): unknown {
        return this.changeNameForm.controls;
    }

    /**
     * Function is for Validating document before submitting
     */
    validateDocument(): void {
        if (
            this.changeNameForm.value[this.DOCUMENT_IDS].length === 0 &&
            this.policyHolderLastName !== this.nameControl[this.LAST_NAME].value
        ) {
            this.isSupportiveDocumentsRequired = true;
        } else {
            this.isSupportiveDocumentsRequired = false;
            this.clearOrSetValidator(this.DOCUMENT_IDS, "clear");
        }
    }
    /**
     * Submit change name request
     */
    submitChangeNameRequest(): void {
        if (!this.changeNameForm.dirty && !this.store.selectSnapshot(PolicyChangeRequestState.GetChangeNameRequest)) {
            this.openConfirmationPopup();
        } else {
            this.changeNameForm.value["documentIds"] = this.documentIdArray;
            this.validateDocument();
            this.validateAllFormFields(this.changeNameForm);
            this.setChangeNameRequest();
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

    setChangeNameRequest(): void {
        this.addBillingName(this.isBillingNameSame);
        this.changeNameForm.value["documentIds"] = this.documentIdArray;
        if (this.changeNameForm.valid) {
            this.store.dispatch(new SetNameChangeRequest(this.changeNameForm.value, this.nameChangeRequestInitialData));
            this.sideNavService.onNextClick(1);
        }
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
                requestType: this.languageStrings["primary.portal.policyChangeRequest.transactions.changeName.header"],
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

    /**
     * On change of first or last name make supportive documents required and
     * set reason for change to other
     */
    setValidationOnNameChange(): void {
        if (
            (this.nameControl[this.LAST_NAME].dirty || this.nameControl[this.FIRST_NAME].dirty) &&
            (this.policyHolderLastName !== this.nameControl[this.LAST_NAME].value ||
                this.policyHolderFirstName !== this.nameControl[this.FIRST_NAME].value)
        ) {
            this.isSupportiveDocumentsRequired = false;
            this.isShowTooltip = true;
            this.clearOrSetValidator(this.DOCUMENT_IDS, "set");
            this.formControl[this.REASON_FOR_CHANGE].patchValue(ReasonForChange.REQUEST);
        } else {
            this.isSupportiveDocumentsRequired = false;
            this.isShowTooltip = false;
            this.clearOrSetValidator(this.DOCUMENT_IDS, "clear");
            this.formControl[this.REASON_FOR_CHANGE].patchValue(null);
        }
    }

    /**
     * Reset form
     */
    resetForm(): void {
        this.changeNameForm.reset();
        this.clearOrSetValidator("documentIds", "clear");
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
     * This method will unsubscribe all the api subscriptions.
     */
    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
