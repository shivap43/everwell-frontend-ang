import {
    DateFormats,
    PHONE_NUMBER_FORMAT,
    SuccessResponseCode,
    ClientErrorResponseCode,
    ZIP_MAX_LENGTH,
    DATE_FIELD_MAX_LENGTH,
    ClientErrorResponseType,
    MEMBER_HOME_ROUTE,
    MEMBER_PORTAL,
    Name,
    CompanyCode,
    Portals,
    Address,
    ContactType,
    CountryState,
    Gender,
    MemberProfile,
    VerificationInformation,
    WorkInformation,
    MemberContact,
} from "@empowered/constants";
import { NgxMaskPipe } from "ngx-mask";
import { DatePipe } from "@angular/common";
import { takeUntil, switchMap, tap, filter, catchError } from "rxjs/operators";
import { SELF_ENROLLMENT_PERSONAL_LANG_KEY, PERSONAL_INFO_FORM_CONTROL, DIGIT_ZERO, DIGIT_ONE } from "./../self-enrollment-constant";
import { MatStepper } from "@angular/material/stepper";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Select, Store } from "@ngxs/store";

import { EmpoweredModalService } from "@empowered/common-services";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Component, OnInit, Inject, ViewChild, OnDestroy } from "@angular/core";
import {
    StaticService,
    AccountInvitation,
    AccountService,
    MemberService,
    AuthenticationService,
    EmailTypes,
    PhoneNumberTypes,
    API_RESP_HEADER_LOCATION,
    AdminService,
} from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { SelfEnrollmentPopupComponent, EnrollmentModal } from "../self-enrollment-popup/self-enrollment-popup.component";
import { Subject, of, Observable, forkJoin } from "rxjs";
import { Router } from "@angular/router";
import { UserService } from "@empowered/user";
import {
    SharedState,
    RegexDataType,
    SetPortal,
    SetRouteAfterLogin,
    SetURLNavigationAfterLogin,
    AddAccountInfo,
} from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

