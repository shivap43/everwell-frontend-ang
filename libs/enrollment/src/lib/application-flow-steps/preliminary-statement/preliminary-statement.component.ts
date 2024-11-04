import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { AbstractControl, FormControl, Validators } from "@angular/forms";
import { ConfigName, CustomSection, StaticStep } from "@empowered/constants";
import { AppFlowService, EnrollmentState } from "@empowered/ngxs-store";
import { Select, Store } from "@ngxs/store";
import { Observable, Subscription } from "rxjs";
import { EmpoweredModalService } from "@empowered/common-services";
import { PaperCopyModalComponent } from "./paper-copy-modal/paper-copy-modal.component";
import { InputType, StaticService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { tap } from "rxjs/operators";
import { EnrollmentsActions, EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { NGRXStore } from "@empowered/ngrx-store";
import { select } from "@ngrx/store";
import { switchMap } from "rxjs/operators";

enum PreliminaryOptions {
    DIFFERENT_EMAIL = "differentEmail",
    PAPER_COPY = "paperCopy",
}
const EMAIL = "Email";
enum EmailValidations {
    EMAIL_MAX_LENGTH = 60,
}

@Component({
    selector: "empowered-preliminary-statement",
    templateUrl: "./preliminary-statement.component.html",
    styleUrls: ["./preliminary-statement.component.scss"],
})
export class PreliminaryStatementComponent implements OnInit, OnDestroy {
    @Input() preliminaryStatementSections: CustomSection[];
    @Input() planObject;
    @Input() cartIds: number[];
    preliminaryFormControl = new FormControl();
    differentEmail = new FormControl();
    staticStep = StaticStep;
    preliminaryStatementPlans: string[] = [];
    preliminaryEmailOptions: string[] = [];
    preliminaryOptions = PreliminaryOptions;
    subscriptions: Subscription[] = [];
    noEmailProvided: string = this.language.fetchPrimaryLanguageValue(
        "primary.portal.applicationFlow.preliminaryStatement.noEmail.provided.message",
    );
    memberId$ = this.store.select(EnrollmentState.GetMemberId);
    mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
    preliminaryFormPaths: string[] = [];
    emailNotification = "";
    emailValidations = EmailValidations;
    loadSpinner = false;
    restrictedEmailsConfig: string[] = [];
    selectedMemberContacts$ = this.store.select(EnrollmentState.GetMemberData);

    constructor(
        private readonly appFlowService: AppFlowService,
        private readonly store: Store,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly language: LanguageService,
        private readonly ngrxStore: NGRXStore,
        private readonly staticService: StaticService,
    ) {}

    /**
     * validates differentEmail input field and fetches plans and employee emails on initialization
     */
    ngOnInit(): void {
        this.differentEmail.addValidators([
            Validators.required,
            Validators.pattern(this.store.selectSnapshot((state) => state?.core?.regex)?.EMAIL),
            Validators.maxLength(this.emailValidations.EMAIL_MAX_LENGTH),
        ]);
        this.subscriptions.push(
            this.staticService
                .getConfigurations(ConfigName.EMAIL_RESTRICTION_LIST)
                .pipe(
                    tap((res) => {
                        this.restrictedEmailsConfig = res[0].value.split(",");
                    }),
                )
                .subscribe(),
        );
        const plansCount = new Map<string, number>();
        // pushes all plan names available in cart into preliminaryStatementPlans
        this.preliminaryStatementSections.forEach((section) => {
            let index1 = 0;
            let index2 = 0;
            index1 = section.steps[0].step[0].question.text.indexOf("<");
            const preliminaryStatement = section.steps[0].step[0].question.text.substring(0, index1 - 1);
            // count is appended to plan name when same plans are available in cart
            if (plansCount.has(preliminaryStatement)) {
                plansCount.set(preliminaryStatement, plansCount.get(preliminaryStatement) + 1);
            } else {
                plansCount.set(preliminaryStatement, 1);
            }
            this.preliminaryStatementPlans.push(
                plansCount.get(preliminaryStatement) > 1
                    ? `${preliminaryStatement} ${plansCount.get(preliminaryStatement)}`
                    : preliminaryStatement,
            );
            // indices to fetch the preliminary form path from the text
            index1 = section.steps[0].step[0].question.text.indexOf("\"");
            index2 = section.steps[0].step[0].question.text.indexOf(">");
            this.preliminaryFormPaths.push(section.steps[0].step[0].question.text.substring(index1 + 1, index2 - 1));
        });
        // gets all existing emails of an employee when input type is radio and text is 'Email' in question object
        this.preliminaryStatementSections?.[0]?.steps[0].step.forEach((stepResponse) => {
            if (stepResponse.question.inputType === InputType.RADIO) {
                stepResponse.question.options.every((option) => {
                    if (option.label) {
                        this.emailNotification = option.label;
                        return false;
                    }
                    return true;
                });
            }
            if (stepResponse.question.inputType === InputType.RADIO && stepResponse.question.text === EMAIL) {
                this.getEmployeeEmails();
            }
        });
        this.appFlowService.showNextProductFooter$.next({ nextClick: false, data: null });
    }

    /**
     * Gets all email ids associated with the employee selected for enrollment
     */
    getEmployeeEmails(): void {
        this.subscriptions.push(
            this.selectedMemberContacts$
                .pipe(
                    tap((memberContactDetails) => {
                        memberContactDetails?.contactInfo?.forEach((memberContactDetail) => {
                            // pushes all existing emails of member into preliminaryEmailOptions array
                            if (memberContactDetail.emailAddresses.length) {
                                memberContactDetail.emailAddresses.forEach((emailAddress) => {
                                    this.preliminaryEmailOptions.push(`${EMAIL} ${emailAddress.email}`);
                                });
                            }
                        });
                        // if member does not have any email id then preliminaryEmailOptions array contains 'no email provided' message
                        if (!this.preliminaryEmailOptions.length) {
                            this.preliminaryEmailOptions.push(this.noEmailProvided);
                        }
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * executes on click of next and directs to signature step
     */
    onNext(): void {
        this.appFlowService.emailPreliminaryForms$.next(false);
        this.appFlowService.hidePreliminaryStatementStepTPI$.next(true);
        // opens paper copy modal when radio input selected by user is provide paper copy
        if (this.preliminaryFormControl.value === this.preliminaryOptions.PAPER_COPY) {
            this.subscriptions.push(
                this.empoweredModalService
                    .openDialog(PaperCopyModalComponent, {
                        data: {
                            preliminaryFormPaths: this.preliminaryFormPaths,
                            memberId$: this.memberId$,
                            mpGroupId: this.mpGroup,
                            cartIds: this.cartIds,
                        },
                    })
                    .afterClosed()
                    .subscribe((routeToAppFlow) => {
                        if (routeToAppFlow) {
                            this.routeToAppFlow();
                        }
                    }),
            );
        } else if (this.preliminaryFormControl.value === this.preliminaryOptions.DIFFERENT_EMAIL && this.differentEmail.invalid) {
            this.differentEmail.markAsTouched();
            return;
        } else {
            this.emailPreliminaryForms(
                this.preliminaryFormControl.value === this.preliminaryOptions.DIFFERENT_EMAIL
                    ? this.differentEmail.value
                    : this.preliminaryFormControl.value.substring(this.preliminaryFormControl.value.indexOf(" ") + 1),
            );
        }
    }

    /**
     * Emails preliminary forms
     * @param employeeEmail id selected/provided
     */
    emailPreliminaryForms(employeeEmail: string): void {
        const preliminaryStatementForms = [];
        for (let i = 0; i < this.preliminaryFormPaths.length; i++) {
            preliminaryStatementForms.push({ preliminaryFormPath: this.preliminaryFormPaths[i], cartItemId: this.cartIds[i] });
        }
        this.subscriptions.push(
            this.memberId$
                .pipe(
                    tap((memberId) => {
                        this.loadSpinner = true;
                        // emailPreliminaryForms api is called
                        this.ngrxStore.dispatch(
                            EnrollmentsActions.emailPreliminaryForm({
                                memberId: memberId,
                                email: employeeEmail,
                                mpGroupId: this.mpGroup,
                                preliminaryForms: preliminaryStatementForms,
                            }),
                        );
                    }),
                    switchMap((memberId) =>
                        // gets the emailPreliminaryForms api response from the store
                        this.ngrxStore.onAsyncValue(
                            select(EnrollmentsSelectors.getEmailPreliminaryFormResponse(memberId, employeeEmail, this.mpGroup)),
                        ),
                    ),
                )
                .subscribe(() => {
                    this.loadSpinner = false;
                    this.appFlowService.emailPreliminaryForms$.next(true);
                    this.routeToAppFlow();
                }),
        );
    }

    /**
     * Routes to application flow step in enrollment
     */
    routeToAppFlow(): void {
        this.appFlowService.planChanged$.next({
            nextClicked: true,
            discard: false,
        });
        if (this.planObject?.reinstate) {
            this.appFlowService.reinstateLastCompleteStaticStep$.next(2);
        } else {
            const isEBSAccount = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
            if (isEBSAccount) {
                this.appFlowService.lastCompleteStaticStep.next(4);
            } else {
                this.appFlowService.lastCompleteStaticStep.next(3);
            }
        }
        this.appFlowService.showStaticStep.next(this.staticStep.ONE_SIGNATURE);
    }

    /**
     * Gets called on preliminary option radio button change to reset differentEmail input field
     */
    onPreliminaryOptionChange(): void {
        if (!(this.preliminaryFormControl.value === this.preliminaryOptions.DIFFERENT_EMAIL)) {
            this.differentEmail.reset();
        }
    }

    /**
     * downloadPreliminaryForm api is called on click of view form and form opens in new window
     * @param planName name of the plan in cart
     * @param isViewPreliminaryForm is true when view form is being clicked
     */
    viewPreliminaryForm(planName: string, isViewPreliminaryForm: boolean): void {
        const index = this.preliminaryStatementPlans.findIndex((preliminaryStatementPlan) => preliminaryStatementPlan === planName);
        this.subscriptions.push(
            this.memberId$
                .pipe(
                    tap((memberId) => {
                        // downloadPreliminaryForm api is called
                        this.ngrxStore.dispatch(
                            EnrollmentsActions.downloadPreliminaryForm({
                                memberId: memberId,
                                preliminaryFormPath: this.preliminaryFormPaths[index],
                                cartItemId: this.cartIds[index],
                                mpGroupId: this.mpGroup,
                            }),
                        );
                    }),
                    switchMap((memberId) =>
                        // gets the downloadPreliminaryForm api response from the store
                        this.ngrxStore.onAsyncValue(
                            select(
                                EnrollmentsSelectors.getDownloadPreliminaryFormResponse(
                                    memberId,
                                    this.preliminaryFormPaths[index],
                                    this.cartIds[index],
                                    this.mpGroup,
                                ),
                            ),
                        ),
                    ),
                )
                .subscribe((response) => {
                    if (isViewPreliminaryForm) {
                        isViewPreliminaryForm = false;
                        // opens the preliminary form pdf in new window
                        window.open(response);
                    }
                }),
        );
    }

    /**
     *@description Will check entered email is restricted or not.
     *@param control The current value of the form control(email).
     */
    checkForRestrictedEmail(control: AbstractControl): void {
        if (this.restrictedEmailsConfig.includes(control.value)) {
            control.setErrors({ restrictedEmail: true });
        }
    }

    /**
     * unsubscribes all subscriptions on destroy
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
