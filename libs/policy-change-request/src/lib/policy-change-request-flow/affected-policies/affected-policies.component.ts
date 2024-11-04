import { SetAffectedPoliciesDetails, SetFindPolicyHolderDetails, SetRequestPolicyChanges, StaticUtilService } from "@empowered/ngxs-store";
import { UserService } from "@empowered/user";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Store, Select } from "@ngxs/store";
import { SideNavService } from "../side-nav/services/side-nav.service";
import { DatePipe } from "@angular/common";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { PolicyChangeRequestService, FindPolicyholderModel, MemberService, PolicyTransactionForms } from "@empowered/api";

import { Subject, Observable, Subscription, of } from "rxjs";
import { SetMemeberInfo } from "@empowered/ngxs-store";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { PolicyChangeRequestComponent } from "../../policy-change-request.component";
import { NgxMaskPipe } from "ngx-mask";
import { switchMap, tap, pluck, distinctUntilChanged, catchError } from "rxjs/operators";
import { RouterState } from "@ngxs/router-plugin";
import { Router } from "@angular/router";
import { ClientErrorResponseCode, ConfigName, DateFormats, AppSettings, ClientErrorResponseType, ContactType } from "@empowered/constants";
import { AccountInfoState, EnrollmentMethodState, SharedState } from "@empowered/ngxs-store";
import { PolicyChangeRequestCancelPopupComponent } from "@empowered/ui";

@Component({
    selector: "empowered-affected-policies",
    templateUrl: "./affected-policies.component.html",
    styleUrls: ["./affected-policies.component.scss"],
    providers: [DatePipe],
})
export class AffectedPoliciesComponent implements OnInit, OnDestroy {
    subscriptions: Subscription[] = [];
    @Select(SharedState.regex) regex$: Observable<any>;
    affectedPoliciesForm: FormGroup;
    private unsubscribe$ = new Subject<void>();
    maxDate = new Date();
    searchPolicyResponse: FindPolicyholderModel;

