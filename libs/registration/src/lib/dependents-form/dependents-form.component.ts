import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { DependentContact, MemberIdentifierType, MemberService, StaticService, AuthenticationService } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { Subscription, Observable, combineLatest } from "rxjs";
import { RegistrationState, SharedState, RegexDataType, SetIncompleteRegistrationAlert, StaticUtilService } from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";

import { RegexForFieldValidation } from "@empowered/ui";
import { AppSettings, ContactType, MemberDependent } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { filter } from "rxjs/operators";
import { DateService } from "@empowered/date";

const SPOUSE_RELATION_ID = 1;
const AGE_DIFF_ZERO = 0;
const SPOUSE_MAX_AGE = 1900;

@Component({
    selector: "empowered-dependents-form",
    templateUrl: "./dependents-form.component.html",
    styleUrls: ["./dependents-form.component.scss"],
})
export class DependentsFormComponent implements OnInit, OnDestroy {
    form: FormGroup;
    name: FormGroup;
    dep: MemberDependent;
    identifierTypeId: number;
    dependentAddressForm: FormGroup;
    relation = false;
    formType = "add";
    MP_GROUP: number;
    memberId: number;
    dependentId;
    genders = [];
    RelationshipOptions = [];
    stateOptions = [];
    sameAdress = true;
    ssn = "";
    ssnForm: FormGroup;
    STATE_REGEX = new RegExp(RegexForFieldValidation.STATE);
    CITY_REGEX = new RegExp(RegexForFieldValidation.CITY);
    birthDateFormat = "yyyy-MM-dd";
    NAME_REGEX = new RegExp(RegexForFieldValidation.CITY);
    zipValidationApi: Subscription;
    DependentContactApi: Subscription;
    updateDependentApi: Subscription;
    CreateMemberDependentApi: Subscription;
    relationsAPI: Subscription;
    statesApi: Subscription;
    memberIdentifierTypes = [];
    memberIdentifierTypesApi: Subscription;
    getDependentIdentifierApi: Subscription;
    getMemberContactAPI: Subscription;
    routeParamsSubscription: Subscription;
    deleteMemberIdentifierAPI: Subscription;
    saveDependentIdentifierAPI: Subscription;
    getDependentIdentifierAPI: Subscription;
    getDependentContactAPI: Subscription;
    contactApiError = false;
    address: FormGroup;
    errorMsg = "";
    error = false;
    zipCodeErrorMessage = "";
    zipValid = true;
    dependentToEdit: MemberDependent;
    ssnUpdateError = false;
    fieldErrorMessage = "validationErrors";
    saveError = false;
    memberAddress;
    maxLength = AppSettings.CALENDAR_MAX_LEN;
    today = new Date();
    incompleteRegistrationError: string;
    loadSpinner = false;
    validationRegex: RegexDataType;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    nameWithHyphenApostrophesValidation: RegExp;
    minSpouseAge: number;
    maxChildAge: number;
    subscriptions: Subscription[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.saveDependent",
        "primary.portal.register.dependents.dependentZip",
        "primary.portal.register.dependents.dependentCity",
        "primary.portal.common.optional",
        "primary.portal.register.dependents.dependentStreetAddress1",
        "primary.portal.register.dependents.DependentStreetAddress2",
        "primary.portal.register.dependents.dependentSocialSecurityNumber",
        "primary.portal.register.dependents.dependentBirthDate",
        "primary.portal.register.dependents.dependentLastName",
        "primary.portal.register.dependents.dependentMiddleName",
        "primary.portal.register.dependents.dependentFirstName",
        "primary.portal.common.cancel",
        "primary.portal.register.dependents.dependentState",
        "primary.portal.register.dependents.DependentStreetAddress2Hint",
        "primary.portal.register.dependents.DependentSameAddress",
        "primary.portal.register.dependents.dependentUnidentified",
        "primary.portal.register.dependents.dependentFemale",
        "primary.portal.register.dependents.dependentMale",
        "primary.portal.register.dependents.dependentGender",
        "primary.portal.register.dependents.relationshipToEmployee",
        "primary.portal.register.dependents.myDependentDisabled",
        "primary.portal.register.dependents.dependentBirthDateHint",
        "primary.portal.register.dependents.updateDependent",
        "primary.portal.register.dependents.addDependent",
    ]);
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.register.dependentsForm.zipCodeValid",
        "secondary.portal.register.dependents.futureDate.error",
        "secondary.portal.register.dependents.invalidDate",
        "secondary.portal.register.requiredField",
        "secondary.portal.register.dependents.cityRequired",
        "secondary.portal.register.dependents.ssnRequired",
        "secondary.portal.members.personalValidationMsg.firstNameMsg1",
        "secondary.portal.members.personalValidationMsg.firstNameMsg2",
        "secondary.portal.census.manualEntry.spouseValidAge",
        "secondary.portal.census.manualEntry.spouseMaxAge",
        "secondary.portal.census.manualEntry.maxChildAge",
        "secondary.portal.register.dependents.badParameter",
        "secondary.portal.register.dependents.duplicateDependentfound",
        "secondary.portal.register.dependents.prerequisiteFailed",
        "secondary.portal.register.dependents.updatememberadresserror",
        "secondary.portal.register.dependents.missingParameter",
        "secondary.portal.members.personalValidationMsg.middleName",
    ]);

    constructor(
        private readonly fb: FormBuilder,
        private readonly staticService: StaticService,
        private readonly memberService: MemberService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly store: Store,
        private readonly datepipe: DatePipe,
        private readonly language: LanguageService,
        private readonly auth: AuthenticationService,
        private readonly staticUtilService: StaticUtilService,
        private readonly dateService: DateService,
    ) {}

    /**
     * ngOnInit function is one of an Angular component's life-cycle methods
     * This function is used to initialize all the values and functions at the time of component loading.
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.regex$.pipe(filter((data) => data && data !== undefined)).subscribe((data) => {
                this.validationRegex = data;
            }),
        );
        if (this.auth.formValue.value < 8) {
            this.saveError = true;
            this.store.dispatch(new SetIncompleteRegistrationAlert(this.saveError));
            this.router.navigate(["/member/login"], { relativeTo: this.route });
        }
        this.MP_GROUP = this.store.selectSnapshot(RegistrationState.groupId);
        this.memberId = this.store.selectSnapshot(RegistrationState.memberId);
        this.createFormControls();
        this.loadSpinner = true;
        this.getMemberContactAPI = this.memberService
            .getMemberContact(this.memberId, ContactType.HOME, this.MP_GROUP.toString())
            .subscribe((memberContact: DependentContact) => {
                this.loadSpinner = false;
                this.memberAddress = memberContact;
            });
        this.loadSpinner = true;
        this.memberIdentifierTypesApi = this.memberService.getMemberIdentifierTypes().subscribe(
            (arg) => {
                this.loadSpinner = false;
                this.memberIdentifierTypes = arg;
                if (!this.router.url.endsWith("add")) {
                    this.formType = "edit";
                    this.routeParamsSubscription = this.route.params.subscribe((params) => (this.dependentId = params["id"]));
                    const dependents = this.store.selectSnapshot(RegistrationState.dependents);
                    if (dependents === null) {
                        this.router.navigate(["../../manage"], { relativeTo: this.route });
                    }
                    this.dependentToEdit = dependents.filter((x) => x.id.toString() === this.dependentId.toString()).pop();
                    this.form.patchValue(this.dependentToEdit);
                    if (this.dependentToEdit.profile !== []) {
                        this.form.controls.disabled.patchValue(this.dependentToEdit.profile.disabled);
                    }
                    this.getMemberContact();
                    this.getDependentIdentifier();
                }
            },
            (error) => {
                this.loadSpinner = false;
                // TODO : server down should be handled globally
                if (error.status === 403) {
                    this.errorMsg = "server down";
                }
            },
        );
        // TODO - remove the below routing after portal validation is in place
        if (!this.memberId || !this.MP_GROUP) {
            this.router.navigate(["../../../login"], { relativeTo: this.route });
        }
        this.store.selectSnapshot(RegistrationState.relations).forEach((element) => {
            this.RelationshipOptions.push({ value: element.id, viewValue: element.name });
        });
        this.loadSpinner = true;
        this.staticService.getStates().subscribe((x) => {
            x.forEach(
                (element) => {
                    this.loadSpinner = false;
                    this.stateOptions.push({ value: element.abbreviation, viewValue: element.name });
                },
                (error) => {
                    this.loadSpinner = false;
                    // TODO : server down should be handled globally
                    if (error.status === 403) {
                        this.errorMsg = "server down";
                    }
                },
            );
        });
        this.nameWithHyphenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
        this.getConfiguration();
    }

    /**
     * This function is responsible for creating form controls
     */
    createFormControls(): void {
        this.name = this.fb.group({
            firstName: ["", [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            middleName: ["", Validators.pattern(this.validationRegex.NAME)],
            lastName: ["", [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            updateOn: "blur",
        });
        this.form = this.fb.group({
            adress: [true],
            birthDate: ["", [Validators.required, this.checkDate.bind(this)]],
            gender: ["", Validators.required],
            disabled: [],
            dependentRelationId: ["", Validators.required],
            updateOn: "blur",
            // eslint-disable-next-line indent, @typescript-eslint/indent
        });
        this.form.addControl("name", this.name);
        this.dependentAddressForm = this.fb.group({
            // TODO: not saving worktype as part of any api
            DependentWorkType: [],
            updateOn: "blur",
        });
        this.address = this.fb.group({
            address1: [null, Validators.pattern(RegexForFieldValidation.ADDRESS)],
            address2: [null, Validators.pattern(RegexForFieldValidation.ADDRESS)],
            city: [null, Validators.pattern(this.CITY_REGEX)],
            state: ["", Validators.required],
            zip: ["", [Validators.required, Validators.pattern(RegexForFieldValidation.ZIP_CODE)]],
            updateOn: "blur",
        });
        this.dependentAddressForm.addControl("address", this.address);
        this.form.addControl("dependentAddress", this.dependentAddressForm);
        this.ssnForm = this.fb.group({
            ssn: ["", [Validators.pattern(RegexForFieldValidation.SSN), Validators.minLength(9)]],
            updateOn: "blur",
        });
    }

    onSubmit(): void {
        // Updates the value of registration form
        this.auth.formValue.next(9);
        if (
            !(
                this.form.controls.gender.valid &&
                this.form.controls.name.valid &&
                this.form.controls.birthDate.valid &&
                this.form.controls.dependentRelationId.valid &&
                (this.form.controls.adress.value ? true : this.dependentAddressForm.valid && this.zipValid) &&
                (!this.ssnForm.touched ? true : this.ssnForm.valid)
            )
        ) {
            return;
        }
        if (this.contactApiError) {
            this.saveDependentContact();
        } else if (this.ssnUpdateError) {
            this.saveDependentIdentifier();
        } else if (this.formType === "add") {
            this.addMemberDependent();
        } else {
            this.updateMemberDependent();
        }
    }

    addMemberDependent(): void {
        const dependent: MemberDependent = {} as MemberDependent;
        dependent.name = this.form.controls.name.value;
        dependent.gender = this.form.controls.gender.value;
        dependent.state = this.form.controls.state.value;
        dependent.birthDate = this.datepipe.transform(this.form.controls.birthDate.value, this.birthDateFormat);
        if (this.form.controls.dependentRelationId.value === "") {
            this.relation = false;
        } else {
            dependent.dependentRelationId = this.form.controls.dependentRelationId.value;
        }
        if (this.form.controls.disabled.value === true) {
            dependent.profile = { disabled: true };
        } else {
            dependent.profile = { disabled: false };
        }
        this.loadSpinner = true;
        this.CreateMemberDependentApi = this.memberService.createMemberDependent(dependent, this.memberId, this.MP_GROUP).subscribe(
            (resp) => {
                this.loadSpinner = false;
                const location: string = resp.headers.get("location");
                const stringArray = location.split("/");
                this.dependentId = stringArray[stringArray.length - 1];
                if (this.ssnForm.controls.ssn.value !== "") {
                    this.saveDependentIdentifier();
                } else {
                    this.saveDependentContact();
                }
            },
            (erroresp) => {
                this.loadSpinner = false;
                this.error = true;
                if (erroresp.status === AppSettings.API_RESP_400) {
                    if (erroresp.error.code === "badParameter") {
                        this.errorMsg = "secondary.portal.register.dependents.badParameter";
                        if (erroresp.error.details) {
                            const fieldErrors: string[] = erroresp.error.details.map((detail) => detail.message);
                            this.fieldErrorMessage = fieldErrors.join(", ");
                        } else {
                            this.fieldErrorMessage = "validationErrors";
                        }
                    }
                } else if (erroresp.status === AppSettings.API_RESP_409) {
                    this.errorMsg = "secondary.portal.register.dependents.duplicateDependentfound";
                }
            },
        );
    }
    deletedependentIdentifier(): void {
        this.loadSpinner = true;
        this.deleteMemberIdentifierAPI = this.memberService
            .deleteDependentIdentifier(this.memberId, this.dependentId.toString(), this.getMemberIdentifierTypeID("SSN"), this.MP_GROUP)
            .subscribe(
                (_resp) => {
                    this.loadSpinner = false;
                    this.ssnUpdateError = false;
                    this.saveDependentContact();
                },
                (error) => {
                    this.loadSpinner = false;
                    this.ssnUpdateError = true;
                    this.error = true;
                    this.errorMsg = "secondary.portal.register.dependents.ssnRequired";
                },
            );
    }
    saveDependentIdentifier(): void {
        this.loadSpinner = true;
        this.saveDependentIdentifierAPI = this.memberService
            .saveDependentIdentifier(
                this.memberId,
                this.dependentId.toString(),
                this.getMemberIdentifierTypeID("SSN"),
                this.MP_GROUP,
                this.ssnForm.controls.ssn.value.toString(),
            )
            .subscribe(
                (_resp) => {
                    this.loadSpinner = false;
                    this.ssnUpdateError = false;
                    this.saveDependentContact();
                },
                (error) => {
                    this.loadSpinner = false;
                    this.ssnUpdateError = true;
                    this.error = true;
                    if (error.status === AppSettings.API_RESP_409) {
                        this.errorMsg = "secondary.portal.register.dependents.duplicatefound";
                    }
                    if (error.status === AppSettings.API_RESP_403) {
                        this.errorMsg = "secondary.portal.register.dependents.prerequisiteFailed";
                    }
                    if (error.status === AppSettings.API_RESP_400) {
                        this.errorMsg = "secondary.portal.register.dependents.ssnRequired";
                    }
                },
            );
    }

    saveDependentContact(): void {
        if (this.form.controls.adress.value === true) {
            if (!this.memberAddress.body) {
                this.error = true;
                this.contactApiError = true;
                this.errorMsg = "secondary.portal.register.dependents.updatememberadresserror";
            } else {
                const dependentAddress: DependentContact = {
                    address: this.memberAddress.body.address,
                };
                this.loadSpinner = true;
                this.DependentContactApi = this.memberService
                    .saveDependentContact(dependentAddress, this.memberId, this.dependentId, this.MP_GROUP)
                    .subscribe(
                        (resp) => {
                            this.loadSpinner = false;
                            this.router.navigate(["../../manage"], { relativeTo: this.route });
                        },
                        (erroresp) => {
                            this.loadSpinner = false;
                            this.error = true;
                            this.contactApiError = true;
                            if (erroresp.status === AppSettings.API_RESP_400) {
                                if (erroresp.error.code === "badParameter") {
                                    this.errorMsg = "secondary.portal.register.dependents.badParameter";
                                }
                                if (erroresp.error.code === "missingParameter") {
                                    this.errorMsg = "secondary.portal.register.dependents.missingParameter";
                                }
                            } else if (erroresp.status === AppSettings.API_RESP_403) {
                                if (erroresp.error.code === "prerequisiteFailed") {
                                    this.errorMsg = "secondary.portal.register.dependents.prerequisiteFailed";
                                }
                                // TODO : server down should be handled globally
                                this.errorMsg = "server down";
                            }
                        },
                    );
            }
        } else {
            const contact: DependentContact = this.dependentAddressForm.value;
            for (const propName in contact.address) {
                if (!contact.address[propName]) {
                    delete contact.address[propName];
                }
            }
            this.loadSpinner = true;
            this.DependentContactApi = this.memberService
                .saveDependentContact(contact, this.memberId, this.dependentId, this.MP_GROUP)
                .subscribe(
                    (resp) => {
                        this.loadSpinner = false;
                        this.router.navigate(["../../manage"], { relativeTo: this.route });
                    },
                    (erroresp) => {
                        this.loadSpinner = false;
                        this.error = true;
                        if (erroresp.status === AppSettings.API_RESP_400) {
                            if (erroresp.error.code === "badParameter") {
                                this.errorMsg = "secondary.portal.register.dependents.badParameter";
                            }
                            if (erroresp.error.code === "missingParameter") {
                                this.errorMsg = "secondary.portal.register.dependents.missingParameter";
                            }
                        } else if (erroresp.status === AppSettings.API_RESP_403) {
                            if (erroresp.error.code === "prerequisiteFailed") {
                                this.errorMsg = "secondary.portal.register.dependents.prerequisiteFailed";
                            }
                            // TODO : server down should be handled globally
                            this.errorMsg = "server down";
                        }
                    },
                );
        }
    }

    updateMemberDependent(): void {
        const dependent: MemberDependent = {} as MemberDependent;
        dependent.name = this.form.controls.name.value;
        dependent.gender = this.form.controls.gender.value;
        dependent.state = this.form.controls.state.value;
        dependent.birthDate = this.datepipe.transform(this.form.controls.birthDate.value, this.birthDateFormat);
        dependent.dependentRelationId = this.form.controls.dependentRelationId.value;
        if (this.form.controls.disabled.value === true) {
            dependent.profile = { disabled: true };
        } else {
            dependent.profile = { disabled: false };
        }
        this.loadSpinner = true;
        const updateDependentApi = this.memberService
            .updateMemberDependent(dependent, this.memberId, this.dependentId.toString(), this.MP_GROUP)
            .subscribe(
                (resp) => {
                    this.loadSpinner = false;
                    if (this.ssn.toString() !== this.ssnForm.controls.ssn.value) {
                        if (this.ssnForm.controls.ssn.value === "") {
                            this.deletedependentIdentifier();
                        } else {
                            this.saveDependentIdentifier();
                        }
                    } else {
                        this.saveDependentContact();
                    }
                },
                (erroresp) => {
                    this.loadSpinner = false;
                    this.error = true;
                    if (erroresp.status === AppSettings.API_RESP_400) {
                        if (erroresp.error.code === "badParameter") {
                            this.errorMsg = "secondary.portal.register.dependents.badParameter";
                            if (erroresp.error.details) {
                                const fieldErrors: string[] = erroresp.error.details.map((detail) => detail.message);
                                this.fieldErrorMessage = fieldErrors.join(", ");
                            }
                        }
                    } else if (erroresp.status === AppSettings.API_RESP_403) {
                        this.errorMsg = "secondary.portal.register.dependents.prerequisiteFailed";
                    } else if (erroresp.status === AppSettings.API_RESP_409) {
                        this.errorMsg = "secondary.portal.register.dependents.duplicateDependentfound";
                    }
                },
            );
    }

    validateZipCode(): any {
        this.zipValid = false;
        if (this.address.controls.zip.hasError("required")) {
            return { required: true };
        }
        if (this.address.controls.zip.hasError("pattern")) {
            return { pattern: true };
        }
        if (this.address.controls.zip.dirty) {
            if (!this.address.controls.state.valid) {
                return { requirements: true };
            }
            this.loadSpinner = true;
            this.zipValidationApi = this.staticService
                .validateStateZip(this.address.controls["state"].value, this.address.controls["zip"].value)
                .subscribe(
                    (resp) => {
                        this.loadSpinner = false;
                        this.zipValid = true;
                    },
                    (error) => {
                        this.loadSpinner = false;
                        this.zipValid = false;
                        this.address.controls.zip.setErrors({ requirements: true });
                    },
                );
        }
    }

    /**
     * This function is used to get the member identifier type id
     * @param type member identifier type {string}
     * @returns number
     */
    getMemberIdentifierTypeID(type: string): number {
        const identifier: MemberIdentifierType[] = this.memberIdentifierTypes.filter((row) => {
            if (row.type === type) {
                return true;
            }
            return false;
        });
        return identifier[0].id;
    }

    // TODO : check with BA if ssn should be made editable or not
    getDependentIdentifier(): void {
        const identifierId = this.getMemberIdentifierTypeID("SSN");
        this.loadSpinner = true;
        this.getDependentIdentifierAPI = this.memberService
            .getDependentIdentifier(this.memberId, this.dependentId, identifierId, this.MP_GROUP)
            .subscribe(
                (resp: string) => {
                    this.loadSpinner = false;
                    this.ssn = resp.toString();
                    this.ssnForm.patchValue({ ssn: resp.toString() });
                },
                (errorResp) => {
                    this.loadSpinner = false;
                    if (errorResp.status === AppSettings.API_RESP_403) {
                        if (errorResp.error.code === "forbidden") {
                            this.ssnForm.disable();
                        }
                        // TODO : server down should be handled globally
                        this.errorMsg = "server down";
                    }
                },
            );
    }

    getMemberContact(): void {
        this.loadSpinner = true;
        this.getDependentContactAPI = this.memberService.getDependentContact(this.memberId, this.dependentId, this.MP_GROUP).subscribe(
            (resp) => {
                this.loadSpinner = false;
                this.form.controls.adress.patchValue(false);
                this.dependentAddressForm.patchValue(resp);
                if (JSON.stringify(this.memberAddress.body.address).toLowerCase() === JSON.stringify(resp.address).toLowerCase()) {
                    this.form.controls.adress.patchValue({ adress: true });
                }
            },
            (error) => {
                this.loadSpinner = false;
            },
        );
    }
    checkDate(control: FormControl): any {
        const date = new Date();
        const inputDate = this.dateService.toDate(control.value);
        date.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);
        if (inputDate > date) {
            return { requirements: true };
        }
        return null;
    }

    /**
     * This function is used to validate birth date
     * @param control form control
     * @param event user input
     * @returns input field errors from language table.
     */
    validateDate(control: string, event: string): string {
        if ((this.form.controls[control].value === null || this.form.controls[control].value === "") && event !== "") {
            return this.languageSecondStringsArray["secondary.portal.register.dependents.invalidDate"];
        }
        if (this.form.controls["birthDate"].hasError("required")) {
            return this.languageSecondStringsArray["secondary.portal.register.requiredField"];
        }
        return this.validateDependentAge();
    }
    /**
     * This function is used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        if (this.zipValidationApi !== undefined) {
            this.zipValidationApi.unsubscribe();
        }
        if (this.DependentContactApi !== undefined) {
            this.DependentContactApi.unsubscribe();
        }
        if (this.updateDependentApi !== undefined) {
            this.updateDependentApi.unsubscribe();
        }
        if (this.CreateMemberDependentApi !== undefined) {
            this.CreateMemberDependentApi.unsubscribe();
        }
        if (this.relationsAPI !== undefined) {
            this.relationsAPI.unsubscribe();
        }
        if (this.statesApi !== undefined) {
            this.statesApi.unsubscribe();
        }

        if (this.getMemberContactAPI !== undefined) {
            this.getMemberContactAPI.unsubscribe();
        }

        if (this.routeParamsSubscription !== undefined) {
            this.routeParamsSubscription.unsubscribe();
        }
        if (this.deleteMemberIdentifierAPI !== undefined) {
            this.deleteMemberIdentifierAPI.unsubscribe();
        }
        if (this.saveDependentIdentifierAPI !== undefined) {
            this.saveDependentIdentifierAPI.unsubscribe();
        }
        if (this.getDependentIdentifierAPI !== undefined) {
            this.getDependentIdentifierAPI.unsubscribe();
        }
        if (this.getDependentContactAPI !== undefined) {
            this.getDependentContactAPI.unsubscribe();
        }

        if (this.subscriptions.length) {
            this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        }
    }

    /**
     * This method is used to calculate the valid employee age.
     * @param diffYears Difference of current year and employee birth year
     * @param monthDiff Difference of current month and employee birth month
     * @param dayDiff Difference of current date and employee birth date
     * @returns If employee age is valid then return false or for invalid age it returns true;
     */
    ageDiffCalculator(diffYears: number, monthDiff: number, dayDiff: number): boolean {
        if (diffYears < this.minSpouseAge) {
            return true;
        }
        if (diffYears === this.minSpouseAge) {
            if (monthDiff < AGE_DIFF_ZERO) {
                return true;
            }
            if (monthDiff === AGE_DIFF_ZERO && dayDiff < AGE_DIFF_ZERO) {
                return true;
            }
        }
        return false;
    }

    /**
     * This function is used to validate dependent age
     * @returns error message for dependent age.
     */
    validateDependentAge(): string {
        const control = this.form.controls.birthDate;
        const dateInput = this.dateService.toDate(control.value);
        const diffYears = this.today.getFullYear() - dateInput.getFullYear();
        const monthDiff = this.today.getMonth() - dateInput.getMonth();
        const dayDiff = this.today.getDate() - dateInput.getDate();
        const relation = this.form.controls.dependentRelationId.value;
        control.setErrors({ invalid: true });
        if (relation && relation === SPOUSE_RELATION_ID) {
            if (
                this.today.getFullYear() - dateInput.getFullYear() <= this.minSpouseAge &&
                this.ageDiffCalculator(diffYears, monthDiff, dayDiff)
            ) {
                return this.languageSecondStringsArray["secondary.portal.census.manualEntry.spouseValidAge"] + this.minSpouseAge;
            }
            if (dateInput.getFullYear() < SPOUSE_MAX_AGE) {
                return this.languageSecondStringsArray["secondary.portal.census.manualEntry.spouseMaxAge"];
            }
        } else if (relation && relation !== SPOUSE_RELATION_ID && this.today.getFullYear() - dateInput.getFullYear() > this.maxChildAge) {
            return this.languageSecondStringsArray["secondary.portal.census.manualEntry.maxChildAge"];
        }
        control.setErrors(null);
        return null;
    }

    /**
     * This function is used to get config
     */
    getConfiguration(): void {
        this.subscriptions.push(
            combineLatest(
                this.staticUtilService.cacheConfigValue("general.data.spouse.age.minimum"),
                this.staticUtilService.cacheConfigValue("general.data.child.age.maximum"),
            ).subscribe(([spouseAge, childAge]) => {
                this.minSpouseAge = +spouseAge;
                this.maxChildAge = +childAge;
            }),
        );
    }
}
