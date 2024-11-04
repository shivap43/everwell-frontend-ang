/* eslint-disable no-underscore-dangle */
import { DatePipe } from "@angular/common";
import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { AccountService, DependentContact, DependentFullProfile, MemberFullProfile, MemberService, StaticService } from "@empowered/api";
import { EmpoweredModalService, SharedService } from "@empowered/common-services";

import {
    ADDRESS_OPTIONS,
    AddressConfig,
    AppSettings,
    BooleanConst,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    CountryState,
    Credential,
    DateFormats,
    DependnentForm,
    Gender,
    MemberContact,
    MemberDependent,
    PersonalAddress,
    Relations,
} from "@empowered/constants";
import { DateService } from "@empowered/date";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { AddDependentToList, SetUserData, SharedState, StaticUtilService, UpdateDependentInList } from "@empowered/ngxs-store";
import {
    AddressVerificationComponent,
    DependentAddressUpdateModalComponent,
    MembersBusinessService,
    ProfileChangesConfirmPromptComponent,
    validateStateAndZipCode,
} from "@empowered/ui";
import { UserService } from "@empowered/user";

import { Select, Store } from "@ngxs/store";
import { combineLatest, EMPTY, forkJoin, iif, Observable, of, Subject, Subscription } from "rxjs";
import { catchError, filter, finalize, map, switchMap, takeUntil, tap } from "rxjs/operators";

const OVER_ALL_ADDRESS_VERIFICATION = "general.feature.enable.aflac.api.address_validation";
const CONTROLS = "controls";
const FORMS = "forms";
const LOCATION = "location";
const SLASH = "/";

@Component({
    selector: "empowered-dependent-add-edit",
    templateUrl: "./dependent-add-edit.component.html",
    styleUrls: ["./dependent-add-edit.component.scss"],
})
export class DependentAddEditComponent implements OnInit, OnDestroy {
    @ViewChild("datePickerInput") datePickerInput: ElementRef;
    dependentForm: FormGroup;
    editForm: FormGroup;
    addForm: FormGroup;
    subscriber: Subscription[] = [];
    relations: Relations[];
    genders: any[];
    states: any[];
    isDoubleForm: boolean;
    formValidations;
    @Select(SharedState.regex) reg$: Observable<any>;
    nameWithHypenApostrophesValidation: any;
    maxDate: Array<Date>;
    minDate: Array<Date>;
    languageStrings: Record<string, string>;
    secondaryLanguageStrings: Record<string, string>;
    dependantFirstName: string;
    languageSecondaryStringForBirthDateError: string;
    SPOUSE_MIN_AGE = AppSettings.SPOUSE_MIN_AGE;
    CHILD_MAX_AGE = AppSettings.CHILD_MAX_AGE;
    DATE_FORMAT_MM_DD_YYYY = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    SPOUSE = "spouse";
    CHILD = "child";
    formArray: FormArray;
    isLoading: boolean;
    STR_ADD = "add";
    STR_EDIT = "edit";
    STR_HOME = "HOME";
    STR_VALUE = "value";
    STR_RELATIONSHIP_TO_EMPLOYEE = "relationshipToEmployee";
    STR_BIRTH_DATE = "birthDate";
    isQleUdpate = false;
    hasError = false;
    errorMsg = "";
    allSubscriptions: Subscription[] = [];
    suggestedAddress: PersonalAddress;
    tempMemberAddress: PersonalAddress;
    dependentDetails: MemberDependent;
    dependentContact: DependentContact;
    memberFullProfile: MemberFullProfile;
    dependentFullProfile: DependentFullProfile;
    memberContact: MemberContact;
    addressResp: boolean;
    addressMessage: string[] = [];
    selectedAddress: string;
    openAddressModal = false;
    addressValidationSwitch = false;
    matched: boolean;
    isValidDate: boolean;
    isDateInvalid = false;
    private readonly unsubscribe$ = new Subject<void>();
    isHomeAddressSameAsEmployee = false;
    isAddress1Mandatory: boolean;
    isCityMandatory: boolean;
    isRequired: boolean;
    isAddressValuesChanged: boolean;
    today = new Date();
    loggedInData: Credential;
    dependentList: MemberDependent[];

    private enableDependentAddressModal: boolean = null;

