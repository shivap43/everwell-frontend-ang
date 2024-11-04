import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup, FormBuilder, Validators, AbstractControl } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { StaticService, PolicyTransactionForms } from "@empowered/api";
import { Subscription, Observable } from "rxjs";
import { PolicyChangeRequestList, AppSettings, ChangeTheGenderOf, DocumentsToChangeGender } from "@empowered/constants";
import { PolicyChangeRequestState, SetGenderChangeRequest } from "@empowered/ngxs-store";
import { Select, Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { SideNavService } from "./../../side-nav/services/side-nav.service";
import { NgxMaskPipe } from "ngx-mask";
import { PolicyChangeRequestComponent } from "../../../policy-change-request.component";
import { PolicyChangeRequestCancelPopupComponent, PolicyChangeRequestConfirmationPopupComponent } from "@empowered/ui";

@Component({
    selector: "empowered-change-gender",
    templateUrl: "./change-gender.component.html",
    styleUrls: ["./change-gender.component.scss"],
    providers: [DatePipe],
})
export class ChangeGenderComponent implements OnInit, OnDestroy {
    changeGenderForm: FormGroup;
    changeGenderControls: any;
    genders: any[];
    documentationList = this.convertEnumToKeyValuePair(DocumentsToChangeGender);
    changeGenderOfList = Object.values(ChangeTheGenderOf);
    isChangeGenderRequired: boolean;
    isDocumentRequired: boolean;
    subscriptions: Subscription[] = [];
    isSupportiveDocumentsRequired: boolean;
    acceptableFormats = "png, jpeg, jpg or pdf";
    selectedDoc: any;
    mpGroup: any;
    memberId: any;
    cifNumber: any;
    isSubmitted: boolean;
    maxDate: string;
    genderChangeRequestInitialData: any;
    documentIds = [];
    selectedDocument: any;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.changeGender.header",
        "primary.portal.policyChangeRequest.transactions.continue",
        "primary.portal.policyChangeRequest.transactions.cancel",
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.policyChangeRequest.transactions.back",
        "primary.portal.policyChangeRequest.transactions.changeGender.docsToProvide",
        "primary.portal.dashboard.policyChangeRequestFlow.nextStep",
        "primary.portal.policyChangeRequest.transactions.changeGender.header",
        "primary.portal.policyChangeRequest.transactions.changeGender.description",
        "primary.portal.policyChangeRequest.transactions.changeGender.changeGenderOf",
        "primary.portal.policyChangeRequest.transactions.requiredField",
        "primary.portal.policyChangeRequest.transactions.changeGender.genderRequested",
        "primary.portal.policyChangeRequest.transactions.selectionRequired",
        "primary.portal.policyChangeRequest.transactions.changeGender.effectiveDate",
        "primary.portal.policyChangeRequest.transactions.requiredField",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.invalidFutureDate",
        "primary.portal.policyChangeRequest.transactions.changeGender.docsToProvide",
        "primary.portal.policyChangeRequest.transactions.changeName.validationError.supportiveDocsRequired",
        "primary.portal.policyChangeRequest.transactions.selectionRequired",
        "primary.portal.common.cancel",
        "primary.portal.common.next",
        "primary.portal.common.back",
    ]);

    @Select(PolicyChangeRequestState.GetmemberInfo) memberInfo$: Observable<any>;
    @Select(PolicyChangeRequestState.GetChangeGenderRequest) genderRequest$: Observable<any>;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly staticService: StaticService,
        private readonly store: Store,
        private readonly languageService: LanguageService,
        private readonly dialog: MatDialog,
        private readonly datePipe: DatePipe,
        private readonly sideNavService: SideNavService,
        private readonly maskPipe: NgxMaskPipe,
        private cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
    ) {}

    ngOnInit(): void {
        this.changeGenderOfList = this.convertEnumToKeyValuePair(ChangeTheGenderOf);
        this.maxDate = this.datePipe.transform(new Date(), AppSettings.DATE_FORMAT);
        this.getRequestedgender();
        this.subscriptions.push(
            this.memberInfo$.subscribe((memberInfo) => {
                if (memberInfo) {
                    this.mpGroup = memberInfo.groupId;
                    this.memberId = memberInfo.memberId;
                    this.cifNumber = memberInfo.cifNumber;
                }
            }),
        );

        this.createFormControl();
        this.genderChangeRequestInitialData = { ...this.changeGenderForm.value };
        this.subscriptions.push(
            this.genderRequest$.subscribe((genderRequest) => {
                if (genderRequest) {
                    this.selectedDocument = genderRequest.documentationType;
                    this.documentIds = genderRequest.documentIds;
                    this.changeGenderForm.patchValue(genderRequest);
                    this.genderChangeRequestInitialData = {
                        ...this.store.selectSnapshot(PolicyChangeRequestState.GetChangeGenderInitialData),
                    };
                }
            }),
        );
    }

    convertEnumToKeyValuePair(data: any): any {
        return Object.keys(data).map((key) => ({ id: key, name: data[key] }));
    }
    /**
     * Create form controls
     */
    createFormControl(): void {
        this.changeGenderForm = this.formBuilder.group(
            {
                changeFor: ["", Validators.required],
                gender: ["", Validators.required],
                genderChangeDate: ["", Validators.required],
                documentationType: ["", Validators.required],
                documentIds: [[]],
                type: [Object.keys(PolicyTransactionForms)[11]],
            },
            { updateOn: "blur" },
        );
        this.changeGenderControls = this.changeGenderForm.controls;
    }

    /**
     * Get form control
     */
    get formControl(): {
        [key: string]: AbstractControl;
    } {
        return this.changeGenderForm.controls;
    }

    /**
     * Fetch genders
     */
    getRequestedgender(): void {
        this.subscriptions.push(
            this.staticService.getGenders().subscribe((value) => {
                this.genders = value.filter((element) => element !== AppSettings.UNKNOWN);
                this.genders = this.genders.map((gender) => ({
                    id: gender,
                    name: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(),
                }));
            }),
        );
    }

    /**
     * Get form controls
     */
    get genderFormControls(): {
        [key: string]: AbstractControl;
    } {
        return this.changeGenderForm.controls;
    }
    /**
     * On change of firstname make supportive documents required and
     * set reason for change to other
     */
    setValidationOnDocumentSelection(): void {
        this.isSupportiveDocumentsRequired = false;
        this.clearOrSetValidator("documentIds", "set");
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

    validateDocuments(): void {
        this.isChangeGenderRequired = this.formControl["changeFor"].invalid ? true : false;
        this.isDocumentRequired = this.formControl["documentationType"].invalid ? true : false;
        if (this.changeGenderForm.value["documentIds"].length === 0) {
            this.isSupportiveDocumentsRequired = true;
            this.clearOrSetValidator("documentIds", "set");
        } else {
            this.clearOrSetValidator("documentIds", "clear");
            this.isSupportiveDocumentsRequired = false;
            this.changeGenderForm.value["documentIds"] = this.documentIds;
        }
    }

    storeRequestData(): void {
        if (this.changeGenderForm.valid && !this.isSupportiveDocumentsRequired) {
            this.changeGenderForm.value["genderChangeDate"] = this.datePipe.transform(
                this.changeGenderForm.value["genderChangeDate"],
                AppSettings.DATE_FORMAT,
            );
            this.store.dispatch(new SetGenderChangeRequest(this.changeGenderForm.value, this.genderChangeRequestInitialData));
            this.sideNavService.onNextClick(1);
        }
    }

    getDocumentId(documentID: number): void {
        if (documentID) {
            this.clearOrSetValidator("documentIds", "clear");
            this.documentIds.push(documentID);
            this.isSupportiveDocumentsRequired = false;
        } else {
            this.clearOrSetValidator("documentIds", "set");
            this.isSupportiveDocumentsRequired = false;
            this.formControl["documentIds"].patchValue(null);
            this.documentIds = [];
        }
    }
    /**
     * Submit gender policy change request
     */
    submitChangeGenderRequest(): void {
        this.changeGenderForm.value["documentIds"] = this.documentIds;
        this.validateDocuments();
        if (!this.changeGenderForm.dirty && !this.store.selectSnapshot(PolicyChangeRequestState.GetChangeGenderRequest)) {
            this.openConfirmationPopup();
        } else {
            this.isSubmitted = true;
            this.validateAllFormFields(this.changeGenderForm);
            this.storeRequestData();
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
     * Show request confirmation popup
     */
    openConfirmationPopup(): void {
        const dialogRef = this.dialog.open(PolicyChangeRequestConfirmationPopupComponent, {
            width: "667px",
            data: {
                cancelButton: this.languageStrings["primary.portal.policyChangeRequest.transactions.cancel"],
                continueButton: this.languageStrings["primary.portal.policyChangeRequest.transactions.continue"],
                requestType: this.languageStrings["primary.portal.policyChangeRequest.transactions.changeGender.header"],
                cancelModalDisplayType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.nextStep"],
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
     * Show upload document
     * @param index
     */
    showUploadDocument(index: number, item: string): void {
        this.selectedDocument = item;
        this.documentIds = [];
        this.selectedDoc = index;
        this.isSupportiveDocumentsRequired = false;
        this.formControl["documentIds"].patchValue(null);
        this.clearOrSetValidator("documentIds", "set");
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
                    this.store.dispatch(new SetGenderChangeRequest(null, null));
                    this.PCRDialogRef.close(PolicyChangeRequestList.cancel);
                }
            }),
        );
    }

    back(): void {
        this.sideNavService.onBackClick();
    }
    /**
     * This method will unsubscribe all the api subscription.
     */
    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }
    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
