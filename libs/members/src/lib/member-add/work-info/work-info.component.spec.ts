import { ComponentType } from "@angular/cdk/portal";
import { DatePipe } from "@angular/common";
import {
    ChangeDetectorRef,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    Directive,
    forwardRef,
    Input,
    NO_ERRORS_SCHEMA,
    Pipe,
    PipeTransform,
    TemplateRef,
} from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ControlValueAccessor, FormBuilder, FormGroup, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import {
    AccountProfileService,
    AccountService,
    ClassNames,
    CommonService,
    MemberClassType,
    MemberIdentifier,
    MemberIdentifierType,
    MemberService,
    StaticService,
} from "@empowered/api";
import { Salary, PersonalAddress, ContactType, MemberProfile, MemberContact } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { NgxMaskPipe } from "ngx-mask";
import { of } from "rxjs";
import { WorkInfoComponent } from "./work-info.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { DateFilterFn, MatDatepicker } from "@angular/material/datepicker";
import {
    AccountProfileBusinessService,
    TPIRestrictionsForHQAccountsService,
    SharedService,
    EmpoweredModalService,
} from "@empowered/common-services";
import { AddMemberInfo, Member, MemberInfoState, SharedState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { mockStaticUtilService } from "@empowered/testing";
import { MatTableModule } from "@angular/material/table";
import { MatMenuModule } from "@angular/material/menu";
const mockStaticService = {
    getConfigurations: (names: string, mpGroup?: number) => of([]),
    getStates: () => of([]),
    getCountries: () => of([]),
    getCounties: (event: string) => of([]),
} as StaticService;

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

@Component({
    selector: "mat-datepicker",
    template: "",
})
class MockMatDatepickerComponent {}

@Component({
    selector: "mat-select",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatSelectComponent),
            multi: true,
        },
    ],
})
class MockMatSelectComponent {
    @Input() placeholder!: string;
    @Input() disableControl!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-form-field",
    template: "",
})
class MockMatFormFieldComponent {}

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[disableControl]",
})
class MockDisabledDirective {
    @Input() disabled!: string;
}

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[maxlength]",
})
class MockMaxlengthDirective {
    @Input() maxlength!: string;
}

@Component({
    selector: "mat-label",
    template: "",
})
class MockMatLabelComponent {}

@Component({
    selector: "mat-option",
    template: "",
})
class MockMatOptionComponent {}

@Component({
    selector: "mat-hint",
    template: "",
})
class MockMatHintComponent {}

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any): string {
        return "replaced";
    }
}

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

const mockMemberIdentifiers = [
    { id: 2, type: "EMPLOYEE_ID", name: "Employee ID Number" },
    { id: 3, type: "CUSTOM", name: "GoHealth Refer Member ID" },
    { id: 4, type: "CUSTOMER_INFORMATION_FILE_NUMBER", name: "CIF Number" },
    { id: 6, type: "AFLAC_GUID", name: "Aflac Guid" },
];

const mockMemberService = {
    getSalaries: (memberId: number, mask: boolean, mgGroup: string) => of([{ annualSalary: "909" } as Salary]),
    getMemberRegionTypes: (memberId: number, mgGroup: string) => of({}),
    getMemberIdentifierTypes: () => of(mockMemberIdentifiers),
    getMemberClassType: (memberId: number, classTypeId: number, mpGroupId: string) => of([]),
    getSalary: (memberId: number, value: boolean, rowId: number, mpGroupId: string) => of([]),
    getMember: (memberId: number, mgGroup) => of({}),
    updateSalary: (memberId: number, salaryBody: Salary, mpGroupId: string) => of([]),
    updateMember: (addMemberModel: MemberProfile, MpGroup?: string) => of([]),
    setMemberHireDate: "21-02-2020",
    updateMemberClass: (memberId: number, classTypeId: number, updateMemberClass: MemberClassType, mpGroupId: string) => of({}),
    verifyMemberAddress: (providedAddress: PersonalAddress) => of({}),
    saveMemberContact: (memberId: number, contactType: string, saveMemberContact: MemberContact, mpGroup: string) => of(void {}),
    updateMemberIdentifier: (memberIdentifier: MemberIdentifier, mpGroupId: number) => of({}),
    saveMemberIdentifier: (memberIdentifier: MemberIdentifier, mpGroupId: number) => of({}),
    deleteMemberIdentifier: (memberId: number, customId: number, mgGroup: number) => of({}),
    getMemberIdentifier: (memberId: number, customId: number, value: boolean, mgGroup: number) => of([]),
    getMemberContacts: (memberID: number, mpGroup: string) => of([{ contactType: ContactType.WORK } as MemberContact]),
    getMemberContact: (memberId: number, contactType: string, mpGroup: string) => of([]),
} as MemberService;