    errorMessage: string;
    errorMessageArray = [];
    ERROR = "error";
    showErrorMessage: boolean;
    memberId: number;
    mpGroup: number;
    policies = [];
    MemberInfo: any;
    showSpinner: boolean;
    validationRegex: any;
    DETAILS = "details";
    maxlength = 8;
    languageStrings: Record<string, string> = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.errorMessageOnNextClick",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.changeAffectPolicy",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.noPolicy",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.importPolicy",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.firstName",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.lastName",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.birthDate",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.policyNumber",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.requiredField",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.allowedEntry",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.policyNotFound",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.import",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.cancel",
        "primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.next",
        "primary.portal.common.optional",
    ]);
    noPolicyError = true;
    affectedPoliciesControls: any;
    showErrorMessageEmptyPolicy: boolean;
    errorMessageOnNextClick: string;
    policyHolderName: string;
    pcrForm = {};
    policyNumber: string;

    @Select(RouterState) router$!: Observable<any>;
    mpGroupId$: Observable<string> = this.router$.pipe(pluck("state", "params", "mpGroupId"), distinctUntilChanged());
    memberId$: Observable<string> = this.router$.pipe(pluck("state", "params", "memberId"), distinctUntilChanged());
    routeMpGroup: string;
    routeMemberId: string;
    isTransferToDirectEnabled = false;
    isTransferToPayrollEnabled = false;
    isRemoveDependentForDirectEnabled = false;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly store: Store,
        private readonly sideNavService: SideNavService,
        private readonly datePipe: DatePipe,
        private readonly langService: LanguageService,
        private readonly policyChangeRequestService: PolicyChangeRequestService,
        private readonly memberService: MemberService,
        private readonly staticUtilService: StaticUtilService,
        private readonly router: Router,
        private readonly user: UserService,
        private readonly dialog: MatDialog,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
        public cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private readonly maskPipe: NgxMaskPipe,
    ) {
        this.subscriptions.push(this.mpGroupId$.subscribe((groupId) => (this.routeMpGroup = groupId)));
        this.subscriptions.push(this.memberId$.subscribe((memberId) => (this.routeMemberId = memberId)));
        this.subscriptions.push(
            this.staticUtilService
                .cacheConfigEnabled("general.pcr.transfer_to_payroll_union_association_billing.option_show")
                .subscribe((enabled) => (this.isTransferToPayrollEnabled = enabled)),
        );
        this.subscriptions.push(
            this.staticUtilService
                .cacheConfigEnabled("general.pcr.transfer_to_direct_billing.option_show")
                .subscribe((enabled) => (this.isTransferToDirectEnabled = enabled)),
        );
        this.subscriptions.push(
            this.staticUtilService
                .cacheConfigEnabled(ConfigName.PCR_DIRECT_REMOVE_DEPENDENT)
                .subscribe((enabled) => (this.isRemoveDependentForDirectEnabled = this.router.url.indexOf("direct") === -1 || enabled)),
        );
    }
    /**
     * Life cycle hook for AffectedPoliciesComponent
     * Getting values from store and route path
     */
    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        if (this.router.url.indexOf("direct") > -1 && this.routeMpGroup) {
            this.mpGroup = +this.routeMpGroup;
        } else if (this.store.selectSnapshot(AccountInfoState).mpGroupId) {
            this.mpGroup = this.store.selectSnapshot(AccountInfoState).mpGroupId;
        }
        this.MemberInfo = this.store.selectSnapshot(EnrollmentMethodState.getMemberInfo);
        if (this.MemberInfo) {
            this.memberId = this.MemberInfo.id;
        }
        if (!this.memberId && this.routeMemberId) {
            this.memberId = +this.routeMemberId;
        }
        this.subscriptions.push(
            this.user.credential$.subscribe((credential) => {
                if ("memberId" in credential && !this.memberId && !this.mpGroup) {
                    this.memberId = credential.memberId;
                    this.mpGroup = credential.groupId;
                }
            }),
        );

        this.sideNavService.stepClicked$.next(0);
        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                }
            }),
        );
        this.createFormControl();
        this.getPolicyDetails();
    }

    /**
     * Get member policy change request details
     * Initialize pcr form and set value in store
     */
    getPolicyDetails(): void {
        if (this.mpGroup) {
            this.showSpinner = true;
            this.subscriptions.push(
                this.memberService
                    .getMember(this.memberId, false, this.mpGroup.toString())
                    .pipe(
                        tap((resp) => {
                            this.showSpinner = false;
                            if (resp && resp.body) {
                                this.affectedPoliciesForm.controls["firstName"].setValue(resp.body.name.firstName);
                                this.affectedPoliciesForm.controls["lastName"].setValue(resp.body.name.lastName);
                                this.affectedPoliciesForm.controls["birthDate"].setValue(resp.body.birthDate);
                                this.affectedPoliciesForm.controls["firstName"].disable();
                                this.affectedPoliciesForm.controls["lastName"].disable();
                                this.affectedPoliciesForm.controls["birthDate"].disable();
                                this.policyHolderName = `${this.getTitleCaseResponse(resp.body.name.firstName)} ${this.getTitleCaseResponse(
                                    resp.body.name.lastName,
                                )}`;
                                this.pcrForm["firstName"] = this.affectedPoliciesForm.controls["firstName"].value;
                                this.pcrForm["lastName"] = this.affectedPoliciesForm.controls["lastName"].value;
                                this.pcrForm["birthDate"] = this.datePipe.transform(
                                    this.affectedPoliciesForm.controls["birthDate"].value,
                                    AppSettings.DATE_FORMAT,
                                );
                            }
                            this.showSpinner = true;
                        }),
                        switchMap((_) =>
                            this.memberService.getMemberContact(this.memberId, ContactType.HOME, this.mpGroup.toString()).pipe(
                                switchMap((contact) => {
                                    if (contact && contact.body && contact.body.address) {
                                        this.pcrForm["zip"] = contact.body.address.zip.split("-")[0];
                                    }
                                    return this.policyChangeRequestService.searchPolicies(this.pcrForm);
                                }),
                                catchError((err) => {
                                    this.showSpinner = false;
                                    this.showErrorAlertMessage(err);
                                    return of(null);
                                }),
                            ),
                        ),
                        catchError(() => {
                            this.showSpinner = false;
                            return of(null);
                        }),
                    )
                    .subscribe(
                        (response) => {
                            this.policies = response.policies;
                            if (!this.policies.length) {
                                this.noPolicyError = false;
                            }
                            this.store.dispatch(new SetMemeberInfo(this.policies));
                            this.showSpinner = false;
                        },
                        (error) => {
                            this.showSpinner = false;
                            this.showErrorAlertMessage(error);
                            this.noPolicyError = false;
                        },
                    ),
            );
        }
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }
    createFormControl(): void {
        this.affectedPoliciesForm = this.formBuilder.group(
            {
                firstName: this.formBuilder.control(""),
                lastName: this.formBuilder.control(""),
                birthDate: this.formBuilder.control({ disabled: true }),
                policyNumber: this.formBuilder.control("", {
                    validators: [Validators.required, Validators.pattern(new RegExp(this.validationRegex.ALPHANUMERIC))],
                }),
            },
            { updateOn: "blur" },
        );
        this.affectedPoliciesControls = this.affectedPoliciesForm.controls;
    }

    getTitleCaseResponse(value: string): string {
        return `${value.substring(0, 1).toUpperCase()}${value.substring(1, value.length).toLowerCase()}`;
    }

    onNext(): void {
        this.validateAllFormFields(this.affectedPoliciesForm);
        this.sideNavService.setPolicyHolderName(this.policyHolderName);
        if (this.affectedPoliciesForm.valid && this.policies.length > 0) {
            this.showErrorMessageEmptyPolicy = false;
            this.nextStep();
        }
        if (this.affectedPoliciesForm.valid) {
            this.errorMessageOnNextClick =
                this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.affectedPolicies.errorMessageOnNextClick"];
            this.showErrorMessageEmptyPolicy = true;
        }
    }
    nextStep(): void {
        if (this.policies.length > 0) {
            const affectedPolicies = {
                policyNumber: this.policyNumber,
                policies: this.policies,
            };
            this.store.dispatch(new SetAffectedPoliciesDetails(affectedPolicies));
            this.sideNavService.defaultStepPositionChanged$.next(2);
        }
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
     * Search policy api called on form submit
     * @param form : AffectedPoliciesForm values
     * @param valid : flag to check if form is valid
     */
    onSubmit(form: any, valid: boolean): void {
        this.validateAllFormFields(this.affectedPoliciesForm);
        this.store.dispatch(new SetFindPolicyHolderDetails(this.affectedPoliciesForm.value));
        if (valid) {
            const form1 = {
                firstName: this.affectedPoliciesForm.controls.firstName.value,
                lastName: this.affectedPoliciesForm.controls.lastName.value,
                birthDate: this.datePipe.transform(this.affectedPoliciesForm.controls.birthDate.value, DateFormats.YEAR_MONTH_DAY),
                policyNumber: form.policyNumber,
            };
            form = form1;
            this.policyNumber = form.policyNumber;
            this.showSpinner = true;
            this.subscriptions.push(
                this.policyChangeRequestService.searchPolicies(form).subscribe(
                    (response) => {
                        this.showErrorMessage = false;
                        this.showSpinner = false;
                        if ((Object.keys(response).length === 0 && response.constructor === Object) || response.policies.length === 0) {
                            this.showNoResponseMessage(true);
                        } else {
                            if (!this.isTransferToDirectEnabled || !this.isTransferToPayrollEnabled) {
                                response.allowedForms = response.allowedForms.filter(
                                    (allowedForm) =>
                                        (PolicyTransactionForms[allowedForm] !== PolicyTransactionForms.BILLING_MODE_CHANGE ||
                                            this.isTransferToPayrollEnabled) &&
                                        (PolicyTransactionForms[allowedForm] !== PolicyTransactionForms.TRANSFER_TO_DIRECT ||
                                            this.isTransferToDirectEnabled),
                                );
                            }
                            if (!this.isRemoveDependentForDirectEnabled) {
                                response.allowedForms = response.allowedForms.filter(
                                    (allowedForm) => PolicyTransactionForms[allowedForm] !== PolicyTransactionForms.DELETION,
                                );
                            }
                            this.searchPolicyResponse = response;
                            this.policies = [...this.policies, ...response.policies];
                            const flags = {};
                            this.policies = this.policies.filter((policy) => {
                                if (flags[policy.policyNumber]) {
                                    return false;
                                }
                                flags[policy.policyNumber] = true;
                                return true;
                            });
                            this.noPolicyError = this.policies.length > 0;
                            this.showNoResponseMessage(false);
                            this.showErrorMessageEmptyPolicy = false;
                            this.searchPolicyResponse.groupId = this.mpGroup;
                            this.searchPolicyResponse.memberId = this.memberId;
                            this.store.dispatch(new SetMemeberInfo(this.policies));
                            this.store.dispatch(new SetMemeberInfo(this.searchPolicyResponse));
                            this.affectedPoliciesForm.get("policyNumber").setErrors(null);
                        }
                    },
                    (err) => {
                        this.showSpinner = false;
                        this.showErrorMessageEmptyPolicy = false;
                        this.showErrorAlertMessage(err);
                    },
                ),
            );
        }
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
                if (response === "cancel") {
                    this.store.dispatch(new SetRequestPolicyChanges(null));
                    this.store.dispatch(new SetAffectedPoliciesDetails(null));
                    this.PCRDialogRef.close("close");
                }
            }),
        );
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS] && error[this.DETAILS].length > 0) {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else if (error.status === ClientErrorResponseCode.RESP_409 && error.code === ClientErrorResponseType.INVALID_STATE) {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue("secondary.portal.applicationFlow.conversion.policyNotFound");
        } else {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }

    showNoResponseMessage(noPolicyFound: boolean): void {
        if (noPolicyFound) {
            this.affectedPoliciesForm.controls["policyNumber"].setErrors({
                noPolicyFound: noPolicyFound,
            });
        } else {
            this.affectedPoliciesForm.controls["policyNumber"].setErrors(null);
        }
    }
    // This method will unsubscribe all the api subscription.
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
