import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { SideNavService } from "./../../side-nav/services/side-nav.service";
import { LanguageService } from "@empowered/language";
import { Store, Select } from "@ngxs/store";
import { SetOccupationalClassChangeRequest, PolicyChangeRequestState, SharedState } from "@empowered/ngxs-store";
import { PolicyTransactionForms } from "@empowered/api";
import { Observable, Subscription } from "rxjs";
import { PolicyChangeRequestComponent } from "../../../policy-change-request.component";
import {
    JOB_DESCRIPTION_MAX_LENGTH,
    JOB_FIELD_MAX_LENGTH,
    JOB_TITLE_MAX_LENGTH,
    PolicyChangeRequestList,
    AppSettings,
    UpdatedClass,
} from "@empowered/constants";
import { PolicyChangeRequestCancelPopupComponent, PolicyChangeRequestConfirmationPopupComponent } from "@empowered/ui";

@Component({
    selector: "empowered-change-occupational-class",
    templateUrl: "./change-occupational-class.component.html",
    styleUrls: ["./change-occupational-class.component.scss"],
})
export class ChangeOccupationalClassComponent implements OnInit, OnDestroy {
    changeOccupationForm: FormGroup;
    occupationalClassChangeRequestInitialData: any;
    subscriptions: Subscription[] = [];
    validationRegex: any;
    updatedCLassList = Object.values(UpdatedClass);
    max_length = JOB_FIELD_MAX_LENGTH;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.changeOccupation.header",
        "primary.portal.policyChangeRequest.transactions.continue",
        "primary.portal.policyChangeRequest.transactions.cancel",
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.policyChangeRequest.transactions.back",
        "primary.portal.policyChangeRequest.transactions.changeOccupation.description",
        "primary.portal.policyChangeRequest.transactions..changeOccupation.industryType",
        "primary.portal.policyChangeRequest.transactions..changeOccupation.jobTitle",
        "primary.portal.policyChangeRequest.transactions..changeOccupation.jobDuties",
        "primary.portal.common.next",
    ]);
    @Select(PolicyChangeRequestState.GetChangeOccupationalClassRequest)
    changeOccupationalClassRequest$: Observable<any>;
    @Select(SharedState.regex) regex$: Observable<any>;

    constructor(
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        private readonly sideNavService: SideNavService,
        private readonly languageService: LanguageService,
        private readonly store: Store,
        private cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
    ) {
        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                }
            }),
        );
    }

    /**
     * Initializes form and other necessary variables and subscriptions
     */
    ngOnInit(): void {
        this.changeOccupationForm = this.fb.group(
            {
                updatedClass: ["", Validators.compose([Validators.required])],
                industryType: [
                    "",
                    Validators.compose([
                        Validators.required,
                        Validators.maxLength(100),
                        Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_ALLOWED)),
                    ]),
                ],
                jobTitle: [
                    "",
                    Validators.compose([
                        Validators.required,
                        Validators.maxLength(JOB_TITLE_MAX_LENGTH),
                        Validators.pattern(this.validationRegex.JOB_TITLE),
                    ]),
                ],
                jobDuties: [
                    "",
                    Validators.compose([
                        Validators.required,
                        Validators.maxLength(JOB_DESCRIPTION_MAX_LENGTH),
                        Validators.pattern(this.validationRegex.JOB_DESCRIPTION),
                    ]),
                ],
                type: [Object.keys(PolicyTransactionForms)[6]],
            },
            { updateOn: "blur" },
        );
        this.occupationalClassChangeRequestInitialData = { ...this.changeOccupationForm.value };
        this.subscriptions.push(
            this.changeOccupationalClassRequest$.subscribe((changeOccupationalClassRequest) => {
                if (changeOccupationalClassRequest) {
                    this.changeOccupationForm.patchValue(changeOccupationalClassRequest);
                    this.occupationalClassChangeRequestInitialData = {
                        ...this.store.selectSnapshot(PolicyChangeRequestState.GetChangeOccupationalClassInitialData),
                    };
                }
            }),
        );
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
                    this.store.dispatch(new SetOccupationalClassChangeRequest(null, null));
                    this.PCRDialogRef.close(PolicyChangeRequestList.cancel);
                }
            }),
        );
    }

    back(): void {
        this.sideNavService.onBackClick();
    }
    /**
     * Get form control
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    get formControl(): object {
        return this.changeOccupationForm.controls;
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
                requestType: this.languageStrings["primary.portal.policyChangeRequest.transactions.changeOccupation.header"],
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
     * Submit change occupation class request
     */
    submitChangeOccupationClassRequest(): void {
        if (!this.changeOccupationForm.dirty && !this.store.selectSnapshot(PolicyChangeRequestState.GetChangeOccupationalClassRequest)) {
            this.openConfirmationPopup();
        } else {
            this.validateAllFormFields(this.changeOccupationForm);
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

    storeRequestData(): void {
        if (this.changeOccupationForm.valid) {
            this.store.dispatch(
                new SetOccupationalClassChangeRequest(this.changeOccupationForm.value, this.occupationalClassChangeRequestInitialData),
            );
            this.sideNavService.onNextClick(1);
        }
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