const PARSE_INT = 10;
const ERROR = "error";
const DETAILS = "details";
const MEMBER_ERROR_KEY = "secondary.portal.members.api.";
const PRODUCER_ERROR_KEY = "secondary.portal.accounts.selfEnrollment.api.";
const PHONE_REPLACE_REGEX = /[-() ]/g;
const FORBIDDEN_CODE = "forbidden";
const NY_COUNTRY_STATE: CountryState[] = [
    {
        abbreviation: CompanyCode.NY,
        name: "New York",
    },
];
const REQUIRED_FIELD_ERROR_KEY = "primary.portal.common.requiredField";
const MAX_COMMISSION_PERCENTAGE = 100;
const BIRTH_DATE_FORM_CONTROL = "birthDate";
const ADDRESS_LINE_MAX_LENGTH = 100;
@Component({
    selector: "empowered-self-enrollment-personal-info",
    templateUrl: "./self-enrollment-personal-info.component.html",
    styleUrls: ["./self-enrollment-personal-info.component.scss"],
})
export class SelfEnrollmentPersonalInfoComponent implements OnInit, OnDestroy {
    stepOneForm: FormGroup;
    stepTwoForm: FormGroup;
    employeeStates: CountryState[] = [];
    gender = [Gender.MALE, Gender.FEMALE];
    form: FormGroup;
    validationRegex: RegexDataType;
    companyCode: string;
    isFormSubmit = false;
    today = new Date();
    mpGroupId: number;
    maxLength = DATE_FIELD_MAX_LENGTH;
    minimumSubscriberAge?: number;
    zipFlag = false;
    @ViewChild(MatStepper, { static: true }) matStepper: MatStepper;
    formControls = PERSONAL_INFO_FORM_CONTROL;
    showSpinner = false;
    errorMessage: string;
    showErrorMessage = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(SELF_ENROLLMENT_PERSONAL_LANG_KEY);
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    isInviteSuccess = false;
    inviteProducerObject: AccountInvitation;
    zipCodeLength = ZIP_MAX_LENGTH;
    private readonly unsubscribe$: Subject<void> = new Subject();
    hidePersonalForm = false;
    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) private readonly data: EnrollmentModal,
        private readonly staticService: StaticService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly accountService: AccountService,
        private readonly memberService: MemberService,
        private readonly datePipe: DatePipe,
        private readonly maskPipe: NgxMaskPipe,
        private readonly authenticationService: AuthenticationService,
        private readonly router: Router,
        private readonly user: UserService,
        private readonly store: Store,
        private readonly adminService: AdminService,
        private readonly dateService: DateService,
    ) {}

    /**
     * Angular lifecycle method to initialize component
     * Initialize the personal info form,state dropdown,regex and populate admin contact data
     */
    ngOnInit(): void {
        if (this.data.companyCode === CompanyCode.NY) {
            this.employeeStates = NY_COUNTRY_STATE;
        } else {
            this.getEmployeeState();
        }
        this.getConfig();
        this.companyCode = this.data.companyCode;
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        this.stepOneForm = this.formBuilder.group({
            addressLineOne: [
                "",
                [Validators.required, Validators.pattern(this.validationRegex.ADDRESS), Validators.maxLength(ADDRESS_LINE_MAX_LENGTH)],
            ],
            addressLineTwo: ["", [Validators.pattern(this.validationRegex.ADDRESS), Validators.maxLength(ADDRESS_LINE_MAX_LENGTH)]],
            birthDate: ["", Validators.required],
            genderName: ["", Validators.required],
            city: [""],
            state: ["", [Validators.required, Validators.pattern(this.validationRegex.STATE)]],
            zip: ["", [Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]],
        });

        this.stepTwoForm = this.formBuilder.group({
            writingNumber: ["", Validators.required],
            sitCode: ["", Validators.required],
        });
        this.prepopulateAdminContact();
    }

    /**
     * Function to patch available admin contact details in personal info form and disable the fields
     * @returns void
     */
    prepopulateAdminContact(): void {
        this.showSpinner = true;
        this.adminService
            .getAdminContact(this.data.producerId[0])
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((adminContact) => {
                    this.showSpinner = false;
                    return (
                        Object.keys(adminContact).length > 0 &&
                        !(
                            (this.data.companyCode === CompanyCode.NY && adminContact.address.state !== CompanyCode.NY) ||
                            (this.data.companyCode === CompanyCode.US && adminContact.address.state === CompanyCode.NY)
                        )
                    );
                }),
                tap((adminContact) => {
                    if (adminContact.address.city) {
                        this.stepOneForm.controls.city.patchValue(adminContact.address.city);
                        this.stepOneForm.controls.city.disable();
                    }
                    if (adminContact.address.state) {
                        this.stepOneForm.controls.state.patchValue(adminContact.address.state);
                        this.stepOneForm.controls.state.disable();
                    }
                    if (adminContact.address.zip) {
                        this.stepOneForm.controls.zip.patchValue(adminContact.address.zip);
                        this.stepOneForm.controls.zip.disable();
                    }
                    if (adminContact.address.address1) {
                        this.stepOneForm.controls.addressLineOne.patchValue(adminContact.address.address1);
                        this.stepOneForm.controls.addressLineOne.disable();
                    }
                    if (adminContact.address.address2) {
                        this.stepOneForm.controls.addressLineTwo.patchValue(adminContact.address.address2);
                        this.stepOneForm.controls.addressLineTwo.disable();
                    }
                }),
                catchError((error) => {
                    this.showSpinner = false;
                    return of(null);
                }),
            )
            .subscribe();
    }

    /**
     * Set the error message based on control validation
     * @param control respective control to validate
     * @returns error message key for the control
     */
    getErrorMessages(control: string): string {
        if (this.isFormSubmit && !this.stepOneForm.controls[control].value) {
            this.stepOneForm.controls[control].markAsTouched();
            return REQUIRED_FIELD_ERROR_KEY;
        }
        return this.stepOneForm.controls[control].hasError("pattern") ? "secondary.portal.census.manualEntry.validName" : "";
    }

    /**
     * Get the state from the API
     * @returns void
     */
    getEmployeeState(): void {
        this.staticService
            .getStates()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((states) => {
                this.employeeStates = states.filter((state) => state.abbreviation !== CompanyCode.NY);
            });
    }

    /**
     * Function to validate the control to show error message
     * @param formControlName form control for employee form
     * @returns error message key
     */
    getEmployeeFormErrorMessage(formControlName: string): string {
        if (formControlName === "genderName" || formControlName === "state") {
            return this.stepOneForm.controls[formControlName].errors && this.stepOneForm.controls[formControlName].errors.required
                ? "primary.portal.common.selectionRequired"
                : "";
        }
        return this.stepOneForm.controls[formControlName].errors && this.stepOneForm.controls[formControlName].errors.required
            ? REQUIRED_FIELD_ERROR_KEY
            : "";
    }
    /**
     * Zip code validate for corresponding state entered
     * @param value zip code entered into form
     */
    checkZipCode(value: string): void {
        if (value.length === ZIP_MAX_LENGTH && this.stepOneForm.value.state !== "") {
            this.staticService
                .validateStateZip(this.stepOneForm.value.state, value)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        if (response.status === SuccessResponseCode.RESP_204) {
                            this.zipFlag = false;
                        }
                    },
                    (error) => {
                        if (error.status === ClientErrorResponseCode.RESP_400) {
                            this.zipFlag = true;
                        }
                    },
                );
        }
    }

    /**
     * Validate the zip code mapping with selected state from drop down
     * @returns void
     */
    validateStateZipCode(): void {
        this.checkZipCode(this.stepOneForm.value.zip);
    }

    /**
     * Validate the date and minimum age requirement
     * @param event date entered into form
     * @returns error message for DOB field
     */
    validateDate(event: string): string {
        this.stepOneForm.controls.birthDate.setErrors({ invalid: true });
        const dateInput = this.dateService.toDate(this.stepOneForm.controls[BIRTH_DATE_FORM_CONTROL].value);
        if (
            (this.isFormSubmit && !this.stepOneForm.controls[BIRTH_DATE_FORM_CONTROL].value) ||
            !this.stepOneForm.controls[BIRTH_DATE_FORM_CONTROL].value
        ) {
            return this.languageStrings[REQUIRED_FIELD_ERROR_KEY];
        }
        if (
            (this.stepOneForm.controls[BIRTH_DATE_FORM_CONTROL].value === null ||
                this.stepOneForm.controls[BIRTH_DATE_FORM_CONTROL].value === "") &&
            event !== ""
        ) {
            return this.languageStrings["primary.portal.common.invalidDateFormat"];
        }
        if (dateInput <= this.today && !(dateInput.getMonth() + DIGIT_ONE && dateInput.getDate() && dateInput.getFullYear())) {
            return this.languageStrings["primary.portal.common.invalidDateFormat"];
        }
        if (this.today.getFullYear() - dateInput.getFullYear() < this.minimumSubscriberAge) {
            return this.languageStrings["primary.portal.direct.addCustomer.employeeMinAge"].replace(
                "#minSubscriberAge",
                this.minimumSubscriberAge?.toString(),
            );
        }
        this.stepOneForm.controls.birthDate.setErrors(null);
        return null;
    }

    /**
     * Config to get the minimum age for enrollment
     * @returns void
     */
    getConfig(): void {
        this.staticService
            .getConfigurations("general.data.minimum_subscriber_age", this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.minimumSubscriberAge = parseInt(resp[DIGIT_ZERO].value, PARSE_INT);
            });
    }

    /**
     * This method will be called, if user tries to proceed for next step.
     * @param nextIndex Step to navigate further
     * @returns void
     */
    onNext(nextIndex: number): void {
        this.isFormSubmit = true;
        if (this.stepOneForm.valid && !this.zipFlag) {
            this.hidePersonalForm = true;
            this.matStepper.selectedIndex = nextIndex;
        } else {
            this.formControls.forEach((control) => {
                if (!this.stepOneForm.controls[control].value) {
                    this.stepOneForm.controls[control].markAsTouched();
                }
            });
            return;
        }
    }

    /**
     * Function will redirect to personal info popup
     * @param previousStep step for personal info popup
     */
    backToPersonalInfo(previousStep: number): void {
        this.hidePersonalForm = false;
        this.matStepper.selectedIndex = previousStep;
    }

    /**
     * Go to in member portal context from producer portal
     * @returns void
     */
    switchToMemberPortal(): void {
        this.showSpinner = true;
        this.isInviteSuccess = false;
        this.stepTwoForm.controls["writingNumber"].markAsTouched();
        this.stepTwoForm.controls["sitCode"].markAsTouched();
        if (this.stepTwoForm.valid) {
            const memberObject = this.populateMemberObject();
            let memberId = null;
            const memberProfileObj = this.populateMemberProfileObject();
            this.memberService
                .validateMember(memberObject, this.data.groupId.toString())
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((resp) => {
                        const workInfoObject: WorkInformation = {
                            hireDate: this.datePipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY),
                        };
                        memberObject.workInformation = workInfoObject;
                        return this.memberService.createMember(memberObject, this.data.groupId);
                    }),
                    switchMap((response) => {
                        memberId = response["headers"]
                            .get(API_RESP_HEADER_LOCATION)
                            .substring(response["headers"].get(API_RESP_HEADER_LOCATION).lastIndexOf("/") + DIGIT_ONE);
                        return this.memberService.getMember(memberId, true, this.data.groupId.toString());
                    }),
                    switchMap((response) => {
                        if (!(response.body.verificationInformation && response.body.verificationInformation.verifiedPhone)) {
                            memberProfileObj.phoneNumbers = undefined;
                        } else {
                            memberProfileObj.phoneNumbers = [
                                {
                                    phoneNumber: this.maskPipe.transform(
                                        response.body.verificationInformation.verifiedPhone.replace(PHONE_REPLACE_REGEX, ""),
                                        PHONE_NUMBER_FORMAT,
                                    ),
                                    primary: true,
                                    verified: true,
                                    type: PhoneNumberTypes.HOME,
                                },
                            ];
                        }
                        return this.memberService.saveMemberContact(
                            memberId,
                            ContactType.HOME,
                            memberProfileObj,
                            this.data.groupId.toString(),
                        );
                    }),
                    switchMap(() => this.accountService.inviteProducer(this.inviteProducerObject, this.data.groupId)),
                    switchMap(() => {
                        this.isInviteSuccess = true;
                        return this.authenticationService.getAgentSelfEnrollmentToken(this.data.groupId.toString());
                    }),
                    switchMap((response) =>
                        forkJoin([
                            this.authenticationService.agentSelfEnrollmentSSO(response),
                            this.accountService.getAccount(this.data.groupId.toString()),
                        ]),
                    ),
                    tap(([response, accountInfo]) => {
                        // redirect to sso page for switch context
                        this.store.dispatch([
                            new SetPortal(Portals.MEMBER),
                            new SetRouteAfterLogin(MEMBER_PORTAL),
                            new SetURLNavigationAfterLogin(MEMBER_HOME_ROUTE),
                            new AddAccountInfo({
                                accountInfo,
                                mpGroupId: accountInfo.id.toString(),
                            }),
                        ]);
                        this.user.setUserCredential(response);
                        this.router.navigate([MEMBER_HOME_ROUTE]).then(() => {
                            this.empoweredModalService.closeDialog();
                            this.showSpinner = false;
                        });
                    }),
                    catchError((error) => {
                        if (
                            error.error.status === ClientErrorResponseCode.RESP_400 &&
                            error.error.code === ClientErrorResponseType.BAD_PARAMETER
                        ) {
                            this.isInviteSuccess = true;
                            return this.authenticationService.getAgentSelfEnrollmentToken(this.data.groupId.toString()).pipe(
                                takeUntil(this.unsubscribe$),
                                switchMap((response) => this.authenticationService.agentSelfEnrollmentSSO(response)),

                                tap((response) => {
                                    // redirect to sso page for switch context
                                    this.store.dispatch([
                                        new SetPortal(Portals.MEMBER),
                                        new SetRouteAfterLogin(MEMBER_PORTAL),
                                        new SetURLNavigationAfterLogin(MEMBER_HOME_ROUTE),
                                    ]);
                                    this.user.setUserCredential(response);
                                    this.router.navigate([MEMBER_HOME_ROUTE]).then(() => {
                                        this.empoweredModalService.closeDialog();
                                        this.showSpinner = false;
                                    });
                                }),
                            );
                        }
                        this.showSpinner = false;
                        this.showErrorAlertMessage(error);
                        return undefined;
                    }),
                )
                .subscribe();
        } else {
            this.showSpinner = false;
            return;
        }
    }

    /**
     *Function to populate member profile object
      @returns MemberContact object with address property
     */
    populateMemberProfileObject(): MemberContact {
        const addressObject: Address = {
            address1: this.stepOneForm.controls["addressLineOne"].value,
            address2: this.stepOneForm.controls["addressLineTwo"].value,
            zip: this.stepOneForm.controls["zip"].value,
            state: this.stepOneForm.controls["state"].value,
            city: this.stepOneForm.controls["city"].value,
        };
        return {
            address: addressObject,
            phoneNumbers: this.data.adminData.phoneNumber
                ? [
                      {
                          phoneNumber: this.data.adminData.phoneNumber
                              ? this.maskPipe.transform(
                                    this.data.adminData.phoneNumber.replace(PHONE_REPLACE_REGEX, ""),
                                    PHONE_NUMBER_FORMAT,
                                )
                              : undefined,
                          primary: true,
                          verified: true,
                          type: PhoneNumberTypes.HOME,
                      },
                  ]
                : undefined,
            emailAddresses: [
                {
                    email: this.data.adminData.emailAddress,
                    type: EmailTypes.PERSONAL,
                    primary: true,
                    verified: true,
                },
            ],
        };
    }
    /**
     * Function to populate member object from the get admin data and info entered from producer
     * @returns Member profile instance
     */
    populateMemberObject(): MemberProfile {
        this.inviteProducerObject = {
            invitedProducerIds: this.data.producerId,
            message: " ",
            commissionSplitAssignments: [
                {
                    sitCodeId: this.stepTwoForm.controls["sitCode"].value,
                    percent: MAX_COMMISSION_PERCENTAGE,
                },
            ],
        };
        const nameObject: Name = {
            firstName: this.data.adminData.name.firstName,
            lastName: this.data.adminData.name.lastName,
        };
        const verifiedInfoObject: VerificationInformation = {
            zipCode: this.stepOneForm.controls["zip"].value,
            verifiedEmail: this.data.adminData.emailAddress,
            verifiedPhone: this.data.adminData.phoneNumber
                ? this.maskPipe.transform(this.data.adminData.phoneNumber.replace(PHONE_REPLACE_REGEX, ""), PHONE_NUMBER_FORMAT)
                : undefined,
        };
        return {
            gender: this.stepOneForm.controls["genderName"].value,
            birthDate: this.datePipe.transform(this.stepOneForm.controls[BIRTH_DATE_FORM_CONTROL].value, DateFormats.YEAR_MONTH_DAY),
            name: nameObject,
            verificationInformation: verifiedInfoObject,
        };
    }
    /**
     * Function to map the error code with their message from DB
     * @param err error object from API call
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.showErrorMessage = true;
        const errorKey = this.isInviteSuccess ? MEMBER_ERROR_KEY : PRODUCER_ERROR_KEY;
        const error = err[ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[DETAILS].length > DIGIT_ZERO) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `${errorKey}${error.status}.${error.code}.${error[DETAILS][DIGIT_ZERO].field}`,
            );
        } else if (error.code === ClientErrorResponseType.DUPLICATE) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`${MEMBER_ERROR_KEY}${error.status}.${error.code}`);
        } else if (error.code === FORBIDDEN_CODE) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`${PRODUCER_ERROR_KEY}${error.status}.${error.code}`);
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.portal.${error.status}.${error.code}`);
        }
    }
    /**
     * Function to back to enrollment initiate popup
     * @returns Observable of string
     */
    backToEnrollment(): Observable<string> {
        this.empoweredModalService.closeDialog();
        return this.empoweredModalService.openDialog(SelfEnrollmentPopupComponent).afterClosed();
    }

    /**
     * function to close the popup
     * @returns void
     */
    closePopup(): void {
        this.empoweredModalService.closeDialog();
    }

    /**
     * Implements Angular OnDestroy Life Cycle hook
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