const mockAccountProfileService = {
    getAccountCarrierRiskClasses: (carrierId: number, mpGroup: number) =>
        of(carrierId ? [{ name: "some-risk-class-name" }, { name: "some-other-risk-class-name" }] : [{ name: "some-risk-class-name" }]),
    getClassTypes: (mpGroupId: string) => of([{ name: "jsad", determinesPayFrequency: true, determinesPlanAvailabilityOrPricing: true }]),
    getClasses: (classTypeId: string, mpGroupId: string) => of([]),
    createOrganization: (payload) => of({}),
} as AccountProfileService;

const mockAccountService = {
    getGroupAttributesByName: (groupAttributeNames: string[], mpGroup?: number) => of([]),
    getAccount: (mpGroup?: string) => of(null),
    getPayFrequencies: (mpGroup?: string) => of([]),
    getTerminationCodes: (mpGroup?: string) => of([]),
} as AccountService;

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of({}),
        } as MatDialogRef<any>),
} as MatDialog;

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockCommonService = {
    getLanguages: (tagName: string) => of([]),
} as CommonService;

const mockModalMatDialog = {
    openDialog: (componentOrTemplateRef: ComponentType<any> | TemplateRef<any>, config?: MatDialogConfig<any>, refocus?: HTMLElement) =>
        ({
            afterClosed: () => of(true),
        } as MatDialogRef<any>),
} as EmpoweredModalService;

const mockAccountProfileBusinessService = {
    getEmployeePEOClasses: (mpGroupId: string, CarrierId: number) => of([]),
    getOrganizationData: (mpGroupId: string, isAflacUSer: boolean, CORPORATE: string, UNDEFINED: string) => of([]),
} as AccountProfileBusinessService;

const mockTPIRestrictionsForHQAccountsService = {
    canEditMemberProfile: (
        memberEditProfileConfig: string,
        producerEditProfilePermission: string,
        producerPartialEditProfilePermission: string,
    ) => of({}),
} as TPIRestrictionsForHQAccountsService;

const mockSharedService = {
    checkAgentSelfEnrolled: () => of(true),
} as SharedService;

const mockRouter = {
    url: "",
} as Router;

const mockStore = {
    dispatch: () => of({}),
    select: () => of({}),
    selectSnapshot: () => of({}),
} as unknown as Store;

@Component({
    selector: "mat-checkbox",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatCheckboxComponent),
            multi: true,
        },
    ],
})
class MockMatCheckboxComponent {
    @Input() value!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

const mockUtilService = {
    copy: (data: ClassNames[]) => void {},
    getCurrentTimezoneOffsetDate: (workInformation: string) => Date.now(),
    Date,
    checkDisableForRole12Functionalities: (data: string, mpGroup: string) => of([]),
} as unknown as UtilService;

@Directive({
    selector: "[matDatepickerFilter]",
})
class MockMatDatepickerFilterDirective {
    @Input() matDatepickerFilter!: DateFilterFn<unknown>;
}

@Component({
    selector: "mat-datepicker-toggle",
    template: "",
})
class MockMatDatepickerToggleComponent {
    @Input() for!: string;
}

@Component({
    selector: "mat-error",
    template: "",
})
class MockMatErrorComponent {}

@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}

@Directive({
    selector: "[isRestricted]",
})
class MockIsRestrictedDirective {
    @Input() isRestricted;
}