    constructor(
        private readonly dialogRef: MatDialogRef<DependentAddEditComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly _staticService: StaticService,
        private readonly _accountService: AccountService,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly mService: MemberService,
        private readonly store: Store,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly sharedService: SharedService,
        private readonly membersBusinessService: MembersBusinessService,
        private readonly userService: UserService,
        private readonly datepipe: DatePipe,
        private readonly dateService: DateService,
    ) {}
    /**
     * This method is used to initialize dependent form
     * @returns void
     */
    ngOnInit(): void {
        this.getLanguageStrings();
        this.getSecondaryLanguageStrings();
        this.getConfig();
        this.minDate = new Array<Date>();
        this.maxDate = new Array<Date>();
        this.reg$.pipe(takeUntil(this.unsubscribe$)).subscribe((reg) => {
            this.formValidations = reg;
        });
        this.dependentForm = this.fb.group({
            forms: this.fb.array([]),
        });
        if (this.data.userData) {
            this.dependantFirstName = this.data.userData.name.firstName;
        }
        this.dependentFormArray.push(this.getDependentFormGroup());
        this.isLoading = false;
        this.isValidDate = false;
        this.isDateInvalid = true;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.getDropdownValuesFromAPI();
        this.nameWithHypenApostrophesValidation = new RegExp(this.formValidations.NAME_WITH_HYPENS_APOSTROPHES);
        if (this.data.mode === this.STR_EDIT) {
            const isMemberAndDependentAddressSame =
                this.data.userData.contact && this.data.dependentData.contact
                    ? this.compareMemberAndDependentAddress(this.data.userData.contact, this.data.dependentData.contact)
                    : false;
            const dData = {
                firstName: this.data.dependentData.name.firstName,
                lastName: this.data.dependentData.name.lastName,
                gender: this.data.dependentData.gender,
                address1: this.data.dependentData.contact ? this.data.dependentData.contact.address.address1 : "",
                address2: this.data.dependentData.contact ? this.data.dependentData.contact.address.address2 : "",
                city: this.data.dependentData.contact ? this.data.dependentData.contact.address.city : "",
                state: this.data.dependentData.contact ? this.data.dependentData.contact.address.state : "",
                zip: this.data.dependentData.contact ? this.data.dependentData.contact.address.zip : "",
                relationshipToEmployee: this.data.dependentData.dependentRelationId,
                birthDate: this.data.dependentData.birthDate,
                homeAddressSameAsEmployee: isMemberAndDependentAddressSame,
            };
            this.dependentFormArray[CONTROLS][0].patchValue(dData);
        }
        this.sharedService
            .getStateZipFlag()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.isLoading = resp;
            });
        this.getUserData();

        // Get Dependents
        this.mService
            .getMemberDependents(this.data.userData.memberId, false, this.data.userData.groupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((dependents) => (this.dependentList = dependents));

        this.initializeEnableDependentAddressModal();
    }

    /**
     * Method to get the logged in data for the member
     */
    getUserData(): void {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential) => {
            this.loggedInData = credential;
        });
    }
    /**
     * This method is used to initialize dependent form group
     * @returns void
     */
    getDependentFormGroup(): FormGroup {
        const MAX_LENGTH = 100;
        this.maxDate.push(new Date());
        this.minDate.push(null);
        return this.fb.group({
            firstName: ["", Validators.compose([Validators.required, Validators.pattern(this.formValidations.NAME_WITH_SPACE_ALLOWED)])],
            lastName: ["", Validators.compose([Validators.required, Validators.pattern(this.formValidations.NAME_WITH_SPACE_ALLOWED)])],
            birthDate: [""],
            gender: ["", Validators.required],
            address1: ["", [Validators.required, Validators.pattern(this.formValidations.ADDRESS), Validators.maxLength(MAX_LENGTH)]],
            address2: ["", [Validators.pattern(this.formValidations.ADDRESS), Validators.maxLength(MAX_LENGTH)]],
            city: [
                "",
                [Validators.required, Validators.pattern(this.formValidations.NAME_WITH_SPACE_ALLOWED), Validators.maxLength(MAX_LENGTH)],
            ],
            state: ["", Validators.required],
            zip: ["", Validators.compose([Validators.required, Validators.pattern(this.formValidations.ZIP_CODE)])],
            relationshipToEmployee: ["", Validators.required],
            homeAddressSameAsEmployee: [false],
        });
    }
    /**
     * This getter method is used to retrieve dependent form array
     * @returns FormArray
     */
    get dependentFormArray(): FormArray {
        return this.dependentForm.get(FORMS) as FormArray;
    }
    /**
     * This method is used to update address fields based on user selection
     * @param {{boolean}} isHomeAddressSameAsEmployee represents the index of the formGroup
     * @param {{number}} index represents the index of the formGroup
     * @returns void
     */
    sameAsEmployeeChange(isHomeAddressSameAsEmployee: boolean, index: number): void {
        this.isHomeAddressSameAsEmployee = isHomeAddressSameAsEmployee;
        this.populateHomeAddress(index);
    }
    /**
     * This method is used to compare member and dependent address
     * @param {{DependentContact}} memberAddress represents the member address
     * @param {{DependentContact}} dependentAddress represents the dependent address
     * @returns {boolean} returns boolean flag
     */
    compareMemberAndDependentAddress(memberAddress: DependentContact, dependentAddress: DependentContact): boolean {
        const memberAddr = memberAddress.address;
        const dependentAddr = dependentAddress.address;
        const keys = new Set(Object.keys(memberAddr).concat(Object.keys(dependentAddr)));
        let flag = true;
        keys.forEach((key) => {
            if (
                !(memberAddr[key] === dependentAddr[key]) &&
                ((memberAddr[key] && memberAddr[key] === "" && dependentAddr[key] && dependentAddr[key] !== null) ||
                    (!memberAddr[key] && dependentAddr[key] && dependentAddr[key] !== null) ||
                    (!dependentAddr[key] && memberAddr[key] && memberAddr[key] !== null))
            ) {
                flag = false;
            } else if (memberAddr[key] && dependentAddr[key] && memberAddr[key] !== dependentAddr[key]) {
                flag = false;
            }
        });
        return flag;
    }
    /**
     * This method is used to populate home address based on matching member with dependent address
     * This also enables/disables the address fields
     * @param {{number}} index represents the index of the formGroup
     * @returns void
     */
    populateHomeAddress(index: number): void {
        if (this.isHomeAddressSameAsEmployee) {
            if (this.data.userData) {
                this.getFormGroupControls(index).patchValue({
                    address1: this.data.userData.contact.address.address1,
                    address2: this.data.userData.contact.address.address2,
                    city: this.data.userData.contact.address.city,
                    state: this.data.userData.contact.address.state,
                    zip: this.data.userData.contact.address.zip,
                    country: this.data.userData.contact.address.country,
                });
            }
            this.getFormGroupControls(index).controls.address1.disable();
            this.getFormGroupControls(index).controls.address2.disable();
            this.getFormGroupControls(index).controls.city.disable();
            this.getFormGroupControls(index).controls.state.disable();
            this.getFormGroupControls(index).controls.zip.disable();
        } else {
            if (this.data.dependentData) {
                this.getFormGroupControls(index).patchValue({
                    address1: this.data.dependentData.contact.address.address1,
                    address2: this.data.dependentData.contact.address.address2,
                    city: this.data.dependentData.contact.address.city,
                    state: this.data.dependentData.contact.address.state,
                    zip: this.data.dependentData.contact.address.zip,
                });
            }
            this.getFormGroupControls(index).controls.address1.enable();
            this.getFormGroupControls(index).controls.address2.enable();
            this.getFormGroupControls(index).controls.city.enable();
            this.getFormGroupControls(index).controls.state.enable();
            this.getFormGroupControls(index).controls.zip.enable();
        }
    }
    /**
     * This method is used to retrieve the form group
     * @param {{number}} index represents the index of the formGroup
     * @returns void
     */
    getFormGroupControls(index: number): FormGroup {
        return this.dependentFormArray[CONTROLS][index] as FormGroup;
    }
    /**
     * This method is used to retrieve the primary language strings
     * @returns void
     */
    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.enrollmentWizard.gender",
            "primary.portal.enrollmentWizard.state",
            "primary.portal.enrollmentWizard.zip",
            "primary.portal.enrollmentWizard.birthday",
            "primary.portal.enrollmentWizard.addDependents",
            "primary.portal.enrollmentWizard.editDependent",
            "primary.portal.enrollmentWizard.editInfo",
            "primary.portal.enrollmentWizard.firstName",
            "primary.portal.enrollmentWizard.lastName",
            "primary.portal.enrollmentWizard.relationshipTo",
            "primary.portal.enrollmentWizard.remove",
            "primary.portal.enrollmentWizard.addAnotherDependent",
            "primary.portal.enrollmentWizard.saveDependent",
            "primary.portal.enrollmentWizard.save",
            "primary.portal.enrollmentWizard.cancel",
            "primary.portal.common.close",
            "primary.portal.members.dependentValidationMsg.birthDateMsg1",
            "primary.portal.members.dependentValidationMsg.birthDateMsg2",
            "primary.portal.members.personalLabel.streetAddress1",
            "primary.portal.members.personalLabel.streetAddress2",
            "primary.portal.members.personalLabel.city",
            "primary.portal.common.optional",
            "primary.portal.members.personalLabel.AptOrUnit",
            "primary.portal.members.personalValidationMsg.maxlength100",
            "primary.portal.members.personalValidationMsg.streetAddress1",
            "primary.portal.members.personalValidationMsg.streetAddress2",
            "primary.portal.members.dependent.personalInfo.optionYes",
            "primary.portal.members.dependent.personalInfo.sameAsPrimaryAddress",
            "primary.portal.common.city.patternError",
        ]);
    }
    /**
     * This method is used to check birth date for all form groups
     */
    checkBirthDateForAllFormGroups(): void {
        this.dependentFormArray[CONTROLS].forEach((fgroup, $index) => {
            fgroup[CONTROLS]["birthDate"].valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
                this.checkDependentBirthDate(fgroup[CONTROLS], $index);
            });
        });
    }
    /**
     *
     * This method will trigger on init for fetching secondary languages
     */
    getSecondaryLanguageStrings(): void {
        this.secondaryLanguageStrings = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.common.invalidDateFormat",
            "secondary.portal.members.requiredField",
            "secondary.portal.members.personalValidationMsg.city",
            "secondary.portal.census.manualEntry.futureDate",
        ]);
    }
    /**
     *
     * Used to get configurations
     */
    getConfig(): void {
        // Used to get global on/off switch for address validation.
        this.staticUtilService
            .cacheConfigValue(OVER_ALL_ADDRESS_VERIFICATION)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.addressValidationSwitch = resp && resp.toLowerCase() === AppSettings.TRUE.toLowerCase();
            });
    }
    closeDialog(): void {
        this.dialogRef.close(this.isQleUdpate);
    }
    getDropdownValuesFromAPI(): void {
        const array: [Observable<CountryState[]>, Observable<string[]>, Observable<Relations[]>] = [
            this._staticService.getStates(),
            this._staticService.getGenders(),
            this._accountService.getDependentRelations(this.data.userData.groupId),
        ];

        this.isLoading = true;
        forkJoin(array)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((dataList) => {
                this.states = dataList[0];
                this.genders = dataList[1].filter((x) => x !== Gender.UNKNOWN);
                this.relations = dataList[2];
                this.checkBirthDateForAllFormGroups();
                this.isLoading = false;
            });
    }
    /**
     * This method is used to update dependent details
     * @returns void
     */
    updateDependent(): void {
        this.isAddressValuesChanged = false;
        this.hasError = false;
        this.errorMsg = "";
        const dependentForm = this.dependentForm.get(FORMS)[CONTROLS][0];
        const depFormControls = dependentForm.controls;
        if (
            depFormControls.address1.dirty ||
            depFormControls.address2.dirty ||
            depFormControls.city.dirty ||
            depFormControls.state.dirty ||
            depFormControls.zip.dirty
        ) {
            this.isAddressValuesChanged = true;
        }
        const dependentFormValue = dependentForm.getRawValue();
        this.checkQleUpdate(dependentFormValue);
        this.dependentFullProfile = {
            id: this.data.dependentData.id,
            name: {
                firstName: dependentFormValue.firstName,
                lastName: dependentFormValue.lastName,
            },
            contact: {
                address: {
                    address1: dependentFormValue.address1,
                    address2: dependentFormValue.address2,
                    city: dependentFormValue.city,
                    state: dependentFormValue.state,
                    zip: dependentFormValue.zip,
                },
            },
            gender: dependentFormValue.gender,
            dependentRelationId: dependentFormValue.relationshipToEmployee,
            birthDate: this.datepipe.transform(dependentFormValue.birthDate, DateFormats.YEAR_MONTH_DAY),
            state: dependentFormValue.state,
        };

        if (this.data.dependentData.dependentRelationId !== -1) {
            this.isLoading = true;
            this.updateDependentData(this.dependentFullProfile);
        } else {
            this.memberFullProfile = { ...this.data.userData };
            this.memberFullProfile.name = {
                ...this.memberFullProfile.name,
                firstName: dependentFormValue.firstName,
                lastName: dependentFormValue.lastName,
            };
            const mcontact = { ...this.memberFullProfile.contact };
            const maddress = {
                ...mcontact.address,
                address1: dependentFormValue.address1,
                address2: dependentFormValue.address2,
                city: dependentFormValue.city,
                state: dependentFormValue.state,
                zip: dependentFormValue.zip,
            };
            mcontact.address = { ...maddress };
            this.memberFullProfile.contact = { ...mcontact };
            this.memberFullProfile.gender = dependentFormValue.gender;
            this.memberFullProfile.birthDate = this.datepipe.transform(dependentFormValue.birthDate, DateFormats.YEAR_MONTH_DAY);
            if (this.memberFullProfile.contact) {
                this.memberFullProfile.contact.addressValidationDate = undefined;
            }
            this.isLoading = true;
            const updatedData: string[] = [];
            if (this.data.dependentData.name.firstName !== this.memberFullProfile.name.firstName) {
                updatedData.push(
                    `${this.languageStrings["primary.portal.enrollmentWizard.firstName"]} : ${this.memberFullProfile.name.firstName}`,
                );
            }
            if (this.data.dependentData.name.lastName !== this.memberFullProfile.name.lastName) {
                updatedData.push(
                    `${this.languageStrings["primary.portal.enrollmentWizard.lastName"]} : ${this.memberFullProfile.name.lastName}`,
                );
            }
            if (this.data.dependentData.contact.address.address1 !== this.memberFullProfile.contact.address.address1) {
                const address1 = this.memberFullProfile.contact.address.address1;
                updatedData.push(`${this.languageStrings["primary.portal.members.personalLabel.streetAddress1"]} : ${address1}`);
            }
            if (this.data.dependentData.contact.address.address2 !== this.memberFullProfile.contact.address.address2) {
                const address2 = this.memberFullProfile.contact.address.address2;
                updatedData.push(`${this.languageStrings["primary.portal.members.personalLabel.streetAddress2"]} : ${address2}`);
            }
            if (this.data.dependentData.contact.address.city !== this.memberFullProfile.contact.address.city) {
                updatedData.push(
                    `${this.languageStrings["primary.portal.members.personalLabel.city"]} : ${this.memberFullProfile.contact.address.city}`,
                );
            }
            if (this.data.dependentData.contact.address.state !== this.memberFullProfile.contact.address.state) {
                updatedData.push(
                    `${this.languageStrings["primary.portal.enrollmentWizard.state"]} : ${this.memberFullProfile.contact.address.state}`,
                );
            }
            if (this.data.dependentData.contact.address.zip !== this.memberFullProfile.contact.address.zip) {
                updatedData.push(
                    `${this.languageStrings["primary.portal.enrollmentWizard.zip"]} : ${this.memberFullProfile.contact.address.zip}`,
                );
            }
            if (this.data.dependentData.gender !== this.memberFullProfile.gender) {
                updatedData.push(`${this.languageStrings["primary.portal.enrollmentWizard.gender"]} : ${this.memberFullProfile.gender}`);
            }
            if (updatedData.length) {
                this.checkCifNumber(updatedData);
            } else {
                this.saveUpdatedData();
            }
        }
    }

    /**
     * This function checks if the member has CIF number or not
     * @param updatedData updated member profile data
     */
    checkCifNumber(updatedData: string[]): void {
        combineLatest([
            this.mService.getMember(this.data.userData.memberId, true, this.data.userData.groupId),
            this.sharedService.getStandardDemographicChangesConfig(),
        ])
            .pipe(
                switchMap(([profileData, isStandaloneDemographicEnabled]) => {
                    const hasCifNumber = profileData.body.customerInformationFileNumber !== undefined;
                    if (hasCifNumber && isStandaloneDemographicEnabled) {
                        this.openProfileChangesConfirmModal(updatedData);
                    } else {
                        this.saveUpdatedData();
                    }
                    return of(null);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * This function opens profile changes confirmation modal
     * @param updatedData updated member profile data
     * @returns void
     */
    openProfileChangesConfirmModal(updatedData: string[]): void {
        this.isLoading = false;
        this.empoweredModalService
            .openDialog(ProfileChangesConfirmPromptComponent, {
                data: {
                    data: updatedData,
                    isAgentAssisted: false,
                },
            })
            .afterClosed()
            .pipe(
                filter((isSaved) => !!isSaved),
                switchMap(() => {
                    this.saveUpdatedData();
                    return of(null);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * This function verifies address change and saves the updated profile data
     */
    saveUpdatedData(): void {
        this.isLoading = true;
        if (this.addressValidationSwitch && this.isAddressValuesChanged) {
            this.verifyAddressDetails(this.memberFullProfile);
        } else {
            this.updateMemberData(this.memberFullProfile)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (res) => {
                        this.isLoading = false;
                        this.closeDialog();
                    },
                    (err) => {
                        this.isLoading = false;
                        this.showErrorAlertMessage(err);
                    },
                );
        }
    }

    /**
     *
     * This function is used to update dependent and dependent contact data.
     * @param dependentData contain Member dependent data and dependent contact data.
     * @returns void
     */
    updateDependentData(dependentData: DependentFullProfile): void {
        this.hasError = false;
        this.errorMsg = "";
        const contactUpdate$ = this.membersBusinessService
            .verifyAddress(dependentData.contact.address, this.mService, this.empoweredModalService, this.language, this.staticUtilService)
            .pipe(
                tap((result) => (this.isLoading = Boolean(result))),
                filter(Boolean),
                switchMap((address: PersonalAddress) =>
                    this.mService.saveDependentContact(
                        { ...dependentData.contact, address },
                        this.data.userData.memberId,
                        dependentData.id.toString(),
                        this.data.userData.groupId,
                    ),
                ),
                catchError((error) => {
                    this.showErrorAlertMessage(error);
                    this.isLoading = false;
                    return EMPTY;
                }),
            );
        this.mService
            .updateMemberDependent(
                dependentData,
                this.data.userData.memberId,
                this.data.dependentData.id.toString(),
                this.data.userData.groupId,
            )
            .pipe(
                switchMap((response) => iif(() => this.isAddressValuesChanged, contactUpdate$, of(null))),
                switchMap((response) => this.store.dispatch(new UpdateDependentInList(dependentData))),
                tap(() => {
                    this.isLoading = false;
                    this.closeDialog();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     *
     *This function is used for updating member and member contact data
     *   we don't have any  specific model for this combination, so using any
     * @returns Observable<void>
     * @param memberData
     */
    updateMemberData(memberData: MemberFullProfile): Observable<void> {
        this.isLoading = true;
        return this.mService.updateFullMemberProfile(memberData, this.data.userData.groupId.toString()).pipe(
            switchMap(() =>
                this.mService.saveMemberContact(
                    this.data.userData.memberId,
                    this.STR_HOME,
                    this.memberFullProfile.contact,
                    this.data.userData.groupId.toString(),
                ),
            ),
            switchMap(() => this.mService.getMemberDependents(this.data.userData.memberId, true, this.data.userData.groupId)),
            switchMap((dependentList) => {
                if (dependentList?.length) {
                    dependentList.forEach((dependent) => {
                        if (this.dependentFullProfile.id === dependent.id) {
                            this.dependentFullProfile.contact.address = dependent.address;
                        }
                    });
                    this.store.dispatch(new UpdateDependentInList(this.dependentFullProfile));
                }
                return of(null);
            }),
            switchMap(() => {
                const userData = { ...this.loggedInData };
                userData.name = memberData.name;
                this.userService.setUserCredential(userData);
                return this.store.dispatch(new SetUserData(memberData));
            }),
            finalize(() => (this.isLoading = false)),
        );
    }
    /**
     * This method is used for adding form group to an array
     * @returns void
     */
    addAnotherDependentForm(): void {
        this.hasError = false;
        this.errorMsg = "";
        this.dependentFormArray.push(this.getDependentFormGroup());
    }
    /**
     * This method is used to save dependent details
     * @returns void
     */
    saveDependent(): void {
        let count = 0;
        this.dependentForm.get(FORMS)[CONTROLS].forEach((fgroup) => {
            const dependent = this.getDependentObject(fgroup.getRawValue());
            this.membersBusinessService
                .verifyAddress(dependent.contact.address, this.mService, this.empoweredModalService, this.language, this.staticUtilService)
                .pipe(
                    filter(Boolean),
                    tap((result) => (this.isLoading = true)),
                    switchMap((address) =>
                        this.mService.createMemberDependent(dependent, this.data.userData.memberId, this.data.userData.groupId).pipe(
                            map((result) => result.headers.get(LOCATION).split(SLASH).pop()),
                            tap((dependentId) => (dependent.id = dependentId)),
                            switchMap((dependentId) =>
                                this.mService.saveDependentContact(
                                    { ...dependent.contact, address },
                                    this.data.userData.memberId,
                                    dependentId,
                                    this.data.userData.groupId,
                                ),
                            ),
                            switchMap(() => this.store.dispatch(new AddDependentToList(dependent))),
                        ),
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(
                    (cdata) => {
                        count++;
                        if (count === this.dependentFormArray[CONTROLS].length) {
                            this.isLoading = false;
                            this.isQleUdpate = true;
                            this.closeDialog();
                        }
                    },
                    (err) => {
                        count++;
                        if (count === this.dependentFormArray[CONTROLS].length) {
                            this.isLoading = false;
                            this.showErrorAlertMessage(err);
                        }
                    },
                );
        });
    }
    getDependentObject(dependentData: any): any {
        const object = {
            id: dependentData.id,
            name: {
                firstName: dependentData.firstName,
                lastName: dependentData.lastName,
            },
            contact: {
                address: {
                    address1: dependentData.address1,
                    address2: dependentData.address2,
                    city: dependentData.city,
                    state: dependentData.state,
                    zip: dependentData.zip,
                },
            },
            gender: dependentData.gender,
            dependentRelationId: dependentData.relationshipToEmployee,
            birthDate: this.datepipe.transform(dependentData.birthDate, DateFormats.YEAR_MONTH_DAY),
            state: dependentData.state,
        };
        return object;
    }
    getDate(date: any): string {
        return date._i.month + "/" + date._i.date + "/" + date._i.year;
    }
    /**
     *
     * This method will trigger when there will be change in birthDate control in FormGroup
     * @param form contains dependent form
     * @param index contain index of form
     * @returns void
     */
    checkDependentBirthDate(form: DependnentForm, index: number): void {
        this.maxDate[index] = new Date();
        const year = this.maxDate[index].getFullYear();
        const month = this.maxDate[index].getMonth();
        const day = this.maxDate[index].getDate();
        const spouseId = this.relations.filter((dep) => dep.relationType.toLowerCase() === this.SPOUSE)[0].id;
        const childId = this.relations.filter((dep) => dep.relationType.toLowerCase() === this.CHILD)[0].id;
        if (form[this.STR_RELATIONSHIP_TO_EMPLOYEE].value === "") {
            form[this.STR_RELATIONSHIP_TO_EMPLOYEE].setErrors({
                required: true,
            });
            form[this.STR_RELATIONSHIP_TO_EMPLOYEE].markAsTouched();
            return;
        }
        if (form[this.STR_RELATIONSHIP_TO_EMPLOYEE].value === spouseId) {
            this.maxDate[index] = new Date(year - this.SPOUSE_MIN_AGE, month, day);
            this.minDate[index] = null;
        } else if (form[this.STR_RELATIONSHIP_TO_EMPLOYEE].value === childId) {
            this.minDate[index] = new Date(year - this.CHILD_MAX_AGE, month, day);
            this.maxDate[index] = new Date();
        }
        form[this.STR_BIRTH_DATE].markAsTouched();
    }
    /**
     * This method is used to remove dependent form group control
     * @returns void
     */
    removeDependentForm(): void {
        this.dependentFormArray[CONTROLS].pop();
    }
    checkQleUpdate(dependentValue: any): void {
        if (
            this.data.dependentData.name.lastName !== dependentValue.lastName ||
            (this.data.dependentData.contact &&
                (this.data.dependentData.contact.address.state !== dependentValue.state ||
                    this.data.dependentData.contact.address.zip !== dependentValue.zip))
        ) {
            this.isQleUdpate = true;
        }
    }
    /**
     *@description method to handle error message
     * @param {Error} err is used to receive error object
     * @returns {void} It returns void
     * @memberof DependentAddEditComponent
     */
    showErrorAlertMessage(err: Error): void {
        this.hasError = true;
        const errorDetails = err["error"];
        if (errorDetails && errorDetails.status === ClientErrorResponseCode.RESP_400 && errorDetails["details"].length > 0) {
            this.errorMsg = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${errorDetails.status}.${errorDetails.code}.${errorDetails["details"][0].field}`,
            );
        } else if (
            errorDetails &&
            errorDetails.status === ClientErrorResponseCode.RESP_409 &&
            errorDetails.code === ClientErrorResponseType.DUPLICATE
        ) {
            if (errorDetails["details"].length > 0) {
                this.errorMsg = errorDetails.error.message;
            } else {
                this.errorMsg = errorDetails.message;
            }
        } else {
            this.errorMsg = this.language.fetchSecondaryLanguageValue(`secondary.api.${errorDetails.status}.${errorDetails.code}`);
        }
    }

    /**
     *
     * This method is used to verify input address details by using aflac web service
     * and provide suggested address in its response.
     * @param employeeData contains combination of Member profile and member contact data.
     */
    verifyAddressDetails(employeeData: MemberFullProfile): void {
        this.openAddressModal = false;
        this.tempMemberAddress = employeeData.contact.address;
        this.mService
            .verifyMemberAddress(employeeData.contact.address)
            .pipe(
                tap((resp) => {
                    this.addressResp = false;
                    this.isLoading = false;
                    this.suggestedAddress = resp.suggestedAddress;
                    this.memberFullProfile.contact.addressValidationDate = new Date();
                }),
                catchError((errorRes) => {
                    this.addressResp = true;
                    this.isLoading = false;
                    this.addressMessage = [];
                    if (errorRes.status === AppSettings.API_RESP_400) {
                        this.memberFullProfile.contact.addressValidationDate = new Date();
                        if (errorRes.error && errorRes.error.details) {
                            errorRes.error.details.map((item) => this.addressMessage.push(item.message));
                        } else {
                            this.addressMessage.push(
                                this.language.fetchSecondaryLanguageValue("secondary.portal.directAccount.invalidAdressdata"),
                            );
                        }
                    } else if (errorRes.status === AppSettings.API_RESP_500) {
                        this.addressMessage.push(
                            this.language.fetchSecondaryLanguageValue("secondary.portal.accountPendingEnrollments.internalServer"),
                        );
                    } else if (errorRes.error.details.length) {
                        this.addressMessage.push(errorRes.error.details[0].message);
                    }
                    if (!this.openAddressModal) {
                        return this.openModal(ADDRESS_OPTIONS.SINGLE, employeeData, errorRes.status);
                    }
                    return of(errorRes);
                }),
                switchMap((resp) => {
                    if (this.openAddressModal === false && resp && !resp.matched) {
                        return this.openModal(AppSettings.ADDRESS_BOTH_OPTION, employeeData).pipe(catchError((er) => of(er)));
                    }
                    if (resp && resp.matched === true) {
                        return this.updateMemberData(employeeData).pipe(catchError((err) => of(err)));
                    }
                    return of(null);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                (resp) => {
                    this.isLoading = false;
                    this.closeDialog();
                },
                (err) => {
                    this.isLoading = false;
                    this.showErrorAlertMessage(err);
                },
            );
    }
    /**
     *
     * This method is used to open address validation pop-up and show the response.
     * @param option is a string which is used to validating whether this pop-up contains single input or multiple input
     * @param employeeData contains combination of Member profile and member contact data.
     * @param errorStatus API error status
     */
    openModal(option: string, employeeData: MemberFullProfile, errorStatus?: number): Observable<void> {
        this.openAddressModal = true;

        const addressDialog = this.empoweredModalService.openDialog(AddressVerificationComponent, {
            data: {
                suggestedAddress: this.suggestedAddress,
                providedAddress: this.tempMemberAddress,
                addressResp: this.addressResp,
                addressMessage: this.addressMessage,
                option: option,
                errorStatus: errorStatus,
            },
        });

        return addressDialog.afterClosed().pipe(
            tap((elementData) => {
                if (elementData && elementData.data) {
                    this.selectedAddress = elementData.data.selectedAddress;
                }

                if (this.selectedAddress && this.selectedAddress === AppSettings.SUGGESTED_ADDRESS) {
                    employeeData.contact.address = this.suggestedAddress;
                } else {
                    employeeData.contact.address = this.tempMemberAddress;
                }

                if (!elementData || !elementData.data.isVerifyAddress) {
                    this.closeModal();
                }
            }),
            filter((elementData) => elementData?.data?.isVerifyAddress),
            switchMap(() => {
                if (!this.enableDependentAddressModal || !this.dependentList?.length) {
                    return of(null);
                }

                const dependentAddress = this.empoweredModalService.openDialog(DependentAddressUpdateModalComponent, {
                    data: {
                        memberId: this.data.userData.memberId,
                        memberAddress:
                            this.selectedAddress === AppSettings.TEMPORARY_ADDRESS ? this.tempMemberAddress : this.suggestedAddress,
                    },
                });

                return dependentAddress.afterClosed().pipe(map(() => of(null)));
            }),
            switchMap(() => this.updateMemberData(employeeData)),
        );
    }
    /**
     *
     * used to close the address validation pop-up
     */
    closeModal(): void {
        this.openAddressModal = false;
        this.addressResp = false;
    }
    /**
     *
     * This method will triggered on change of birth date control to check valid date
     * @param $event contain event triggered with source element
     * @returns void
     */
    checkDate($event: Event): void {
        const date = this.dateService.toDate($event.target[this.STR_VALUE] || "");
        this.isValidDate = !this.dateService.isValid(date);
    }

    /**
     * This method will trigger when date will be entered or changed
     * @param form contains form of which birth date is invalid
     * @returns error message from languageString as string
     */
    chekMatError(form: FormGroup): string {
        const controlValue = form.controls.birthDate.value;
        let errorMsg = "";
        if (form.controls.birthDate.errors.matDatepickerParse.text) {
            this.isRequired = false;
            errorMsg = this.secondaryLanguageStrings["secondary.portal.common.invalidDateFormat"];
        } else if (!controlValue && !form.controls.birthDate.errors.matDatepickerParse.texts) {
            this.isRequired = true;
            form.controls.birthDate.setErrors({ required: true });
            errorMsg = this.secondaryLanguageStrings["secondary.portal.members.requiredField"];
        }
        return errorMsg;
    }

    /**
     *
     * This method will trigger when there will be invalid date in birth date control
     * @param form contains form of which birth date is invalid
     * @param $event contain event triggered with source element
     * @returns error message from languageString as string
     */
    validateDate(form: FormGroup, event?: Event): string {
        const controlValue = form.controls.birthDate.value;
        const dateInput = this.dateService.toDate(controlValue);
        let errorMsg = "";
        if (controlValue !== null && controlValue !== "" && event) {
            errorMsg = this.secondaryLanguageStrings["secondary.portal.common.invalidDateFormat"];
        } else if (this.today < dateInput) {
            errorMsg = this.secondaryLanguageStrings["secondary.portal.census.manualEntry.futureDate"];
        } else if (!controlValue && this.isRequired) {
            this.isRequired = true;
            form.controls.birthDate.setErrors({ required: true });
            errorMsg = this.secondaryLanguageStrings["secondary.portal.members.requiredField"];
        }
        return errorMsg;
    }
    /**
     *
     * This method will trigger when there will be change in relationship
     * @param form contains dependent form
     * @param i contain index of form
     * @returns void
     */
    checkBirthDateOnRelationshipChange(form: DependnentForm, i: number): void {
        this.checkDependentBirthDate(this.dependentForm.get(FORMS)[CONTROLS][i].controls, i);
    }

    /**
     * This function is used to validate state and zip code.
     * @param value zip code input
     * @param form dependentForm.
     */
    checkZipCode(value: string, form: FormGroup): void {
        const zipFormControl = form.controls.zip;
        const stateValue = form.controls.state.value;
        this.allSubscriptions.push(validateStateAndZipCode(stateValue, value, zipFormControl, this._staticService, this.sharedService));
    }

    private initializeEnableDependentAddressModal(): void {
        this.staticUtilService
            .cacheConfigValue(AddressConfig.ENABLE_DEPENDENT_ADDRESS_MODAL)
            .pipe(filter(Boolean), takeUntil(this.unsubscribe$))
            .subscribe((enableDependentAddressModal: string) => {
                this.enableDependentAddressModal = enableDependentAddressModal.toLowerCase() === BooleanConst.TRUE;
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
