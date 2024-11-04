import { DatePipe } from "@angular/common";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AccountProfileService, AccountService, CoreService, EmailAddress, MemberService, PhoneNumber } from "@empowered/api";
import {
    Address,
    AddressConfig,
    AppSettings,
    ClientErrorResponseCode,
    ClientErrorResponseDetailCodeType,
    ClientErrorResponseType,
    ConfigName,
    Configurations,
    CorrespondenceType,
    GroupAttribute,
    GroupAttributeEnum,
    MemberContact,
    MemberProfile,
    Product,
    VerifiedAddress,
} from "@empowered/constants";
import {
    mockDatePipe,
    mockDualPlanYearService,
    mockRouter,
    mockMatDialog,
    mockCoreService,
    mockLanguageService,
    mockAccountProfileService,
    mockStaticUtilService,
    mockAccountService,
} from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { of, throwError } from "rxjs";
import { PartialCensusComponent } from "./partial-census.component";
import { DualPlanYearService, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { SsnFormatPipe } from "@empowered/ui";
import { MatSelectChange } from "@angular/material/select";
import { MatRadioChange } from "@angular/material/radio";
import { MatMenuModule } from "@angular/material/menu";
import { NGRXStore } from "@empowered/ngrx-store";
import { Store, StoreModule } from "@ngrx/store";
import { error } from "console";

describe("PartialCensusComponent", () => {
    let component: PartialCensusComponent;
    let fixture: ComponentFixture<PartialCensusComponent>;
    let coreService: CoreService;
    let accountProfileService: AccountProfileService;
    let staticUtilService: StaticUtilService;
    let fb: FormBuilder;
    let memberService: jest.Mocked<MemberService>;
    let router: Router;
    let utilService: UtilService;
    let ngrxStore: NGRXStore;
    beforeEach(async () => {
        const memberServiceMock= {
            verifyMemberAddress: jest.fn(),
            getMemberContact: jest.fn()
        }
        await TestBed.configureTestingModule({
            declarations: [PartialCensusComponent],
            providers: [
                {
                    provide: SsnFormatPipe,
                    useValue: {},
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },

                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MemberService,
                    useValue: memberServiceMock,
                },
                { provide: DualPlanYearService, useValue: mockDualPlanYearService },
                { provide: CoreService, useValue: mockCoreService },
                { provide: AccountProfileService, useValue: mockAccountProfileService },
                { provide: StaticUtilService, useValue: mockStaticUtilService },
                { provide: AccountService, useValue: mockAccountService },
                FormBuilder,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule, MatMenuModule
                , StoreModule.forRoot({})
            ],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(PartialCensusComponent);
        component = fixture.componentInstance;
        coreService = TestBed.inject(CoreService);
        accountProfileService = TestBed.inject(AccountProfileService);
        memberService = TestBed.inject(MemberService) as jest.Mocked<MemberService>;
        staticUtilService = TestBed.inject(StaticUtilService);
        fb = TestBed.inject(FormBuilder);
        router = TestBed.inject(Router);
        utilService = TestBed.inject(UtilService);
        ngrxStore = TestBed.inject(NGRXStore);
        component.partialCensusForm = fb.group({
            street1Control: ['street1',Validators.required],
            street2Control: ['street2'],
            income: ["2500", Validators.required],
            totalIncomeForHourlyWage: [1000],
            hoursPerWeek: [40],
            weeksPerYear: [52],
            newDepartmentId: [],
            hourlyRate: [50],
            ssn: ["132-32-3232"],
            confirmSSN: [],
            annualIncome: ["100000", Validators.required],
            deliveryPreference: [CorrespondenceType.ELECTRONIC],
            emailID: ["test@aflac.com"],
            cellPhoneNumber: ["111-111-1111"],
            homePhoneNumber: [],
            departmentID: [{ name: "TestDept" }, { riskClass: "R" }],
            occupation: [],
            occupationDescription: [],
            correspondenceType: [],
            employerName: [null],
        });
        component.validationRegex = { EMAIL: "SAMPLE_REGEX" };
        component.getSecondaryLanguageKeys();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getProductDetails", () => {
        it("should get the product details of the selected product ID", () => {
            const product = {
                id: 1,
                name: "Accident",
            } as Product;
            const spy = jest.spyOn(coreService, "getProduct").mockReturnValue(of(product));
            component.getProductDetails(1);
            expect(spy).toBeCalled();
            expect(component.productDetail).toBe(product);
        });
    });

    describe("displayDefaultError", () => {
        it("should set the default error to be displayed ", () => {
            const error = {
                error: { status: "invalid", code: 500 },
            } as HttpErrorResponse;
            component.displayDefaultError(error);
            expect(component.error).toBe(true);
            expect(component.isSpinnerLoading).toBe(false);
            expect(component.errorMessage).toBe("secondary.api.invalid.500");
        });
    });

    describe("handleMemberInfoErrors", () => {
        it("should set the error message to be displayed as per api", () => {
            const error1 = {
                error: {
                    details: [{ status: 400, code: "badParameter", message: "invalid mpGroup", field: "phone" }],
                    status: 400,
                    code: "badParameter",
                },
            } as HttpErrorResponse;
            component.handleMemberInfoErrors(error1);
            expect(component.error).toBe(true);
            expect(component.isSpinnerLoading).toBe(false);
            expect(component.isLoading).toBe(false);
            expect(component.errorMessage).toBe("secondary.portal.members.api.400.badParameter.phone");
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });

    describe("setSalaryEmailValidations", () => {
        it("should setSalaryEmailValidations", () => {
            const memberProfile = {
                id: 1,
            } as MemberProfile;
            const spy = jest.spyOn(component, "setEmailValidator");
            spy.mockReturnValue();
            component.setSalaryEmailValidations(memberProfile);
            expect(spy).toBeCalled();
        });
    });

    describe("trimDecimalPoint", () => {
        it("should trim decimal value", () => {
            const event = {
                value: "50.7",
            } as HTMLInputElement;
            component.trimDecimalPoint(event);
            expect(component.partialCensusForm.get("hoursPerWeek").value).toMatch("50");
        });

        it("should keep exact value", () => {
            const event = {
                value: "50",
            } as HTMLInputElement;
            component.trimDecimalPoint(event);
            expect(component.partialCensusForm.get("hoursPerWeek").value).toMatch("50");
        });

        it("should not roundup", () => {
            const event = {
                value: "50.99",
            } as HTMLInputElement;
            component.trimDecimalPoint(event);
            expect(component.partialCensusForm.get("hoursPerWeek").value).toMatch("50");
        });
    });

    describe("saveNewDepartment", () => {
        it("should create new department and return Observable<HttpResponse<void>>", () => {
            component.addNewDepartmentFlag = true;
            component.partialCensusForm.get("newDepartmentId").setValue("dummy");
            const spy = jest.spyOn(accountProfileService, "createOrganization").mockReturnValue(of({} as HttpResponse<void>));
            component.saveNewDepartment().subscribe((response) => expect(response).toBe(HttpResponse));
            expect(spy).toBeCalled();
        });

        it("should not create new department and return Observable<null>", () => {
            component.addNewDepartmentFlag = false;
            component.partialCensusForm.get("newDepartmentId").setValue("dummy");
            component.saveNewDepartment().subscribe((response) => expect(response).toBe(null));
        });
    });

    describe("departmentChanged", () => {
        it("should set validator on newDepartmentId", () => {
            component.isAflacUser = true;
            const event = {
                value: component.ADD_NEW_DEPARTMENT_ID,
            } as MatSelectChange;
            component.departmentChanged(event);
            expect(component.partialCensusForm.get("newDepartmentId").validator).toBeDefined();
        });

        it("should clear the validator on newDepartmentId", () => {
            component.isAflacUser = true;
            const event = {
                value: "OLD_DEPARTMENT_ID",
            } as MatSelectChange;
            component.departmentChanged(event);
            expect(component.partialCensusForm.get("newDepartmentId").validator).toBeFalsy();
        });
    });

    describe("getPayLogixConfig", () => {
        it("should get PayLogixConfig value form cache", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigValue").mockReturnValue(of(ConfigName.EBS_PAYMENT_FEATURE_ENABLE));
            component.getPayLogixConfig().subscribe((response) => expect(response).toBe(ConfigName.EBS_PAYMENT_FEATURE_ENABLE));
            expect(spy).toBeCalledWith(ConfigName.EBS_PAYMENT_FEATURE_ENABLE);
        });
    });

    describe("getTpiAvailabilityConfig", () => {
        it("should get TpiAvailabilityConfig value form cache", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigValue").mockReturnValue(of("general.tpi.partial_census.enable"));
            component.getTpiAvailabilityConfig().subscribe((response) => expect(response).toBe("general.tpi.partial_census.enable"));
            expect(spy).toBeCalledWith("general.tpi.partial_census.enable");
        });
    });

    describe("getMinAndMaxConfiguration", () => {
        it("should get min and max annual salary. should also set the appropriate error messages", () => {
            component
                .getMinAndMaxConfiguration()
                .subscribe((response) => expect(response).toBe(["general.employee.salary.min", "general.employee.salary.max"]));
            expect(component.hoursPerWeekMoreThanMaxErrorMsg).toBe("secondary.portal.common.work.errHoursPerWeekMax");
            expect(component.hoursPerWeekLessThanMinErrorMsg).toBe("secondary.portal.common.work.errHoursPerWeekMin");
            expect(component.hourlyRateMoreThanMaxErrorMsg).toBe("secondary.portal.common.work.errHourlyRateMax");
            expect(component.hourlyRateLessThanMinErrorMsg).toBe("secondary.portal.common.work.errHourlyRateMin");
            expect(component.weeksPerYearMoreThanMaxErrorMsg).toBe("secondary.portal.common.work.errWeekPerYearMax");
            expect(component.weeksPerYearLessThanMinErrorMsg).toBe("secondary.portal.common.work.errWeekPerYearMin");
        });
    });

    describe("saveInfo", () => {
        it("should not invoke save member api call if no memberContactInfo change", () => {
            const memberInfo = { birthDate: "01-01-2001" } as MemberProfile;
            component.memberInfo = memberInfo;
            const spy = jest.spyOn(component, "saveMemberInfoApiCall");
            component.saveInfo();
            expect(spy).toBeCalledTimes(0);
        });

        it("should execute save member api call if memberContactInfo change", () => {
            const memberInfo = { birthDate: "01-01-2001" } as MemberProfile;
            component.memberInfo = memberInfo;
            component.memberContactDetails = {
                emailAddresses: [
                    {
                        email: "jest123@gmail.com",
                    },
                ] as EmailAddress[],
                address: {
                    country: "US",
                    countyId: 1,
                } as Address,
            } as MemberContact;

            const spy = jest.spyOn(component, "saveMemberInfoApiCall");
            component.saveInfo();
            expect(spy).toBeCalledTimes(0);
        });

        it("should handle new line logic correctly when form is valid and memberContactInfo.address exists", ()=> {
            const memberInfo = { birthDate: "01-01-2001" } as MemberProfile;
            component.memberInfo = memberInfo;
            component.memberContactDetails = {
                emailAddresses: [
                    {
                        email: "jest123@gmail.com",
                    },
                ] as EmailAddress[],
                address: {
                    address1: "123 Main St",
                    address2: "123 Main",
                    country: "US",
                    countyId: 1,
                } as Address,
            } as MemberContact;
            component.addressValidationSwitch = true;
            component.saveInfo();
            expect(component.memberContactDetails.address.address1).toBe('123 Main St');
            expect(component.memberContactDetails.address.address2).toBe('123 Main');
            expect(component.isSpinnerLoading).toBeFalsy();
            const spy = jest.spyOn(component, "verifyAddress");
            expect(spy).toBeCalledTimes(0);
        });

        it("should set isSpinnerLoading to be true if addressValidationSwitch is false", ()=> {
            const memberInfo = { birthDate: "01-01-2001" } as MemberProfile;
            component.memberInfo = memberInfo;
            component.memberContactDetails = {
                emailAddresses: [
                    {
                        email: "jest123@gmail.com",
                    },
                ] as EmailAddress[],
                address: {
                    address1: "123 Main St",
                    address2: "123 Main",
                    country: "US",
                    countyId: 1,
                } as Address,
            } as MemberContact;
            component.addressValidationSwitch = false;
            component.isSpinnerLoading = true;
            component.saveInfo();
            expect(component.isSpinnerLoading).toBe(true);
            const spy = jest.spyOn(component, "verifyAddress");
            expect(spy).not.toHaveBeenCalled();
        });

        it("should call saveMemberInfoApiCall if memberContactInfo is null or address is empty", ()=> {
            const memberInfo = { birthDate: "01-01-2001" } as MemberProfile;
            component.memberInfo = memberInfo;
            component.memberContactDetails = {
                emailAddresses: [
                    {
                        email: "jest123@gmail.com",
                    },
                ] as EmailAddress[],
                address: null,
            } as MemberContact;
            jest.spyOn(component,'saveMemberInfoApiCall');
            component.memberContactInfo = null;
            component.saveInfo();
            expect(component.saveMemberInfoApiCall).toBeCalledTimes(0);
        });

        it("should call saveMemberInfoApiCall if memberContactInfo.address is null or address is empty", ()=> {
            const memberInfo = { birthDate: "01-01-2001" } as MemberProfile;
            component.memberInfo = memberInfo;
            component.memberContactDetails = {
                emailAddresses: [
                    {
                        email: "jest123@gmail.com",
                    },
                ] as EmailAddress[],
                address: null,
            } as MemberContact;
            jest.spyOn(component,'saveMemberInfoApiCall');
            component.memberContactInfo = null;
            component.saveInfo();
            expect(component.saveMemberInfoApiCall).toBeCalledTimes(0);
        });

        it("should call saveMemberInfoApiCall if memberContactInfo.address.addres1 is empty", ()=> {
            const memberInfo = { birthDate: "01-01-2001" } as MemberProfile;
            component.memberInfo = memberInfo;
            component.memberContactDetails = {
                emailAddresses: [
                    {
                        email: "jest123@gmail.com",
                    },
                ] as EmailAddress[],
                address: {
                    address1: '',
                    address2: '',
                    country: "US",
                    countyId: 1,
                },
            } as MemberContact;
            jest.spyOn(component,'saveMemberInfoApiCall');
            component.saveInfo();
            expect(component.saveMemberInfoApiCall).toBeCalledTimes(0);
        });
        
        it('should handle new logic correctly when form is valid and address is null', ()=>{
            const memberInfo = { birthDate: "01-01-2001" } as MemberProfile;
            const mockAddress = {adress1: '123 Main St', address2: 'Apt 4B', city:'Sample City', zip:''};
            const spy1 = jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(of({ matched: true } as VerifiedAddress));
            component.memberInfo = memberInfo;
            component.memberContactInfo = {
                emailAddresses: [
                    {
                        email: "jest123@gmail.com",
                    },
                ] as EmailAddress[],
                address: null,
            } as MemberContact;
            component.memberContactDetails = {
                emailAddresses: [
                    {
                        email: "jest123@gmail.com",
                    },
                ] as EmailAddress[],
                address: {
                    address1: '',
                    address2: '',
                    country: "US",
                    countyId: 1,
                },
            } as MemberContact;
            component.memberContactInfo.address = null;
            component.addressValidationSwitch = true;
            expect(component.memberContactDetails.address.address1).toBe('');
            expect(component.memberContactDetails.address.address2).toBe('');
            expect(component.isSpinnerLoading).toBeFalsy();
            const spy = jest.spyOn(component, "verifyAddress");
            expect(spy).toBeCalledTimes(0);
        });
        it('should set isSpinnerLoading to true if addressValidationSwtich is false and address is null', ()=>{
            const memberInfo = { birthDate: "01-01-2001" } as MemberProfile;
            component.memberInfo = memberInfo;
            component.memberContactInfo = {
                emailAddresses: [
                    {
                        email: "jest123@gmail.com",
                    },
                ] as EmailAddress[],
                address:null,
            } as MemberContact;
            component.memberContactDetails = {
                emailAddresses: [
                    {
                        email: "jest123@gmail.com",
                    },
                ] as EmailAddress[],
                address: {
                    address1: '',
                    address2: '',
                    country: "US",
                    countyId: 1,
                },
            } as MemberContact;
            component.memberContactInfo.address = null;
            component.addressValidationSwitch = false;
            expect(component.isSpinnerLoading).toBe(undefined);
            const spy = jest.spyOn(component, "verifyAddress");
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe("getConfigForAddress()", () => {
        it("cacheConfigValue should be called", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { value: "TRUE", dataType: "BOOLEAN" },
                    { value: "TRUE", dataType: "BOOLEAN" },
                ] as Configurations[]),
            );
            component.getConfigForAddress();
            expect(spy).toBeCalledWith([AddressConfig.ADDRESS_VALIDATION, AddressConfig.ENABLE_DEPENDENT_ADDRESS_MODAL]);
            expect(component.addressValidationSwitch).toBe(true);
            expect(component.enableDependentUpdateAddressModal).toBe(true);
        });
    });

    describe("handleMemberInfoErrors", () => {
        it("should return error when error code [ValidEmail] and error status is 400", () => {
            const errorResponse = {
                status: AppSettings.API_RESP_400,
                error: {
                    status: AppSettings.API_RESP_400,
                    code: "badRequest",
                    ["details"]: [{ code: "ValidEmail", field: "Email", message: "Invalid Email" }],
                },
            } as HttpErrorResponse;
            component.handleMemberInfoErrors(errorResponse);
            expect(component.errorMessage).toStrictEqual("Invalid Email");
        });

        it("should return error when error code [RESTRICTED_EMAIL] and error status is 400", () => {
            const errorResponse = {
                status: AppSettings.API_RESP_400,
                error: {
                    status: AppSettings.API_RESP_400,
                    code: "badRequest",
                    ["details"]: [{ code: ClientErrorResponseDetailCodeType.RESTRICTED_EMAIL, field: "Email" }],
                },
            } as HttpErrorResponse;
            component.handleMemberInfoErrors(errorResponse);
            expect(component.partialCensusForm.controls.emailID.errors).toStrictEqual({ restrictedDomain: true });
        });

        it("should return error for any other error code and error status is 400", () => {
            const errorResponse = {
                status: AppSettings.API_RESP_400,
                error: { status: AppSettings.API_RESP_400, code: "badRequest", ["details"]: [{ code: "Generic", field: "Name" }] },
            } as HttpErrorResponse;
            component.handleMemberInfoErrors(errorResponse);
            expect(component.errorMessage).toStrictEqual("secondary.portal.members.api.400.badRequest.Name");
        });

        it("should set duplicateSSNFound error when error code SSN and error status is 409", () => {
            const errorResponse = {
                status: ClientErrorResponseCode.RESP_409,
                error: {
                    status: ClientErrorResponseCode.RESP_409,
                    code: ClientErrorResponseType.DUPLICATE,
                    ["details"]: [{ code: "SSN", field: "SSN" }],
                },
            } as HttpErrorResponse;
            component.handleMemberInfoErrors(errorResponse);
            expect(component.partialCensusForm.controls.ssn.errors).toStrictEqual({ duplicateSSNFound: true });
        });

        it("should set duplicateITINFound error when error code ITIN and error status is 409", () => {
            const errorResponse = {
                status: ClientErrorResponseCode.RESP_409,
                error: {
                    status: ClientErrorResponseCode.RESP_409,
                    code: ClientErrorResponseType.DUPLICATE,
                    ["details"]: [{ code: "ITIN", field: "ITIN" }],
                },
            } as HttpErrorResponse;
            component.handleMemberInfoErrors(errorResponse);
            expect(component.partialCensusForm.controls.ssn.errors).toStrictEqual({ duplicateITINFound: true });
        });

        it("should display default error for any status other than 400 & 409", () => {
            const errorResponse = {
                status: 401,
                error: { status: 401, code: "invalidToken" },
            } as HttpErrorResponse;
            component.handleMemberInfoErrors(errorResponse);
            expect(component.errorMessage).toStrictEqual("secondary.api.401.invalidToken");
        });
    });

    describe("getMemberSalaryObj", () => {
        it("should return null when not enabled", () => {
            component.enableSalaryFields = false;
            expect(component.getMemberSalaryObj()).toBeNull();
        });

        it("should return ANNUAL Salary object when selected", () => {
            component.enableSalaryFields = true;
            expect(component.getMemberSalaryObj()).toBeTruthy();
        });

        it("should return Salary object when WAGE selected", () => {
            component.enableSalaryFields = true;
            expect(component.getMemberSalaryObj()).toBeTruthy();
        });

        it("should return Salary object when ANNUAL income selected", () => {
            component.enableSalaryFields = true;
            component.partialCensusForm.controls.income.setValue("ANNUAL");
            expect(component.getMemberSalaryObj()).toBeTruthy();
        });
    });

    describe("getConfirmationDialogData", () => {
        it("should return updated contact data", () => {
            const memberInfo = {} as MemberProfile;
            component.memberInfo = memberInfo;
            expect(component.getConfirmationDialogData()).toHaveLength(3);
        });
    });

    describe("getMemberContactsObj", () => {
        it("should populate contact information from partial census form", () => {
            component.memberContactDetails = {
                emailAddresses: [] as EmailAddress[],
                phoneNumbers: [] as PhoneNumber[],
                address: {
                    country: "US",
                    countyId: 1,
                } as Address,
            } as MemberContact;
            jest.spyOn(utilService, 'copy').mockReturnValue(component.memberContactDetails);
            const memberContact = component.getMemberContactsObj();
            expect(memberContact.emailAddresses).toHaveLength(1);
            expect(memberContact.phoneNumbers).toHaveLength(1);
        });
    });

    describe("checkIncomeValue", () => {
        it("should set isIncomeHasLowValue to false when income mode is ANNUAL", () => {
            component.enableSalaryFields = true;
            component.productSpecificMinSalary = 100;
            component.partialCensusForm.controls.income.setValue("ANNUAL");
            component.partialCensusForm.controls.annualIncome.setValue(0);
            component.checkIncomeValue();
            expect(component.isIncomeHasLowValue).toBeFalsy();
        });

        it("should set isIncomeHasLowValue to false when income mode is other than ANNUAL", () => {
            component.enableSalaryFields = true;
            component.productSpecificMinSalary = 100;
            component.partialCensusForm.controls.annualIncome.setValue(0);
            component.checkIncomeValue();
            expect(component.isIncomeHasLowValue).toBeFalsy();
        });
    });

    describe("getGroupAttributesByNameSubscriber", () => {
        it("should invoke getGroupAttributesByName service", () => {
            component.getGroupAttributesByNameSubscriber().subscribe((response) => expect(response).toBe([]));
        });

        it("should required organization and employee id", () => {
            const groupAttributes = [
                { attribute: AppSettings.IS_DEPARTMENT_ID_REQUIRED, value: AppSettings.TRUE },
                { attribute: AppSettings.IS_EMPLOYEE_ID_REQUIRED, value: AppSettings.TRUE },
                { attribute: GroupAttributeEnum.EBS_INDICATOR, value: AppSettings.FALSE },
            ] as GroupAttribute[];
            component.getGroupAttributesByName(groupAttributes);
            expect(component.isOrganizationFieldRequired).toBeTruthy();
            expect(component.isEmployeeIdFieldRequired).toBeTruthy();
            expect(component.isEBS).toBeFalsy();
        });
    });

    describe("onRadioChange", () => {
        it("should set validators in annualIncome control when income is annual", () => {
            component.enableSalaryFields = true;
            const event = {
                value: "ANNUAL",
            } as MatRadioChange;

            component.onRadioChange(component.partialCensusForm.controls.income, event, "income");
            expect(component.partialCensusForm.controls.annualIncome.validator).toBeDefined();
            expect(component.partialCensusForm.controls.hourlyRate.validator).toBeFalsy();
            expect(component.partialCensusForm.controls.hoursPerWeek.validator).toBeFalsy();
            expect(component.partialCensusForm.controls.weeksPerYear.validator).toBeFalsy();
        });

        it("should set validators in hourlyRate, hoursPerWeek, weeksPerYear controls when income is not annual", () => {
            component.enableSalaryFields = true;
            const event = {
                value: "WAGE",
            } as MatRadioChange;

            component.onRadioChange(component.partialCensusForm.controls.income, event, "income");
            expect(component.partialCensusForm.controls.annualIncome.validator).toBeFalsy();
            expect(component.partialCensusForm.controls.hourlyRate.validator).toBeDefined();
            expect(component.partialCensusForm.controls.hoursPerWeek.validator).toBeDefined();
            expect(component.partialCensusForm.controls.weeksPerYear.validator).toBeDefined();
        });
    });

    describe("getMemberProfileObj", () => {
        it("should set ssn if not present in profile and config is enabled", () => {
            component.isSSNMandatoryConfigEnabled = true;
            const memberInfo = { ssn: null, workInformation: {}, profile: {} } as MemberProfile;
            component.memberInfo = memberInfo;
            expect(component.getMemberProfileObj().ssn).toEqual("132323232");
        });

        it("should set work information in profile if isAccountRatingCodePEO is enabled", () => {
            component.isAccountRatingCodePEO = true;
            const memberInfo = {
                organizationId: null,
                workInformation: {},
                profile: {},
            } as MemberProfile;
            component.memberInfo = memberInfo;
            expect(component.getMemberProfileObj().workInformation.departmentNumber).toEqual("TestDept");
        });
    });
    describe("initiateForm()", () => {
        it("should build the partial census form", () => {
            component.initiateForm();
            expect(component.partialCensusForm).toBeInstanceOf(FormGroup);
            expect(Object.keys(component.partialCensusForm.controls).length).toBe(19);
        });
    });

    describe("setRequiredFieldValidations()", () => {
        beforeEach(() => {
            component.initiateForm();
            component.isSSNMandatoryConfigEnabled = true;
            component.memberInfo = { workInformation: {}, organizationId: {}, ssn: "" } as MemberProfile;
            component.setRequiredFieldValidations();
        });
        it("should set the ssn field as invalid when ssn is not provided", () => {
            component.partialCensusForm.patchValue({ ssn: "" });
            expect(component.partialCensusForm.controls.ssn.valid).toBe(false);
        });

        it("should set the ssn field as valid when requirements are met", () => {
            component.partialCensusForm.patchValue({ ssn: "000-00-0000" });
            expect(component.partialCensusForm.controls.ssn.valid).toBe(true);
        });
    });

    describe("isIneligibleForEnroll()", () => {
        it("should return false if the hireDate of the member is in past", () => {
            component.memberInfo = {
                workInformation: { hireDate: new Date(new Date().setDate(new Date().getDate() - 1)) },
            } as MemberProfile;
            expect(component.isIneligibleForEnroll()).toBe(false);
        });
    });

    describe("onExit()", () => {
        it("should navigate to tpi/exit route when called", () => {
            const navigateSpy = jest.spyOn(router, "navigate");
            component.onExit();
            expect(navigateSpy).toHaveBeenCalledWith(["tpi/exit"]);
        });
    });

    describe("arrangeOrganization()", () => {
        it("should filter out Corporate department if isAflacUser is true", () =>{
            component.isAflacUser = true;
            const organizations = [
                {name: 'Corporate'},
                {name: 'Department A'},
                {name: 'Department B'}
            ];
            component.arrangeOrganization(organizations);
            expect(component.organizations).toEqual([
                {name:'Department A'},
                {name:'Department B'}
            ]);
        });

        it("should not filter any departments if isAflacUser is false", () =>{
            component.isAflacUser = false;
            const organizations = [
                {name: 'Corporate'},
                {name: 'Department A'},
                {name: 'Department B'}
            ];
            component.arrangeOrganization(organizations);
            expect(component.organizations).toEqual(organizations);
        });
    });

    describe("handleVerifyAddressError()", () => {
        it("address messages for 400 status", () => {
            component.memberContactDetails = {
                name: "name",
            } as MemberContact;
            const error = {
                error: {
                    status: 400,
                    details: [
                        {
                            message: "errorDetails",
                        },
                    ],
                    code: "value",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.handleAddressError(error);
            expect(component.memberContactDetails.addressValidationDate.toDateString()).toStrictEqual(new Date().toDateString());
            expect(component.addressVerificationMessages).toStrictEqual(["errorDetails"]);
            const error2 = {
                error: {
                    status: 400,
                    code: "value",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.handleAddressError(error2);
            expect(component.addressVerificationMessages).toContainEqual("secondary.portal.directAccount.invalidAdressdata");
        });
        it("addressVerificationMessages for api error status 500 and for other status", () => {
            const error = {
                error: {
                    status: 500,
                    code: "value",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.handleAddressError(error);
            expect(component.addressVerificationMessages).toContainEqual("secondary.portal.accountPendingEnrollments.internalServer");
            const error2 = {
                error: {
                    status: 401,
                    code: "value",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.handleAddressError(error2);
            expect(component.addressVerificationMessages).toContainEqual("secondary.api.401.value");
        });
    });

    describe("verifyAddressDetails()", () => {
        beforeEach(() => {
            component.memberContactDetails = { address: { state: "GA" } } as MemberContact;
        });
        it("should call verifyMemberAddress()", () => {
            const spy1 = jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(of({ matched: true } as VerifiedAddress));
            component.verifyAddress();
            expect(spy1).toBeCalledWith({ state: "GA" });
        });
        it("should call openAddressModal()", () => {
            jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(of({ matched: false } as VerifiedAddress));
            const spy = jest.spyOn(component, "openAddressModal").mockReturnValue(of({ isVerifyAddress: true, selectedAddress: "address" }));
            component.verifyAddress();
            expect(spy).toBeCalledWith("bothOption", { state: "GA" }, { matched: false });
        });
        it("should call handleVerifyAddressError() for api error response", () => {
            const error = {
                error: { message: "api error message" },
                status: 400,
            };
            jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(throwError(error));
            const spy = jest.spyOn(component, "handleAddressError");
            component.verifyAddress();
            expect(spy).toBeCalledWith(error);
        });
    });

    describe("getMemberContactInfo()", () => {
        it("should handle success response correctly", () => {
            component.memberContactDetails = {
                emailAddresses: [
                    {
                        email: "jest123@gmail.com",
                    },
                ] as EmailAddress[],
                address: {
                    address1: "123 Main St",
                    address2: "123 Main",
                    country: "US",
                    countyId: 1,
                } as Address,
            } as MemberContact;
            jest.spyOn(component, 'getMemberContactInfo');
            memberService.getMemberContact.mockReturnValue(of(component.memberContactDetails));
            component.getMemberContactInfo();
            component.address = {
                address1: "123 Main St",
                address2: "123 Main",
                country: "US",
                countyId: 1,
            } as Address;     
        });

        it('should handle error response correctly', ()=>{
            const mockError = { message: 'Error occured'};
            memberService.getMemberContact.mockReturnValue(throwError(mockError));
            component.getMemberContactInfo();
        });
    });
    describe("arrangePEOOrganization()", () => {
        it("should filter out UNSPECIFIED class and set peoDepartments to filtered classes", () =>{
            const classNames = [
                {name: 'Class1'},
                {name: 'Class2'},
                {name: 'UNSPECIFIED'}
            ];
            
            jest.spyOn(utilService, 'copy').mockReturnValue([...classNames]);
            component.arrangePEOOrganization(classNames);
            expect(utilService.copy).toHaveBeenCalledWith(classNames);
            expect(component.peoDepartments).toEqual(classNames);
        });

        it("should set peoDepartments to classNames if no UNSPECIFIED  class found", () =>{
            const classNames = [
                {name: 'Class1'},
                {name: 'Class2'}
            ];

            jest.spyOn(utilService, 'copy').mockReturnValue([...classNames]);
            component.arrangePEOOrganization(classNames);
            expect(utilService.copy).toHaveBeenCalledWith(classNames);
            expect(component.peoDepartments).toEqual(classNames);
        });

        it("should set peoDepartments to classNames if filteredPeoClasses is empty", () =>{
            const classNames = [
                {name: 'UNSPECIFIED'}
            ];

            jest.spyOn(utilService, 'copy').mockReturnValue([...classNames]);
            component.arrangePEOOrganization(classNames);
            expect(utilService.copy).toHaveBeenCalledWith(classNames);
            expect(component.peoDepartments).toEqual(classNames);
        });

        it("should handle empty array input gracefully", () =>{
            const classNames = [];
            component.arrangePEOOrganization(classNames);
            expect(component.peoDepartments).toEqual([]);
        });

        it("should handle errors thrown by utilService.copy", () =>{
            const classNames = [
                {name: 'Class1'},
                {name: 'Class2'}
            ];

            jest.spyOn(utilService, 'copy').mockImplementation(() => {
                throw new Error('Copy method error')
            });
            expect(() => component.arrangePEOOrganization(classNames)).toThrowError('Copy method error');
        });

    });
});

