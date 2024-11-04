import {
    SetMultipleAccountMode,
    SetRegistrationMemberId,
    SetGroupId,
    SetPersonalForm,
    RegistrationState,
    SharedState,
    SetIncompleteRegistrationAlert,
    SetRegex,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { MemberService, AuthenticationService } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { Subscription, Observable, Subject, combineLatest } from "rxjs";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { RegexForFieldValidation } from "@empowered/ui";
import { NgxMaskPipe } from "ngx-mask";
import { flatMap, takeUntil } from "rxjs/operators";
import {
    JOB_DESCRIPTION_MAX_LENGTH,
    JOB_TITLE_MAX_LENGTH,
    ClientErrorResponseCode,
    AppSettings,
    MemberProfile,
} from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";
import { TPIRestrictionsForHQAccountsService } from "@empowered/common-services";

const CONTACT_INFO_STEP = 6;
const DEPENDENT_STEP = 7;
const RADIX = 10;

const AFLAQ_HQ_REGISTRATION_EDIT = "aflac_hq.member.registration.info.edit";

interface NavigationState {
    [key: string]: any;
}
@Component({
    selector: "empowered-personal-info",
    templateUrl: "./personal-info.component.html",
    styleUrls: ["./personal-info.component.scss"],
})
export class PersonalInfoComponent implements OnInit, OnDestroy {
    personalForm: FormGroup;
    errorMessage = "";
    showErrorMessage = false;
    name: FormGroup;
    workInformation: FormGroup;
    memberId;
    mpGroup: number;
    subscriptions: Subscription[] = [];
    SSN_REGEX = new RegExp(RegexForFieldValidation.SSN);
    saveError = false;
    incompleteRegistrationError: string;
    loadSpinner = true;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.register.personalInfo.firstName",
        "primary.portal.register.personalInfo.middleName",
        "primary.portal.common.optional",
        "primary.portal.register.personalInfo.lastName",
        "primary.portal.register.personalInfo.birthDate",
        "primary.portal.register.personalInfo.SSN",
        "primary.portal.register.personalInfo.jobTitle",
        "primary.portal.register.personalInfo.jobDuties",
        "primary.portal.common.back",
        "primary.portal.common.next",
        "primary.portal.common.confirm",
        "primary.portal.common.cancel",
        "primary.portal.common.finishRegistration",
    ]);
    @Select(SharedState.regex) regex$: Observable<any>;
    @Select(RegistrationState.getMultipleAccountMode) multipleAccountMode$: Observable<boolean>;
    ssnFormat = "XXX-XX-0000";
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    invalidSSNValidation: RegExp;
    isFormSubmit = false;
    ssnLength = AppSettings.SSN_MIN_LENGTH;
    authFormValue = 5;
    ssnRegex: RegExp;
    numberRegex: RegExp;
    currentNavigationState: NavigationState;
    formInitInvalid = false;
    isAflacReadOnly = false;
    hideContactTab: boolean;
    hidePersonalInfoTab: boolean;
    hideDependentTab: boolean;

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly memberService: MemberService,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly auth: AuthenticationService,
        private readonly maskPipe: NgxMaskPipe,
        private readonly staticUtil: StaticUtilService,
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
    ) {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.setRegexValidation();
        this.currentNavigationState = this.router.getCurrentNavigation().extras.state;
        if (this.currentNavigationState) {
            this.store.dispatch(new SetMultipleAccountMode(true));
        }
    }

    /**
     * ngOnInit function is one of an Angular component's life-cycle methods
     * This function is used to initialize all the values and functions at the time of component loading.
     */
    ngOnInit(): void {
        if (this.currentNavigationState && this.currentNavigationState.multipleAccountMode) {
            this.store.dispatch(new SetRegistrationMemberId(this.currentNavigationState.memberId));
            this.store.dispatch(new SetGroupId(this.currentNavigationState.groupId));
        }
        this.mpGroup = this.store.selectSnapshot(RegistrationState.groupId);
        this.memberId = this.store.selectSnapshot(RegistrationState.memberId);
        if (this.auth.formValue.value < this.authFormValue) {
            this.saveError = true;
            this.store.dispatch(new SetIncompleteRegistrationAlert(this.saveError));
            this.router.navigate(["../../login"], { relativeTo: this.route });
        }
        this.getConfiguration();
        combineLatest(
            this.tpiRestrictions.canAccessTPIRestrictedModuleInHQAccount(null, null, this.mpGroup),
            this.staticUtil.cacheConfigEnabled(AFLAQ_HQ_REGISTRATION_EDIT),
            this.memberService.getMember(this.memberId, true, this.mpGroup.toString()),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([isNotHQAccount, response, resp]) => {
                    this.isAflacReadOnly = !isNotHQAccount && !response;
                    this.editMemberForm(resp);
                    this.loadSpinner = false;
                },
                (err) => {
                    this.showErrorAlertMessage(err);
                    this.loadSpinner = false;
                },
            );
    }
    /**
     * This function is used to set regex validation for form controls.
     */
    setRegexValidation(): void {
        this.store
            .dispatch(new SetRegex())
            .pipe(
                flatMap((data) => this.regex$),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((data) => {
                if (data) {
                    this.invalidSSNValidation = new RegExp(data.INVALID_SSN);
                    this.ssnRegex = new RegExp(data.SSN);
                    this.numberRegex = new RegExp(data.NUMERIC);
                    this.personalForm = this.fb.group({
                        name: this.fb.group({
                            firstName: ["", Validators.required],
                            middleName: [" "],
                            lastName: ["", Validators.required],
                        }),
                        gender: ["", Validators.required],
                        birthDate: ["", Validators.required],
                        ssn: ["", [Validators.pattern(this.ssnRegex)]],
                        workInformation: this.fb.group({
                            occupation: ["", [Validators.required, Validators.maxLength(JOB_TITLE_MAX_LENGTH)]],
                            occupationDescription: ["", [Validators.required, Validators.maxLength(JOB_DESCRIPTION_MAX_LENGTH)]],
                            hireDate: [""],
                        }),
                    });
                }
            });
    }
    /**
     * Updating form field data with initial value
     * @param resp { any } initial form data passing as parameter
     */
    editMemberForm(resp: HttpResponse<MemberProfile>): void {
        const respBody = resp.body;
        this.personalForm.patchValue({
            name: {
                firstName: respBody.name.firstName,
                middleName: respBody.name.middleName,
                lastName: respBody.name.lastName,
            },
            gender: respBody.gender,
            birthDate: respBody.birthDate,
            ssn: respBody.ssn,

            workInformation: {
                occupation: respBody.workInformation.occupation,
                occupationDescription: respBody.workInformation.occupationDescription,
                hireDate: respBody.workInformation.hireDate,
            },
        });
        // Validating personal info form data valid or not after required form data Initialization
        if (this.isAflacReadOnly && this.personalForm.invalid) {
            this.formInitInvalid = true;
        }
    }

    /**
     * This function is used to save personal-info data
     */
    onSubmit(): void {
        this.isFormSubmit = true;
        this.hideErrorAlertMessage();
        this.auth.formValue.next(6);
        const model = { ...this.personalForm.value, ...{ id: parseInt(this.memberId.toString(), RADIX) } };
        if (this.personalForm.valid) {
            this.loadSpinner = true;
            this.memberService
                .updateMember(model, this.mpGroup.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.store.dispatch(new SetPersonalForm(this.personalForm.value));
                        this.checkBeforeNavigate();
                        this.loadSpinner = false;
                    },
                    (err) => {
                        this.showErrorAlertMessage(err);
                        this.loadSpinner = false;
                    },
                );
        }
    }
    hideErrorAlertMessage(): void {
        this.showErrorMessage = false;
        this.errorMessage = null;
    }
    /**
     * Displaying api errors as per user prospective
     * @param err { Error } api error params
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        const error = err["error"];
        if (error.status === ClientErrorResponseCode.RESP_400 && error["details"].length > 0) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.register.personalInfo.api.${error.status}.${error.code}.${error["details"][0].field}`,
            );
        } else if (error.status === ClientErrorResponseCode.RESP_409) {
            const name = `${this.personalForm.value.name.firstName} ${this.personalForm.value.name.lastName}`;
            this.errorMessage = this.language
                .fetchSecondaryLanguageValue("secondary.portal.register.personalInfo.api.duplicateMemberError")
                .replace("##name##", name);
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    numberValidation(event: KeyboardEvent): void {
        if (!this.numberRegex.test(event.key)) {
            event.preventDefault();
        }
    }

    onPasteNumberValidation(event: ClipboardEvent): void {
        if (!this.numberRegex.test(event.clipboardData.getData("Text"))) {
            event.preventDefault();
        }
    }
    /**
     * This function is used to get config
     */
    getConfiguration(): void {
        this.subscriptions.push(
            combineLatest(
                this.staticUtil.cacheConfigEnabled("member.registration.skip.personal.info"),
                this.staticUtil.cacheConfigEnabled("member.registration.skip.contact.info"),
                this.staticUtil.cacheConfigEnabled("member.registration.skip.add.dependent"),
            ).subscribe(([personalFlag, contactFlag, dependentFlag]) => {
                this.hidePersonalInfoTab = personalFlag;
                this.hideContactTab = contactFlag;
                this.hideDependentTab = dependentFlag;
            }),
        );
    }

    /**
     * This function is used to navigate to particular screen based on config
     */
    checkBeforeNavigate(): void {
        if (this.isAflacReadOnly || !this.hideContactTab) {
            this.auth.formValue.next(CONTACT_INFO_STEP);
            this.router.navigate(["../contact-info"], { relativeTo: this.route });
        } else if (!this.hideDependentTab && !this.isAflacReadOnly) {
            this.auth.formValue.next(DEPENDENT_STEP);
            this.router.navigate(["../manage"], { relativeTo: this.route });
        } else {
            this.router.navigate(["../../login"], { relativeTo: this.route });
        }
    }

    /**
     * This function is used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        if (this.subscriptions.length) {
            this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