@Component({
    selector: "empowered-zip-code-input",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockEmpoweredZipCodeInputComponent),
            multi: true,
        },
    ],
})
class MockEmpoweredZipCodeInputComponent implements ControlValueAccessor {
    @Input() validateOnStateChange;
    @Input() formControl;
    @Input() stateControlValue;
    @Input() readonly;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Pipe({
    name: "Mask",
})
class MockMaskPipe implements PipeTransform {
    transform(value: any): string {
        return `${value}`;
    }
}

@Component({
    selector: "mon-alert",
    template: "",
})
class MockMonAlertComponent {}

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}

describe("WorkInfoComponent", () => {
    let component: WorkInfoComponent;
    let fixture: ComponentFixture<WorkInfoComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                WorkInfoComponent,
                MockMatLabelComponent,
                MockRichTooltipDirective,
                MockMatSelectComponent,
                MockMonIconComponent,
                MockMatErrorComponent,
                MockMatDatepickerToggleComponent,
                MockMatDatepickerFilterDirective,
                MockMatFormFieldComponent,
                MockMatOptionComponent,
                MockMatDatepickerComponent,
                MockMatHintComponent,
                MockDisabledDirective,
                MockMatDatePickerDirective,
                MockMaxlengthDirective,
                MockEmpoweredZipCodeInputComponent,
                MockIsRestrictedDirective,
                MockMatCheckboxComponent,
                MockMonSpinnerComponent,
                MockMonAlertComponent,
                MockReplaceTagPipe,
                MockHasPermissionDirective,
            ],
            imports: [
                HttpClientTestingModule,
                MatDialogModule,
                NgxsModule.forRoot(),
                RouterTestingModule,
                ReactiveFormsModule,
                MatTableModule,
                MatMenuModule,
            ],
            providers: [
                DatePipe,
                FormBuilder,
                { provide: NgxMaskPipe, useClass: MockMaskPipe },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: TPIRestrictionsForHQAccountsService,
                    useValue: mockTPIRestrictionsForHQAccountsService,
                },
                {
                    provide: AccountProfileBusinessService,
                    useValue: mockAccountProfileBusinessService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockModalMatDialog,
                },
                {
                    provide: CommonService,
                    useValue: mockCommonService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: AccountProfileService,
                    useValue: mockAccountProfileService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        jest.spyOn(console, "warn").mockImplementation(jest.fn());
        jest.spyOn(console, "error").mockImplementation(jest.fn());
        fixture = TestBed.createComponent(WorkInfoComponent);
        store = TestBed.inject(Store);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.state = {
            mpGroupId: "1234",
            activeMemberId: "1234",
            configurations: {
                payload: {},
            },
            memberInfo: {
                address: {
                    address1: "4000 SouthWest 39th Blvd",
                    address2: "Apt 19C",
                    city: "Gainesville",
                    country: null,
                    countyId: null,
                    state: "FL",
                    zip: "32606",
                },
                birthDate: "1963-05-13",
                gender: "MALE",
                id: 18,
                name: {
                    firstName: "JEFFREYY",
                    lastName: "ANDERSON",
                    maidenName: "",
                    nickname: "",
                    suffix: "",
                },
                profile: {
                    allowCallCenter: false,
                    communicationPreference: "EMAIL",
                    correspondenceLocation: "HOME",
                    correspondenceType: "ELECTRONIC",
                    courtOrdered: false,
                    hiddenFromEmployee: false,
                    ineligibleForCoverage: false,
                    languagePreference: "ENGLISH",
                    maritalStatus: "UNREPORTED",
                    medicareEligibility: false,
                    test: false,
                    tobaccoStatus: "UNDEFINED",
                },
                ssn: "513513513",
                workAddress: {
                    addressValidationDate: "2022-05-20T09:15:56",
                    contactId: 32,
                    contactType: "WORK",
                    emailAddresses: [],
                    immediateContactPreference: "UNKNOWN",
                    phoneNumbers: [],
                    address: {
                        state: "AZ",
                        zip: "85001",
                    },
                },
                workInformation: {
                    employeeId: "001012418",
                    employeeIdRequired: false,
                    hireDate: "2016-12-28",
                    hoursPerWeek: 40,
                    hoursPerWeekRequired: false,
                    occupation: "testttyuy",
                    organizationId: "19",
                    payrollFrequencyId: "5",
                    termination: {},
                    employerName: "Sample_Employer",
                },
            },
            MemberAdd: {
                activeMemberId: 18,
                configurations: {
                    payload: {},
                },

                errorMessage: null,
                mpGroupId: "12345",
            },
        };
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closeModal()", () => {
        it("should close address-verify modal", () => {
            component.addressResp = false;
            component.closeModal();
            expect(component.addressResp).toBeFalsy();
        });
    });

    describe("getIdentifierId()", () => {
        it("should return ID If type is same", () => {
            component.memberIdentifierTypes = [
                {
                    id: 1,
                    type: "CUSTOM",
                    name: "GoHealth Refer Member ID",
                    validationRegex: "",
                    memberEligible: true,
                    dependentEligible: false,
                },
                {
                    id: 2,
                    type: "EMPLOYEE_ID",
                    name: "Employee ID Number",
                    validationRegex: "",
                    memberEligible: true,
                    dependentEligible: false,
                },
            ];
            expect(component.getIdentifierId("EMPLOYEE_ID")).toBe(2);
        });
    });

    describe("updateManageSelection()", () => {
        it("should call openDialogSalary method", () => {
            const spy1 = jest.spyOn(component, "openDialogSalary");
            component.updateManageSelection();
            expect(spy1).toBeCalledWith("actualSalary");
        });
    });

    describe("actualSalaryRowHoverIn()", () => {
        it("should return displayFlag value true ", () => {
            component.displayFlag = true;
            component.actualSalaryRowHoverIn();
            expect(component.displayFlag).toBeTruthy();
        });
    });

    describe("actualSalaryRowHoverOut()", () => {
        it("should return displayFlag value false", () => {
            component.displayFlag = false;
            component.actualSalaryRowHoverOut();
            expect(component.displayFlag).toBeFalsy();
        });
    });

    describe("hideErrorAlertMessage()", () => {
        it("should hide alert messages when component gets initialized", () => {
            component.showErrorMessage = true;
            component.hideErrorAlertMessage();
            expect(component.errorMessage).toStrictEqual("");
            expect(component.showErrorMessage).toBeFalsy();
        });
    });

    describe("checkForTableValidation()", () => {
        it("should return actualSalaryIsRequiredError value true if dataActualSalary length is zero", () => {
            component.actualSalaryIsRequiredError = false;
            component.benefitSalaryIsRequiredError = false;
            component.userIsProducerAdmin = true;
            component.dataActualSalary = [];
            component.actualSalaryIsRequired = true;
            component.benefitSalaryIsRequired = true;
            component.checkForTableValidation();
            expect(component.actualSalaryIsRequiredError).toBeTruthy();
            expect(component.benefitSalaryIsRequiredError).toBeTruthy();
        });
    });

    describe("isRequiredField()", () => {
        it("method should return true if requiredFields name match", () => {
            component.requiredFields = [
                {
                    name: "portal.member.form.work.hireDate",
                    value: "hidden",
                    dataType: "STRING",
                },
            ];
            const result = component.isRequiredField("hireDate");
            expect(result).toBeTruthy();
        });
        it("method should return false if requiredFields name doesn't match", () => {
            component.requiredFields = [
                {
                    name: "portal.member.form.work.EMPLOYEE_ID",
                    value: "hidden",
                    dataType: "STRING",
                },
            ];
            const result = component.isRequiredField("hireDate");
            expect(result).toBeFalsy();
        });
    });

    describe("getCustomIDValue()", () => {
        it("method should return custom id value", () => {
            component.customIdFields = {
                CUSTOMER_INFORMATION_FILE_NUMBER: 908234,
            };
            const result = component.getCustomIDValue("CUSTOMER_INFORMATION_FILE_NUMBER");
            expect(result).toStrictEqual(908234);
        });
    });

    describe("memberIdentifiers", () => {
        // TODO: Fix this test case, passing in local but failing in pipeline
        it.skip("check memberIdentifierTypes$", (done) => {
            const memberIdentifierTypes = mockMemberIdentifiers as MemberIdentifierType[];
            jest.spyOn(component, "settingValidations").mockImplementation(() => {});
            jest.spyOn(component, "editMemberDataSync").mockImplementation(() => {});
            jest.spyOn(component, "getIdentifierTypesSubscriber").mockReturnValue(of(memberIdentifierTypes));
            jest.spyOn(component, "getGroupAttributesByNameSubscriber").mockReturnValue({});
            jest.spyOn(component, "getIdentifierTypes").mockReturnValue(of(memberIdentifierTypes));
            jest.spyOn(component, "getMemberIdentifier").mockReturnValue();
            expect.assertions(1);
            component.memberIdentifierTypes$.subscribe((identifiers) => {
                expect(identifiers).toStrictEqual(mockMemberIdentifiers);
                done();
            });
        });
        it("verify CIF Number exists", () => {
            component.memberIdentifierTypes = [
                {
                    id: 2,
                    type: "EMPLOYEE_ID",
                    name: "Employee ID Number",
                    validationRegex: "",
                    memberEligible: true,
                    dependentEligible: true,
                },
                {
                    id: 3,
                    type: "CUSTOM",
                    name: "GoHealth Refer Member ID",
                    validationRegex: "",
                    memberEligible: true,
                    dependentEligible: true,
                },
                {
                    id: 4,
                    type: "CUSTOMER_INFORMATION_FILE_NUMBER",
                    name: "CIF Number",
                    validationRegex: "",
                    memberEligible: true,
                    dependentEligible: true,
                },
                { id: 6, type: "AFLAC_GUID", name: "Aflac Guid", validationRegex: "", memberEligible: true, dependentEligible: false },
            ];
            component.getMemberIdentifier();
            expect(component.hasCifNumber).toBe(false);
        });
    });

    describe("getIdentifierTypes", () => {
        it("check EMPLOYEE_ID", () => {
            const spy = jest.spyOn(component, "settingValidations").mockImplementation(() => {});
            const memberWorkForm = {} as FormGroup;
            const customForm = {
                EMPLOYEE_ID: "",
                CUSTOM: "",
                CUSTOMER_INFORMATION_FILE_NUMBER: "",
                AFLAC_GUID: "",
            };
            const memberIdentifierTypes = [
                {
                    id: 1,
                    type: "CUSTOM",
                    name: "GoHealth Refer Member ID",
                    validationRegex: "",
                    memberEligible: true,
                    dependentEligible: false,
                },
                {
                    id: 2,
                    type: "EMPLOYEE_ID",
                    name: "Employee ID Number",
                    validationRegex: "",
                    memberEligible: true,
                    dependentEligible: false,
                },
            ];
            component.isEmployeeIdFieldRequired = true;
            component.isMember = false;
            component.getIdentifierTypes(memberIdentifierTypes);
            expect(component.customIDAliases.value).toStrictEqual(customForm);
        });
    });

    describe("Direct", () => {
        it("is Direct", () => {
            component.isDirect = true;
            expect(component.displayTooltipMsg).toBe("primary.portal.members.workLabel.organizationTooltipMessage");
        });
    });

    describe("getGroupAttributesByName()", () => {
        it("Employee ID Required", () => {
            const groupAttrNames = [
                { attribute: "is_department_number_required", id: 123, value: "false" },
                { attribute: "is_employee_id_required", id: 345, value: "true" },
            ];
            component.getGroupAttributesByName(groupAttrNames);
            expect(component.isEmployeeIdFieldRequired).toBe(true);
        });
    });

    describe("birthDateAndHireDateDiff()", () => {
        it("should return true when diffYears is less than eligible employee age", () => {
            expect(component.birthDateAndHireDateDiff(12, 1, 12)).toBe(true);
        });

        it("should return false when diffYears is 14 and there is a difference in month and days", () => {
            expect(component.birthDateAndHireDateDiff(14, 1, 1)).toBe(false);
        });

        it("should true when diffYears is 14 and there is no difference in month and days", () => {
            expect(component.birthDateAndHireDateDiff(14, 0, 0)).toBe(false);
        });
    });

    describe("addToDate()", () => {
        it("should return date object after adding days to passed date", () => {
            const date = new Date("2023/01/01");
            const days = 2;
            expect(component.addToDate(date, days)).toStrictEqual(new Date("2023/01/03"));
        });
    });

    describe("calculateDifferenceInDays()", () => {
        it("should return the difference in days between two passed dates including the starting date", () => {
            const date1 = new Date("2023/01/03");
            const date2 = new Date("2023/01/01");
            expect(component.calculateDifferenceInDays(date1, date2)).toBe(3);
        });
    });

    describe("checkAndPopulateEmployerName()", () => {
        it("should populate emmployerName, when it's not Direct, employerName field config is enabled and employerNameField is readonly", () => {
            component.isDirect = false;
            component.isEmployerNameFieldEnabled = true;
            delete component.state.memberInfo.workInformation.employerName;
            component.isEmployerNameFieldReadOnly = true;
            jest.spyOn(store, "selectSnapshot").mockReturnValue({ name: "Sample Account Name" });
            component.checkAndPopulateEmployerName();
            expect(component.memberWorkForm.controls.workInformation.get("employerName").value).toStrictEqual("Sample Account Name");
            expect(component.memberWorkForm.controls.workInformation.get("employerName").disabled).toBe(true);
        });

        it("should not populate the employer field and employerName field shouldn't be disabled if it's direct", () => {
            component.isDirect = true;
            component.editObject = { workInformation: {} };
            component.checkAndPopulateEmployerName();
            expect(component.memberWorkForm.controls.workInformation.get("employerName").value).toStrictEqual("");
            expect(component.memberWorkForm.controls.workInformation.get("employerName").disabled).toBe(false);
        });

        it("should set the employerName as per the workInformation of the member", () => {
            component.isDirect = false;
            component.isEmployerNameFieldEnabled = true;
            component.isEmployerNameFieldReadOnly = true;
            component.checkAndPopulateEmployerName();
            expect(component.memberWorkForm.controls.workInformation.get("employerName").value).toStrictEqual("Sample_Employer");
            expect(component.memberWorkForm.controls.workInformation.get("employerName").disabled).toBe(true);
        });
    });

    describe("disableTerminationFields()", () => {
        it("should disable termination fields and set their values", () => {
            const terminationDate = component.state.memberInfo?.workInformation?.termination?.terminationDate;
            const terminationComments = component.state.memberInfo?.workInformation?.termination?.terminationComments;
            const terminationCode = 1;
            component.disableTerminationFields();
            expect(component.memberWorkForm.controls.workInformation.get("terminationDate").value).toStrictEqual(terminationDate);
            expect(component.memberWorkForm.controls.workInformation.get("terminationDate").disabled).toBe(true);
            expect(component.memberWorkForm.controls.workInformation.get("terminationComments").value).toStrictEqual(terminationComments);
            expect(component.memberWorkForm.controls.workInformation.get("terminationComments").disabled).toBe(true);
        });

        it("should disable hireDate field if terminationFlag is true", () => {
            component.terminationFlag = true;
            component.disableTerminationFields();
            expect(component.memberWorkForm.controls.workInformation.get("hireDate").value).toStrictEqual("2016-12-28");
            expect(component.memberWorkForm.controls.workInformation.get("hireDate").disabled).toBe(true);
        });

        it("should enable hireDate field if terminationFlag is false", () => {
            component.terminationFlag = false;
            component.disableTerminationFields();
            expect(component.memberWorkForm.controls.workInformation.get("hireDate").value).toStrictEqual("");
            expect(component.memberWorkForm.controls.workInformation.get("hireDate").disabled).toBe(false);
        });
    });
});
