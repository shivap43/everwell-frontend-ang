import { SharedState, RegexDataType } from "@empowered/ngxs-store";
import { Observable, Subscription, BehaviorSubject, Subject } from "rxjs";
import { Component, OnInit, Inject, Optional, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, FormBuilder, Validators, AbstractControl } from "@angular/forms";
import { map, takeUntil, tap } from "rxjs/operators";
import { Store, Select } from "@ngxs/store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import {
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    SharePlanDocuments,
    ToastType,
    PlanDetailDialogData,
} from "@empowered/constants";
import { OpenToast, ToastModel } from "../toast";
import { EmailPlanDocuments, PlanDocument, ShoppingService, StaticService } from "@empowered/api";

/**
 *@description Data model for share plan resource model.
 */
export interface SharePlanResourceDialogData {
    planDetails: PlanDetailDialogData;
    planDocuments: PlanDocument[];
}

@Component({
    selector: "empowered-share-plan-resource",
    templateUrl: "./share-plan-resource.component.html",
    styleUrls: ["./share-plan-resource.component.scss"],
})
export class SharePlanResourceComponent implements OnInit, OnDestroy {
    isSpinnerLoading: boolean;
    emailPlanDocumentDetail = {} as EmailPlanDocuments;
    sharePlanDocumentsForm: FormGroup;
    displayedColumns: string[] = ["checkbox", "name", "fileType"];
    dataSource: PlanDocument[] = this.data.planDocuments;
    private readonly selectedPlanDocumentsObs$ = new BehaviorSubject<number[]>([]);
    subscriptions: Subscription[] = [];
    selectionError = false;
    message: string;
    toastType: ToastType;
    showErrorMessage: boolean;
    errorMsg: string;
    validationRegex: RegexDataType;
    restrictedEmailsConfigApi: string[];
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    languageStringArray = this.language.fetchPrimaryLanguageValues([
        "primary.portal.sharePlanDoc.sendResources",
        "primary.portal.sharePlanDoc.resourceMustBeSelected",
        "primary.portal.sharePlanDoc.selectResourceToSend",
        "primary.portal.sharePlanDoc.sharePlanResources",
        "primary.portal.sharePlanDoc.resourcesSentTo",
        "primary.portal.common.restrictedEmailFormat",
        "primary.portal.common.emailAddress",
        "primary.portal.common.back",
        "primary.portal.common.requiredField",
        "primary.portal.common.invalidEmailFormat",
    ]);
    private readonly unsubscribe$ = new Subject<void>();
    constructor(
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly sharePlanDocumentsDialogRef: MatDialogRef<SharePlanResourceComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: SharePlanResourceDialogData,
        private readonly shoppingService: ShoppingService,
        private readonly store: Store,
        private readonly staticService: StaticService,
    ) {
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((regex) => {
            if (regex) {
                this.validationRegex = regex;
            }
        });
    }
    /**
     *@description create form group
     */
    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.staticService
            .getConfigurations("general.email.restriction.list")
            .pipe(
                tap((res) => {
                    this.restrictedEmailsConfigApi = res[0].value.split(",");
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.selectPlanDocuments();
        this.sharePlanDocumentsForm = this.fb.group({
            email: ["", [Validators.required, Validators.pattern(new RegExp(this.validationRegex.EMAIL))]],
        });
    }

    /**
     *@description function to close share plan resources model
     *@param clickedButton button type of back to plan details or send document(s)
     */
    closeDialog(clickedButton?: string): void {
        this.sharePlanDocumentsDialogRef.close(clickedButton);
    }
    /**
     *@description Close share plan resources model and send user back to plan details model.
     */
    backToPlanDetails(): void {
        this.closeDialog(SharePlanDocuments.BACK_TO_PLAN_DETAILS);
    }
    /**
     *@description Updating the data source per selection of checkbox.
     *@param planDocument selected plan document
     */
    onCheckBoxClick(planDocument: PlanDocument): void {
        planDocument.selected = !planDocument.selected;
        this.selectPlanDocuments();
    }
    /**
     *@description filtering the data source based on checkbox selected flag and passing filter data to behavior subject.
     */
    selectPlanDocuments(): void {
        if (this.dataSource) {
            this.selectedPlanDocumentsObs$.next(
                this.dataSource
                    .filter((planDocument: PlanDocument) => planDocument.selected === true)
                    .map((selectedPlanDocuments: PlanDocument) => selectedPlanDocuments.id),
            );
        }
        this.selectedPlanDocumentsObs$
            .pipe(
                map((res) => {
                    this.emailPlanDocumentDetail["planDocumentIds"] = res;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     *@description validating email field and checkbox selection.
     * Making service call with appropriate payload on send resource button click.
     */
    sendPlanDocuments(): void {
        this.isSpinnerLoading = true;
        this.selectionError = false;
        this.showErrorMessage = false;
        if (this.emailPlanDocumentDetail.planDocumentIds.length <= 0) {
            this.selectionError = true;
            this.isSharePlanDocumentsForm();
            this.isSpinnerLoading = false;
            return;
        }
        if (this.isSharePlanDocumentsForm()) {
            this.isSpinnerLoading = false;
            return;
        }
        this.emailPlanDocumentDetail.email = this.sharePlanDocumentsForm.controls.email.value;
        this.emailPlanDocumentDetail.state = this.data.planDetails.states[0].abbreviation;
        this.emailPlanDocumentDetail.planId = +this.data.planDetails.planId;

        this.shoppingService
            .emailPlanDocuments(this.data.planDetails.planOfferingId, this.emailPlanDocumentDetail, this.data.planDetails.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.isSpinnerLoading = false;
                    this.closeDialog(SharePlanDocuments.SEND_RESOURCES);
                    this.message = this.languageStringArray["primary.portal.sharePlanDoc.resourcesSentTo"].replace(
                        "#emailAddress",
                        this.emailPlanDocumentDetail.email,
                    );
                    this.toastType = ToastType.SUCCESS;
                    this.openToast(this.message, this.toastType);
                },
                (errorResp) => {
                    this.isSpinnerLoading = false;
                    this.showErrorMessage = true;
                    if (errorResp.status === ClientErrorResponseCode.RESP_409) {
                        this.errorMsg = this.language.fetchSecondaryLanguageValue(
                            `secondary.portal.plan.resource.email.${errorResp.error.status}.${errorResp.error.code}`,
                        );
                    } else if (errorResp.status === ServerErrorResponseCode.RESP_504) {
                        this.errorMsg = this.language.fetchSecondaryLanguageValue("secondary.api.504.gatewayTimeout");
                    } else {
                        this.errorMsg = this.language.fetchSecondaryLanguageValue(
                            `secondary.api.${errorResp.error.status}.${errorResp.error.code}`,
                        );
                    }
                },
            );
    }
    /**
     *@description Initializes value for Toast Model and opens the toast component.
     * @param message content for toast component
     * @param type type of toast to display is set based on this value
     */
    openToast(message: string, type: ToastType): void {
        const toastData: ToastModel = {
            message: message,
            toastType: type,
        };
        this.store.dispatch(new OpenToast(toastData));
    }
    /**
     *@description Check validation for sharePlanDocumentsForm on send button click
     *@returns form is valid or not (Boolean)
     */
    isSharePlanDocumentsForm(): boolean {
        if (this.sharePlanDocumentsForm.controls.email.invalid) {
            Object.keys(this.sharePlanDocumentsForm.controls).forEach((ele) => {
                const control = this.sharePlanDocumentsForm.get(ele);
                control.markAsTouched({ onlySelf: true });
            });
        }
        return this.sharePlanDocumentsForm.invalid;
    }

    /**
     *@description Will check entered email is restricted or not.
     *@param control The current value of the form control(email).
     */
    checkForRestrictedEmail(control: AbstractControl): void {
        const value = control.value;
        if (this.restrictedEmailsConfigApi.includes(value)) {
            control.setErrors({ restrictedEmail: true });
        }
    }

    /**
     *@description Unsubscribe the subscriptions to avoid memory leaks
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     *@description get selected plan documents ids from data source
     *@returns selected plan documents ids
     */
    getSelectedPlanDocuments(): Observable<number[]> {
        return this.selectedPlanDocumentsObs$.asObservable();
    }
}
