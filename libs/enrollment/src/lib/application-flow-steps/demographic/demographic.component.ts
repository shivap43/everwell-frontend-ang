/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import {
    EnrollmentState,
    SetSSNData,
    SetMemberData,
    SetEmployeeId,
    SetDependentMember,
    UpdateSkippedStepResponses,
    SharedState,
    AppFlowService,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";

import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { Store, Select } from "@ngxs/store";
import { FormBuilder, FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from "@angular/forms";
import {
    ShoppingCartDisplayService,
    DemographicsFields,
    StaticService,
    MemberService,
    EmailTypes,
    MemberIdentifier,
    MemberIdentifierTypeIDs,
} from "@empowered/api";
import { Observable, Subject, Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";
import {
    ConfigName,
    MASK_SSN_FORMAT,
    CarrierId,
    ResponsePanel,
    ResponseItem,
    StepConstraints,
    AllConstraint,
    Salary,
    AppSettings,
    RiderCart,
    Demographics,
    GetCartItems,
    MemberProfile,
    Relations,
    MemberDependent,
    MemberContact,
    StepType,
    Relation,
    StepTitle,
} from "@empowered/constants";

const PARTIALLY_MASKED_SSN = "PARTIALLY_MASKED";
const FULLY_MASKED_SSN = "FULLY_MASKED";
const FULLY_VISIBLE_SSN = "FULLY_VISIBLE";

import { HttpErrorResponse } from "@angular/common/http";
import { ClientErrorResponseCode } from "@empowered/constants";
import { catchError, takeUntil, tap } from "rxjs/operators";

const SELECT = "Select";
const FT_UNIT = 12;

@Component({
    selector: "empowered-demographic",
    templateUrl: "./demographic.component.html",
    styleUrls: ["./demographic.component.scss"],
})
export class DemographicComponent implements OnInit, OnDestroy {
    @Input() planObject;
    @Input() currentSectionIndex: number;
    @Input() currentStepIndex: number;
    ssnFormat = MASK_SSN_FORMAT;
    planFlowId: number;
    planFlowStepId: number;
    isNotProduction$: Observable<boolean>;
    planId: number;
    itemId: number;
    demographicsForm: FormGroup;
    stepTitle = StepTitle;
    stepType = StepType;
    stepsData: any;
    demographicsDirection: string;
    memberDemographics: Demographics;
    spouseDemographics: Demographics;
    childDemographics: Demographics;
    demographicsFields = DemographicsFields;
    appResponses: ResponseItem;
    arrayOfValues = [];
    showError = false;
    stateDropDown = [];
    hasApiError = false;
    mpGroup;
    ssnResponse: string;
    memberId;
    errorMessage: string;
    userHeight = AppSettings.HEIGHT;
    userDriverLicenseState = AppSettings.DRIVERS_LICENSE_STATE;
    heightFeet = AppSettings.MEMBER_HEIGHTINFEET;
    heightInches = AppSettings.MEMBER_HEIGHTININCH;
    contactTime = AppSettings.DEMOGRAPHICS_CONTACT_TIME;
    preferredContactTime = AppSettings.PREFERRED_CONTACT_TIME;
    getMemberResponse: any;
    memberProfileData: MemberProfile;
    height: number;
    displayFields: any;
    loadSpinner = false;
    arrayFields = [];
    modifiedSSN;
    saveMemberContactDetails;
    defaultDriversState = "AL";
    previousMemberResponse;
    data: any;
    previousHeight;
    previousWeight;
    previousHeightFeet;
    previousHeightInches;
    previousDriversState;
    previousDriversNo;
    getPrePopulatedData;
    getPrePopulatedSSN;
    getMemberContactDetails: MemberContact;
    previousSSN;
    SSNDisplay = false;
    @Select(SharedState.regex) regex$: Observable<any>;
    validationRegex: any;
    showTitle = true;
    previousSalary: any;
    hoursPerWeek: any;
    getMemberEmail: any[];
    getMemberPreferredContactTime: string;
    getContactDetails: MemberContact;
    getEmployeeId: string;
    saveEmployeeId;
    formPrefilled = true;
    previousSalaryInfo: any;
    saveSalaryInfoData: any;
    arrayOfDistinctValues = [];
    previousContactInfo: any;
    tempSalaryInfo: Salary;
    dependentRelations: Relations[];
    dependents: MemberDependent[];
    getDependentsData: MemberDependent;
    childDependent = false;
    spouseDependent = false;
    getDependentsRelation: Relations;
    riderCartData: RiderCart;
    cartData: GetCartItems;
    minLengthSSN = 9;
    dependentId: number;
    driverLicenseState: string;
    customPattern = { X: { pattern: new RegExp("\\d"), symbol: "X" }, 0: { pattern: new RegExp("\\d") } };
    ssnMaskedPattern = { X: { pattern: new RegExp("\\d"), symbol: "X" }, 0: { pattern: new RegExp("\\d") } };
    ssnUnmaskedPattern = { X: { pattern: new RegExp("\\d"), symbol: null }, 0: { pattern: new RegExp("\\d") } };
    isMaskedTrue: boolean;
    isShowHideButtonVisible: boolean;
    isSSNValue: boolean;
    subscriptions: Subscription[] = [];
    ftSelect = SELECT;
    formName = "demographic-content-form";
    languageStrings: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.applicationFlow.demographics.saveResponseError",
        "secondary.portal.applicationFlow.demographics.invalidSSN",
        "secondary.portal.applicationFlow.demographics.duplicateSSN",
        "secondary.portal.applicationFlow.demographics.duplicateEmployeeID",
        "secondary.portal.applicationFlow.demographics.invalidEmployeeId",
        "secondary.portal.applicationFlow.demographics.requiredField",
        "secondary.portal.applicationFlow.demographics.selectionRequired",
        "secondary.portal.applicationFlow.demographics.invalidFormat",
        "secondary.portal.applicationFlow.demographics.invalidSSNMessage",
        "secondary.portal.applicationFlow.demographics.invalidWeight",
        "secondary.portal.applicationFlow.demographics.invalidHeight",
        "secondary.portal.applicationFlow.demographics.minHours",
    ]);
    languagePrimaryStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.next",
        "primary.portal.applicationFlow.debug.planFlow",
        "primary.portal.applicationFlow.debug.planFlowStep",
        "primary.portal.common.selectFt",
        "primary.portal.common.selectIn",
        "primary.portal.members.personalLabel.select",
        "primary.portal.applicationFlow.state.select",
        "primary.portal.common.show",
        "primary.portal.common.hide",
        "primary.portal.applicationFlow.lbs",
        "primary.portal.members.personalLabel.heightFeet",
        "primary.portal.members.personalLabel.heightInches",
    ]);
    queryString = [
        "input.ng-invalid",
        "mat-radio-group.ng-invalid > mat-radio-button",
        "textarea.ng-invalid, mat-select.ng-invalid",
        "mat-selection-list.ng-invalid > mat-list-option",
    ].join(",");
    isAgPlan = false;
    enrollmentState: string;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly appFlowService: AppFlowService,
        private readonly staticService: StaticService,
        private readonly memberService: MemberService,
        private readonly language: LanguageService,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
        private readonly utilService: UtilService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /**
     * Implements Angular OnInit Life Cycle hook
     * loads data required for component
     */
    ngOnInit(): void {
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.demographicsForm = this.fb.group({});
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        this.loadApplicationResponses();
        this.getStatesResponse();
        this.getEmployeeIdData();
        this.createDemographicsData();
        this.getMemberDemographics();
        this.getSpouseDemographics();
        this.getChildDemographics();

        this.demographicsForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((change) => {
            if (
                this.demographicsForm.dirty &&
                !this.planObject.rider &&
                (this.planObject.currentSection.sectionId !== this.currentSectionIndex ||
                    this.planObject.currentStep !== this.currentStepIndex)
            ) {
                this.planObject.reinstate
                    ? this.appFlowService.updateReinstateActiveStepDetails$.next({
                        currentSectionIndex: this.planObject.currentSection.sectionId,
                        currentStepIndex: this.planObject.currentStep,
                    })
                    : this.appFlowService.updateActiveStepDetails$.next({
                        currentSectionIndex: this.planObject.currentSection.sectionId,
                        currentStepIndex: this.planObject.currentStep,
                        planObject: this.planObject,
                    });
            }
        });
        this.planFlowId = this.planObject.application.appData.id;
        this.planFlowStepId = this.planObject.steps[0].id;
        this.isNotProduction$ = this.appFlowService.isNotProduction();
        this.getSSNConfiguration();
    }
    /**
     * loads application responses from store
     */
    loadApplicationResponses(): void {
        this.appResponses = this.store
            .selectSnapshot(EnrollmentState.GetResponseItems)
            .filter(
                (resp) =>
                    resp.application.planId === this.planObject.application.planId &&
                    (this.planObject.reinstate || resp.application.cartItemId === this.planObject.application.cartData.id),
            )
            .pop();
    }

    createDemographicsData(): void {
        this.planId = this.planObject.application.appData.planId;
        this.cartData = this.planObject.application.cartData;
        this.riderCartData = this.getRiderCartDataFromCart(this.cartData);
        this.stepsData = this.planObject.steps[0];
        this.demographicsDirection = this.stepsData.directions;
    }
    getRiderCartDataFromCart(baseCartData: any): RiderCart {
        return baseCartData.riders
            ? this.cartData.riders.length > 0
                ? this.cartData.riders.filter((rider) => rider.planId === this.planId).pop()
                : null
            : null;
    }
    displayField(): void {
        this.displayFields = {
            weight: AppSettings.WEIGHT,
            drivers_license_number: AppSettings.DRIVERS_LICENSE_NO,
            ssn: AppSettings.SSN,
            hours_per_week: AppSettings.HOURSPERWEEK,
            employeeId: AppSettings.EMPLOYEE_ID,
            email: AppSettings.EMAIL,
        };
        this.arrayOfDistinctValues.forEach((item) => {
            Object.keys(this.displayFields).forEach((field) => {
                if (field === item) {
                    const value = this.displayFields[field];
                    this.arrayFields.push(value);
                }
            });
        });
    }
    // Demographics for member
    getMemberDemographics(): void {
        this.memberDemographics = {
            optional: this.stepsData.member.optional,
            required: this.stepsData.member.required,
        };
        if (this.memberDemographics.optional.length > 0 || this.memberDemographics.required.length > 0) {
            this.getPreviousMemberData(false);
            this.getPreviousSSNData();
            this.memberDemographics.optional.length > 0
                ? this.checkOptional(this.memberDemographics)
                : this.checkRequired(this.memberDemographics);
        }
    }
    // Demographics for spouse
    getSpouseDemographics(): void {
        this.spouseDemographics = {
            optional: this.stepsData.spouse.optional,
            required: this.stepsData.spouse.required,
        };
        if (this.spouseDemographics.optional.length || this.spouseDemographics.required.length) {
            this.spouseDependent = true;
            this.getDependents();
            this.checkChildSpouseData("SPOUSE");
            this.getPreviousSSNData();
        }
        if (this.spouseDemographics.optional.length > 0 || this.spouseDemographics.required.length > 0) {
            this.spouseDemographics.optional.length > 0
                ? this.checkOptional(this.spouseDemographics)
                : this.checkRequired(this.spouseDemographics);
        }
    }
    // Demographics for child
    getChildDemographics(): void {
        this.childDemographics = {
            optional: this.stepsData.child.optional,
            required: this.stepsData.child.required,
        };
        if (this.childDemographics.optional.length || this.childDemographics.required.length) {
            this.childDependent = true;
            this.getDependents();
            this.checkChildSpouseData("CHILD");
            this.getPreviousSSNData();
            this.demographicsForm = this.fb.group({});
            this.childDemographics.optional.length
                ? this.checkOptional(this.childDemographics)
                : this.checkRequired(this.childDemographics);
        }
    }
    /**
     * Gets spouse or child dependent data
     * @param dependent indicates CHILD/ SPOUSE to get dependent data
     */
    checkChildSpouseData(dependent: string): void {
        if (dependent === Relation.CHILD) {
            this.getChildDependentId();
        }
        this.dependents = this.utilService.copy(this.store.selectSnapshot(EnrollmentState.GetMemberDependents));
        this.getDependentsRelation = this.dependentRelations.filter((data) => data.code === dependent).pop();
        this.getDependentsData = this.dependents
            .filter((value) =>
                this.dependentId ? value.id === this.dependentId : value.dependentRelationId === this.getDependentsRelation.id,
            )
            .pop();
        if (this.getDependentsData) {
            this.getPreviousResponseValues(this.getDependentsData.profile);
        }
    }
    /**
     * gets selected child dependent id for store or previous responses
     */
    getChildDependentId(): void {
        const constraintValues: StepConstraints = this.store
            .selectSnapshot(EnrollmentState.GetConstraint)
            .filter((constraintData) => constraintData.cartId === this.planObject.application.cartData.id)
            .pop();
        if (constraintValues) {
            this.dependentId = constraintValues[AllConstraint.DEPENDENT_CHILD_ID];
        }
        if (!this.dependentId && this.appResponses && this.appResponses.response) {
            const dependentsResponse: ResponsePanel = this.appResponses.response
                .filter((response) => response.type === StepType.DEPENDENTSKAISER || response.type === StepType.DEPENDENTS)
                .pop();
            if (dependentsResponse && dependentsResponse.value && dependentsResponse.value.length) {
                this.dependentId = +dependentsResponse.value[0];
            }
        }
    }

    /**
     * update the validity of dependent form
     * @param dependentForm - instance of dependent form.
     */
    updateValidity(dependentForm: AbstractControl): void {
        if (!dependentForm.value) {
            dependentForm.markAsPristine();
            dependentForm.markAsUntouched();
        }
        dependentForm.updateValueAndValidity({ emitEvent: false });
    }

    /**
     * Update validator based on value of Independent field.
     * @param independentFormName - Form control Name of independent form
     * @param dependentFormName - dependent form control name
     * @param optionalValidator - optional validator
     */
    conditionalMandatory(independentFormName: string, dependentFormName: string, optionalValidator?: ValidatorFn): void {
        const independentForm = this.demographicsForm.get(independentFormName);
        const dependentForm = this.demographicsForm.get(dependentFormName);
        if (independentForm && dependentForm) {
            independentForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((val) => {
                if (val || this.driverLicenseState) {
                    const validators = optionalValidator ? [optionalValidator, Validators.required] : [Validators.required];
                    dependentForm.setValidators(validators);
                } else {
                    const validators = optionalValidator ? [optionalValidator] : null;
                    dependentForm.setValidators(validators);
                }
                this.updateValidity(dependentForm);
            });
        }
    }
    /**
     * To check optional fields
     * @param demographic Demographics is an array of optional and required
     * @returns void
     */
    checkOptional(demographic: Demographics): void {
        demographic.optional.forEach((item) => {
            if (item === this.demographicsFields.DRIVERSLICENSESTATE && !this.previousDriversState) {
                this.formPrefilled = false;
                this.addOptionalControl(item, null);
            } else if (item === this.demographicsFields.DRIVERSLICENSENO && !this.previousDriversNo) {
                this.formPrefilled = false;
                this.addOptionalControl(item, null);
                this.demographicsForm.controls.drivers_license_number.setValidators(
                    Validators.pattern(new RegExp(this.validationRegex.ALPHANUMERIC)),
                );
                this.driverLicenseState = demographic.required.find((state) => state === this.demographicsFields.DRIVERSLICENSESTATE);
                if (this.driverLicenseState) {
                    this.formPrefilled = false;
                    this.addRequiredControl(this.driverLicenseState, null);
                }
            } else if (
                item === this.demographicsFields.SSN &&
                !this.previousSSN &&
                ((!this.childDependent && !this.spouseDependent) || this.getDependentsData)
            ) {
                this.showTitle = false;
                this.formPrefilled = false;
                this.addOptionalControl(item, null);
                this.demographicsForm.controls[this.demographicsFields.SSN].setValidators([
                    Validators.minLength(this.minLengthSSN),
                    Validators.pattern(this.validationRegex.SSN),
                ]);
            }
        });
        this.arrayOfDistinctValues = [...new Set(this.arrayOfValues)];
        this.checkIfAlreadyFilled();
        this.conditionalMandatory(
            this.demographicsFields.DRIVERSLICENSESTATE,
            this.demographicsFields.DRIVERSLICENSENO,
            Validators.pattern(new RegExp(this.validationRegex.ALPHANUMERIC)),
        );
        this.conditionalMandatory(this.demographicsFields.DRIVERSLICENSENO, this.demographicsFields.DRIVERSLICENSESTATE);
    }
    /**
     * @description Adds required fields by setting the prefilled to false and calls the addRequiredControl
     * @param item {string} the item to be added to the form control
     */
    addRequiredFields(item: string): void {
        this.formPrefilled = false;
        this.addRequiredControl(item, null);
    }
    /**
     * @description Checks whether the license criteria is needed to be displayed
     * @param item {string} the string containing the required values
     */
    checkRequiredLicenseCriteria(item: string): void {
        if (item === this.demographicsFields.DRIVERSLICENSESTATE && !this.previousDriversState) {
            this.addRequiredFields(item);
        } else if (item === this.demographicsFields.DRIVERSLICENSENO && !this.previousDriversNo) {
            this.addRequiredFields(item);
        }
    }
    /**
     * @description To get the optional and required values
     * @param demographic {optional: string[], required: string[]} the array of required field name strings
     */
    checkRequired(demographic: { optional: string[]; required: string[] }): void {
        const isNotContactTimeOfDay = this.getMemberContactDetails && !this.getMemberContactDetails.contactTimeOfDay;
        demographic.required.forEach((item) => {
            this.checkRequiredLicenseCriteria(item);
            if (item === this.demographicsFields.PREFFEREDCONTACTTIME && isNotContactTimeOfDay) {
                this.formPrefilled = false;
                this.addRequiredControl(item, this.contactTime[0]);
            } else if (item === this.demographicsFields.SALARY && !this.previousSalaryInfo) {
                this.addRequiredFields(item);
            } else if (item === this.demographicsFields.HOURSPERWEEK) {
                this.formPrefilled = false;
                const hoursPerWeek = this.getPrePopulatedData.info.workInformation.hoursPerWeek
                    ? this.getPrePopulatedData.info.workInformation.hoursPerWeek
                    : null;
                this.addRequiredControl(item, hoursPerWeek);
            } else if (item === this.demographicsFields.EMAIL && this.isEmailPresent()) {
                this.addRequiredFields(item);
                this.demographicsForm.controls.email.setValidators([Validators.pattern(this.validationRegex.EMAIL), Validators.required]);
            }
            if (item === this.demographicsFields.EMPLOYEEID && this.getEmployeeId === null) {
                this.addRequiredFields(item);
            } else if (item === this.demographicsFields.HEIGHT && !this.previousHeight) {
                this.formPrefilled = false;
                this.addRequiredControl("HeightFeet", this.languageStrings["primary.portal.members.personalLabel.select"]);
                this.addRequiredControl("HeightInches");
                this.demographicsForm.controls.HeightInches.disable();
            } else if (item === this.demographicsFields.WEIGHT && !this.previousWeight) {
                this.addRequiredFields(item);
            } else if (
                item === this.demographicsFields.SSN &&
                !this.previousSSN &&
                ((!this.childDependent && !this.spouseDependent) || this.getDependentsData)
            ) {
                this.showTitle = false;
                this.addRequiredFields(item);
                this.demographicsForm.controls.ssn.setValidators([
                    Validators.minLength(this.minLengthSSN),
                    Validators.required,
                    Validators.pattern(this.validationRegex.SSN),
                ]);
            }
        });
        this.arrayOfDistinctValues = [...new Set(this.arrayOfValues)];
        this.checkIfAlreadyFilled();
    }
    /**
     * @description returns if the email is present or not
     * @returns {boolean} the value if email is present
     */
    isEmailPresent(): boolean {
        return !this.getMemberContactDetails.emailAddresses.length || !this.getMemberContactDetails.emailAddresses[0].email;
    }
    addOptionalControl(item: any, defaultValue: any): void {
        this.arrayOfValues.push(item);
        this.demographicsForm.addControl(item, new FormControl(defaultValue));
    }
    addRequiredControl(item: any, defaultValue?: any): void {
        this.arrayOfValues.push(item);
        this.demographicsForm.addControl(item, new FormControl(defaultValue, [Validators.required]));
    }
    /**
     * Function to get state list from the database.
     */
    getStatesResponse(): void {
        this.subscriptions.push(
            this.staticService.getStates().subscribe(
                (data) => {
                    this.hasApiError = false;
                    this.stateDropDown = data.map((x) => x.abbreviation);
                },
                (error) => {
                    this.hasApiError = true;
                    this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.saveResponseError"];
                },
            ),
        );
    }
    getOptionalFieldData(): void {
        if (this.data.drivers_license_number) {
            this.previousMemberResponse.profile.driversLicenseNumber = this.data.drivers_license_number;
            this.previousMemberResponse.profile.driversLicenseState = this.data.drivers_license_state;
        }
        this.saveMemberProfile();
    }
    /**
     * gets all previous responses from member data
     */
    getAllResponses(): void {
        this.enrollmentState = this.store.selectSnapshot(EnrollmentState.GetEnrollmentState);
        if (this.childDependent || this.spouseDependent) {
            this.dependents = this.utilService.copy(this.store.selectSnapshot(EnrollmentState.GetMemberDependents));
            this.getDependentsData = this.dependents
                .filter((dependent) =>
                    this.dependentId ? dependent.id === this.dependentId : dependent.dependentRelationId === this.getDependentsRelation.id,
                )
                .pop();
            this.previousMemberResponse = this.getDependentsData;
        } else {
            this.getPrePopulatedData = this.utilService.copy(this.store.selectSnapshot(EnrollmentState.GetMemberData));
            this.previousMemberResponse = this.getPrePopulatedData.info;
        }
        this.checkAdditionalInfo();
        if (this.data.hours_per_week) {
            this.previousMemberResponse.workInformation.hoursPerWeek = this.data.hours_per_week;
        }
        if (this.data.email || this.data.preferred_contact_time) {
            this.saveMemberContact();
        } else if (this.data.salary) {
            this.saveSalaryInfo();
        } else {
            this.getOptionalFieldData();
        }
        if (this.data.employeeId) {
            this.getEmployeeId = this.data.employeeId;
            this.saveEmployeeIdData();
        }
    }

    /**
     * Function to update the member info based on member's height, weight and salary added
     */
    checkAdditionalInfo(): void {
        if (this.data.HeightFeet || this.data.HeightInches || this.data.weight || this.data.salary) {
            if (this.data.HeightFeet >= 0 && this.data.HeightInches >= 0 && (this.data.HeightInches || this.data.HeightFeet)) {
                const heightInInches = this.demographicsForm.controls.HeightFeet.value * FT_UNIT;
                this.height = heightInInches + this.demographicsForm.controls.HeightInches.value;
                this.previousMemberResponse.profile.height = this.height;
            }
            if (this.data.weight) {
                this.previousMemberResponse.profile.weight = this.data.weight;
            }
            if (this.data.salary) {
                this.previousMemberResponse.info.salary = this.data.salary;
            }
            this.childDependent || this.spouseDependent ? this.updateChildDependent(this.previousMemberResponse) : this.saveMemberProfile();
        }
    }
    /**
     * function to save/update child dependent information.
     * @param savedResponse: employee's saved response
     */
    updateChildDependent(savedResponse: any): void {
        const updatedMemberDependent: MemberDependent = {
            ...savedResponse,
            dependentRelationId: this.getDependentsRelation.id,
        };
        const dependentId = savedResponse.id;
        updatedMemberDependent.state = this.enrollmentState;
        this.memberService
            .updateMemberDependent(updatedMemberDependent, this.memberId, dependentId, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (success) => {
                    this.hasApiError = false;
                    this.store.dispatch(new SetDependentMember()).subscribe(
                        () => {
                            this.hasApiError = false;
                            this.getDependents();
                            this.loadSpinner = false;
                            this.saveStepResponse();
                            this.appFlowService.onNextClick(
                                this.planObject,
                                this.planObject.currentStep,
                                this.planObject.currentSection.title,
                            );
                        },
                        (error) => {
                            this.loadSpinner = false;
                            this.hasApiError = true;
                            this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.saveResponseError"];
                        },
                    );
                },
                (error: any) => {
                    this.loadSpinner = false;
                    this.hasApiError = true;
                    this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.saveResponseError"];
                },
            );
    }
    /**
     * To save salary information
     */
    saveSalaryInfo(): void {
        if (this.data.hours_per_week !== undefined) {
            this.previousSalaryInfo !== undefined
                ? (this.tempSalaryInfo = {
                    ...this.previousSalaryInfo,
                    hoursPerYear: 52 * this.data.hours_per_week,
                })
                : (this.tempSalaryInfo = {
                    type: "ACTUAL",
                    hoursPerYear: 52 * this.data.hours_per_week,
                    validity: {
                        effectiveStarting: new Date().toJSON().slice(0, 10),
                        expiresAfter: "",
                    },
                });
        }
        if (this.data.salary !== undefined) {
            this.previousSalaryInfo !== undefined
                ? (this.tempSalaryInfo = {
                    ...this.previousSalaryInfo,
                    annualSalary: this.data.salary.toString(),
                })
                : (this.tempSalaryInfo = {
                    type: "ACTUAL",
                    annualSalary: this.data.salary.toString(),
                    validity: {
                        effectiveStarting: new Date().toJSON().slice(0, 10),
                        expiresAfter: "",
                    },
                });
        }
        // To update salary data of an employee.
        this.subscriptions.push(
            this.memberService.updateSalary(this.memberId, this.tempSalaryInfo, this.mpGroup).subscribe(
                (success) => {
                    this.hasApiError = false;
                    this.store.dispatch(new SetMemberData()).subscribe(
                        () => {
                            this.hasApiError = false;
                            this.getPreviousMemberData(true);
                            this.loadSpinner = false;
                            this.saveStepResponse();
                            this.appFlowService.onNextClick(
                                this.planObject,
                                this.planObject.currentStep,
                                this.planObject.currentSection.title,
                            );
                        },
                        (error) => {
                            this.loadSpinner = false;
                            this.hasApiError = true;
                            this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.saveResponseError"];
                        },
                    );
                },
                (error: any) => {
                    this.loadSpinner = false;
                    this.hasApiError = true;
                    this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.saveResponseError"];
                },
            ),
        );
    }
    /**
     * To get data of dependents
     */
    getDependents(): void {
        this.dependents = this.utilService.copy(this.store.selectSnapshot(EnrollmentState.GetMemberDependents));
        this.dependentRelations = this.utilService.copy(this.store.selectSnapshot(EnrollmentState.GetMemberDependentsRelation));
    }

    // To get the previous responses
    getPreviousResponseValues(previousResponse: any): void {
        this.previousHeight = previousResponse.height;
        this.previousWeight = previousResponse.weight;
        this.previousDriversState = previousResponse.driversLicenseState;
        this.previousDriversNo = previousResponse.driversLicenseNumber;
        this.previousHeightFeet = this.previousHeight ? Math.floor(this.previousHeight / 12) : null;
        this.previousHeightInches = this.previousHeight ? this.previousHeight % 12 : null;
    }

    /**
     * Method to get previous member profile data
     * @param hasEntered is to check whether the member profile data have been entered or not
     */
    getPreviousMemberData(hasEntered?: boolean): void {
        this.getPrePopulatedData = this.utilService.copy(this.store.selectSnapshot(EnrollmentState.GetMemberData));
        if (
            this.getPrePopulatedData &&
            (this.getPrePopulatedData.info.length ||
                this.getPrePopulatedData.salaryInfo.length ||
                this.getPrePopulatedData.contactInfo.length)
        ) {
            this.previousMemberResponse = this.getPrePopulatedData.info.profile;
            this.previousSalaryInfo = this.getPrePopulatedData.salaryInfo[0];
            this.getMemberContactDetails = this.getPrePopulatedData.contactInfo[0];
        }
        if (this.previousMemberResponse) {
            this.getPreviousResponseValues(this.previousMemberResponse);
        }
    }
    // To get previous SSN value
    getPreviousSSNData(): void {
        this.SSNDisplay = true;
        if (!(this.childDependent || this.spouseDependent)) {
            this.getPrePopulatedSSN = this.store.selectSnapshot(EnrollmentState.GetSSNValue);
        } else if (this.getDependentsData) {
            this.getPrePopulatedSSN = this.getDependentsData.ssn;
        }
        if (this.getPrePopulatedSSN) {
            this.previousSSN = this.getPrePopulatedSSN.replace(/-/g, "");
        }
    }
    // To get previous employee id
    getEmployeeIdData(): void {
        this.getEmployeeId = this.store.selectSnapshot(EnrollmentState.GetEmployeeId);
    }

    /**
     * This method is used to set the message when there is an error when saving employee id data
     * @param error http response error {HttpErrorResponse}
     */
    saveEmployeeIdDataError(error: HttpErrorResponse): void {
        this.loadSpinner = false;
        this.hasApiError = true;
        this.errorMessage =
            error.status === ClientErrorResponseCode.RESP_409
                ? (this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.duplicateEmployeeID"])
                : this.languageStrings["secondary.portal.applicationFlow.demographics.invalidEmployeeId"];
    }

    /**
     * Function to save employee's Id
     */
    saveEmployeeIdData(): void {
        const memberIdentifier: MemberIdentifier = {
            id: Number(this.memberId),
            memberIdentifierTypeId: MemberIdentifierTypeIDs.TYPE,
            value: this.getEmployeeId,
            version: null,
        };
        this.subscriptions.push(
            this.memberService.updateMemberIdentifier(memberIdentifier, this.mpGroup).subscribe(
                (data) => {
                    this.hasApiError = false;
                    this.store.dispatch(new SetEmployeeId()).subscribe(
                        () => {
                            this.saveStepResponse();
                            this.loadSpinner = false;
                            this.hasApiError = false;
                            this.appFlowService.onNextClick(
                                this.planObject,
                                this.planObject.currentStep,
                                this.planObject.currentSection.title,
                            );
                        },
                        (error) => {
                            this.saveEmployeeIdDataError(error);
                        },
                    );
                },
                (error) => {
                    this.saveEmployeeIdDataError(error);
                },
            ),
        );
    }
    /**
     * To save SSN value
     */
    saveSSNResponse(): void {
        if ((this.childDependent || this.spouseDependent) && this.data.ssn) {
            this.ssnResponse = this.data.ssn;
            this.loadSpinner = true;
            const dependentId = this.getDependentsData.id;
            this.memberService
                .saveDependentIdentifier(this.memberId, dependentId.toString(), 1, this.mpGroup, this.ssnResponse)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (data) => {
                        this.saveStepResponse();
                        this.loadSpinner = false;
                        this.hasApiError = false;
                        this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
                    },
                    (error) => {
                        this.loadSpinner = false;
                        if (error.status === AppSettings.API_RESP_409) {
                            this.hasApiError = true;
                            this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.duplicateSSN"];
                        } else {
                            this.hasApiError = true;
                            this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.invalidSSN"];
                        }
                    },
                );
        } else if (this.data.ssn) {
            this.ssnResponse = this.data.ssn;
            this.modifiedSSN = this.ssnResponse.match(/.{1,3}/g).join("-");
            this.loadSpinner = true;
            const memberIdentifier: MemberIdentifier = {
                id: Number(this.memberId),
                memberIdentifierTypeId: MemberIdentifierTypeIDs.ID,
                value: this.modifiedSSN,
                version: null,
            };
            this.memberService
                .updateMemberIdentifier(memberIdentifier, +this.mpGroup)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    catchError((error: HttpErrorResponse) => {
                        if (error.status === ClientErrorResponseCode.RESP_404) {
                            return this.memberService.saveMemberIdentifier(memberIdentifier, +this.mpGroup);
                        }
                        return undefined;
                    }),
                )
                .subscribe(
                    (data) => {
                        this.hasApiError = false;
                        this.store.dispatch(new SetSSNData()).subscribe(
                            () => {
                                this.saveStepResponse();
                                this.loadSpinner = false;
                                this.hasApiError = false;
                                this.appFlowService.onNextClick(
                                    this.planObject,
                                    this.planObject.currentStep,
                                    this.planObject.currentSection.title,
                                );
                            },
                            (error) => {
                                this.loadSpinner = false;
                                if (error.status === AppSettings.API_RESP_409) {
                                    this.hasApiError = true;
                                    this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.duplicateSSN"];
                                } else {
                                    this.hasApiError = true;
                                    this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.invalidSSN"];
                                }
                            },
                        );
                    },
                    (error) => {
                        this.loadSpinner = false;
                        if (error.status === AppSettings.API_RESP_409) {
                            this.hasApiError = true;
                            this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.duplicateSSN"];
                        } else {
                            this.hasApiError = true;
                            this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.invalidSSN"];
                        }
                    },
                );
        } else {
            this.saveStepResponse();
            this.loadSpinner = false;
            this.hasApiError = false;
            this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
        }
    }
    /**
     * @description To save contact details- email and contact  time
     */
    saveMemberContact(): void {
        if (this.data.preferred_contact_time !== undefined) {
            !this.getMemberContactDetails.contactTimeOfDay
                ? (this.getContactDetails = {
                    ...this.getMemberContactDetails,
                    contactTimeOfDay: null,
                })
                : (this.getContactDetails = {
                    ...this.getMemberContactDetails,
                });

            this.getContactDetails.contactTimeOfDay = this.data.preferred_contact_time;
        }
        if (this.data.email !== undefined) {
            !this.getMemberContactDetails.emailAddresses
                ? (this.getContactDetails = {
                    ...this.getMemberContactDetails,
                    emailAddresses: null,
                })
                : (this.getContactDetails = {
                    ...this.getMemberContactDetails,
                });
            if (this.getContactDetails.emailAddresses && this.getContactDetails.emailAddresses.length) {
                this.getContactDetails.emailAddresses[0].email = this.data.email;
            } else {
                this.getContactDetails.emailAddresses = [];
                this.getContactDetails.emailAddresses.push({
                    email: this.data.email,
                    verified: false,
                    type: EmailTypes.PERSONAL,
                    primary: false,
                });
            }
        }
        this.saveMemberContactDetails = this.memberService
            .saveMemberContact(this.memberId, "HOME", this.getContactDetails, this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((res) => {
                    if (this.data.salary) {
                        this.saveSalaryInfo();
                    } else {
                        this.getOptionalFieldData();
                    }
                }),
            )
            .subscribe(
                (success) => {
                    this.saveStepResponse();
                    this.loadSpinner = false;
                    this.hasApiError = false;
                    this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
                },
                (error) => {
                    this.loadSpinner = false;
                    this.hasApiError = true;
                    this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.saveResponseError"];
                },
            );
    }
    /**
     * Function to save data of member profile
     */
    saveMemberProfile(): void {
        const MIN_HOURS_ERROR = "Must work at least";
        if (this.childDependent || this.spouseDependent) {
            const updatedMemberDependent: MemberDependent = this.previousMemberResponse;
            updatedMemberDependent.state = this.enrollmentState;
            this.memberService
                .updateMemberDependent(updatedMemberDependent, this.memberId, this.getDependentsData.id.toString(), this.mpGroup.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        this.store.dispatch(new SetMemberData()).subscribe(
                            () => {
                                this.getPreviousMemberData(true);
                                this.loadSpinner = false;
                                this.hasApiError = false;
                                this.saveStepResponse();
                                this.appFlowService.onNextClick(
                                    this.planObject,
                                    this.planObject.currentStep,
                                    this.planObject.currentSection.title,
                                );
                            },
                            (error) => {
                                this.loadSpinner = false;
                                this.hasApiError = true;
                                this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.saveResponseError"];
                            },
                        );
                    },
                    (error: any) => {
                        this.loadSpinner = false;
                        this.hasApiError = true;
                        this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.saveResponseError"];
                    },
                );
        } else {
            this.loadSpinner = true;
            if (this.planObject.application.carrierId === CarrierId.AFLAC_GROUP && this.data.hours_per_week) {
                this.isAgPlan = true;
            }
            this.memberService
                .updateMember(this.previousMemberResponse, this.mpGroup.toString(), null, this.isAgPlan)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        this.hasApiError = false;
                        this.store.dispatch(new SetMemberData()).subscribe(
                            () => {
                                this.hasApiError = false;
                                this.getPreviousMemberData(true);
                                this.loadSpinner = false;
                                this.saveStepResponse();
                                this.appFlowService.onNextClick(
                                    this.planObject,
                                    this.planObject.currentStep,
                                    this.planObject.currentSection.title,
                                );
                            },
                            (error) => {
                                this.loadSpinner = false;
                                this.hasApiError = true;
                                this.errorMessage = this.languageStrings["secondary.portal.applicationFlow.demographics.saveResponseError"];
                            },
                        );
                    },
                    (error: HttpErrorResponse) => {
                        this.loadSpinner = false;
                        this.hasApiError = true;
                        this.errorMessage =
                            error.error.message.indexOf(MIN_HOURS_ERROR) > -1
                                ? error.error.message.split(".")[0]
                                : this.languageStrings["secondary.portal.applicationFlow.demographics.saveResponseError"];
                    },
                );
        }
    }

    /**
     * Function to save the step response.
     */
    saveStepResponse(): void {
        const stepId =
            this.planObject.application.appData.sections[this.planObject.currentSection.sectionId].steps[this.planObject.currentStep]
                .step[0].id;
        const responses = [];
        const stepResponse = { stepId: stepId, value: [], type: StepType.GENERICSTEP };
        responses.push(stepResponse);
        this.store.dispatch(new UpdateSkippedStepResponses({ responses: stepResponse, planId: this.planId }));
        this.shoppingCartDisplayService
            .saveApplicationResponse(
                this.memberId,
                this.planObject.rider ? this.riderCartData.cartItemId : this.cartData.id,
                this.mpGroup,
                responses,
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.hasApiError = false;
                },
                (error) => {
                    this.hasApiError = true;
                    this.errorMessage = this.languageStrings["secondary.api." + error.status + "." + error.code];
                },
            );
    }
    onNext(): void {
        if (this.demographicsForm.valid) {
            this.data = this.demographicsForm.value;
            if (this.data.ssn !== undefined) {
                this.saveSSNResponse();
            } else {
                this.getAllResponses();
            }
        } else {
            this.showError = true;
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

    validateNumber(event: any): boolean {
        return event.charCode === 8 || event.charCode === 0 ? null : event.charCode >= 48 && event.charCode <= 57;
    }

    /**
     * The function is called to check if the plan object is already filled.
     * If it is a reinstatement, then updates reinstateDemographicsStepSkipped subject
     * or else updates demographicsStepSkipped subject.
     * @returns void
     */
    checkIfAlreadyFilled(): void {
        if (this.formPrefilled) {
            if (this.planObject.rider) {
                this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
            }
            if (this.planObject.reinstate) {
                this.appFlowService.reinstateDemographicsStepSkipped$.next({
                    planObject: this.planObject,
                    currentStep: this.planObject.currentStep,
                    sectionId: this.planObject.currentSection.sectionId,
                });
            } else {
                this.appFlowService.demographicsStepSkipped$.next({
                    planObject: this.planObject,
                    currentStep: this.planObject.currentStep,
                    sectionId: this.planObject.currentSection.sectionId,
                });
            }
        } else {
            this.displayField();
        }
    }
    /**
     * to get ssn config value
     */
    getSSNConfiguration(): void {
        this.subscriptions.push(
            this.staticUtilService.cacheConfigValue(ConfigName.SSN_MASKING_CONFIG).subscribe((ssnConfig) => {
                if (ssnConfig === PARTIALLY_MASKED_SSN) {
                    this.isMaskedTrue = true;
                    this.isShowHideButtonVisible = true;
                } else if (ssnConfig === FULLY_MASKED_SSN) {
                    this.isMaskedTrue = true;
                } else if (ssnConfig === FULLY_VISIBLE_SSN) {
                    this.isShowHideButtonVisible = false;
                    this.isMaskedTrue = false;
                }
            }),
        );
    }
    /**
     * method to do masking and unmasking as per condition
     * executes while blur and click of show and hide link
     * @param isMasked boolean value to check mask
     */
    ssnMaskingToggler(isMasked: boolean): void {
        this.customPattern = isMasked || !this.demographicsForm.controls.ssn.valid ? this.ssnUnmaskedPattern : this.ssnMaskedPattern;
        this.isMaskedTrue = !(isMasked || !this.demographicsForm.controls.ssn.valid);
    }
    /**
     * method to detect changes om keyup in order to hide button on deleting value from ssn field
     */
    onSSNValueChange(): void {
        this.isSSNValue = Boolean(this.demographicsForm.controls[this.demographicsFields.SSN].value);
    }
    /**
     *  Checks and sets invalid error for height on change
     */
    checkHeight(): void {
        const heightFeetControl: AbstractControl = this.demographicsForm.controls.HeightFeet;
        const heightInchControl: AbstractControl = this.demographicsForm.controls.HeightInches;
        heightFeetControl.setErrors(null);
        heightInchControl.setErrors(null);
        if (heightFeetControl.value === SELECT) {
            heightFeetControl.setErrors({ required: true });
            heightInchControl.patchValue(null);
            heightInchControl.disable();
        } else {
            heightInchControl.enable();
        }
        if (heightFeetControl.value === 0 && heightInchControl.value === 0) {
            heightFeetControl.setErrors({ invalid: true });
            heightInchControl.setErrors({ invalid: true });
        }
        if (heightInchControl.value === undefined || heightInchControl.value === null) {
            heightInchControl.setErrors({ required: true });
        }
    }
    /**
     * Checks and sets invalid error for weight on change
     */
    checkWeight(): void {
        this.demographicsForm.controls.weight.setErrors(null);
        if (+this.demographicsForm.controls.weight.value === 0) {
            this.demographicsForm.controls.weight.setErrors({ invalid: true });
        }
    }
}
