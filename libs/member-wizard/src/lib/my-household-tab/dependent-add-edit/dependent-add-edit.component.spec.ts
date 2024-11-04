import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { AccountService, Configuration, DependentContact, MemberFullProfile, MemberService, StaticService } from "@empowered/api";
import { EmpoweredModalService, SharedService } from "@empowered/common-services";
import { Gender } from "@empowered/constants";
import { DateService } from "@empowered/date";
import { LanguageService } from "@empowered/language";
import { SharedState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import {
    mockAccountService,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockMembersBusinessService,
    mockMemberService,
    mockRouter,
    mockSharedService,
    mockStaticService,
    mockStaticUtilService,
    mockUserService,
    mockUtilService,
} from "@empowered/testing";
import { AddressVerificationComponent, DependentAddressUpdateModalComponent, MaterialModule, MembersBusinessService } from "@empowered/ui";
import { UserService } from "@empowered/user";

import { NgxsModule, Store } from "@ngxs/store";
import { NgxMaskPipe } from "ngx-mask";
import { of } from "rxjs";
import { take } from "rxjs/operators";
import { DependentAddEditComponent } from "./dependent-add-edit.component";

const matDialogData = {
    mode: "edit",
    dependentData: {
        id: 3,
        name: {
            firstName: "Test",
            lastName: "Two",
            suffix: "",
            maidenName: "",
            nickname: "",
        },
        birthDate: "1987-01-05",
        gender: "FEMALE",
        profile: {
            maritalStatus: "UNREPORTED",
            languagePreference: "ENGLISH",
            tobaccoStatus: "UNDEFINED",
            medicareEligibility: false,
            correspondenceType: "ELECTRONIC",
            correspondenceLocation: "HOME",
            communicationPreference: "EMAIL",
            allowCallCenter: false,
            test: false,
            hiddenFromEmployee: false,
            ineligibleForCoverage: false,
            courtOrdered: false,
        },
        workInformation: {
            occupation: "fwewd",
            occupationDescription: "weweew",
            hireDate: "2022-01-04",
            organizationId: 1,
            payrollFrequencyId: 79,
            termination: {},
            employeeIdRequired: false,
            hoursPerWeekRequired: false,
        },
        ssn: "134545435",
        ssnConfirmed: true,
        verificationInformation: {
            verifiedPhone: "9098908980",
            verifiedEmail: "abc@abc.com",
            zipCode: "31008",
        },
        registrationStatus: "EVERWELL_EXISTING",
        memberId: 3,
        groupId: 77904,
        contact: {
            address: {
                address1: "54476 hbkjhjuhk",
                address2: "Apt 102",
                city: "dcwcwdcwd",
                state: "GA",
                zip: "31008",
            },
            emailAddresses: [
                {
                    email: "abc@abc.com",
                    type: "PERSONAL",
                    verified: false,
                    primary: true,
                    id: 2,
                },
            ],
            phoneNumbers: [
                {
                    phoneNumber: "9098908980",
                    type: "HOME",
                    isMobile: false,
                    verified: false,
                    primary: true,
                    id: 4,
                },
            ],
            phoneNumber: "9098908980",
            email: "abc@abc.com",
            contactId: 2,
            contactType: "HOME",
            addressValidationDate: "2023-12-12T04:00:23",
            immediateContactPreference: "UNKNOWN",
        },
        dependentRelationId: -1,
        manageMenuItems: [
            {
                value: "edit",
                label: "Edit",
            },
        ],
    },
    userData: {
        id: 3,
        name: {
            firstName: "Test",
            lastName: "Two",
            suffix: "",
            maidenName: "",
            nickname: "",
        },
        birthDate: "1987-01-05",
        gender: "FEMALE",
        profile: {
            maritalStatus: "UNREPORTED",
            languagePreference: "ENGLISH",
            tobaccoStatus: "UNDEFINED",
            medicareEligibility: false,
            correspondenceType: "ELECTRONIC",
            correspondenceLocation: "HOME",
            communicationPreference: "EMAIL",
            allowCallCenter: false,
            test: false,
            hiddenFromEmployee: false,
            ineligibleForCoverage: false,
            courtOrdered: false,
        },
        workInformation: {
            occupation: "fwewd",
            occupationDescription: "weweew",
            hireDate: "2022-01-04",
            organizationId: 1,
            payrollFrequencyId: 79,
            termination: {},
            employeeIdRequired: false,
            hoursPerWeekRequired: false,
        },
        ssn: "134545435",
        ssnConfirmed: true,
        verificationInformation: {
            verifiedPhone: "9098908980",
            verifiedEmail: "abc@abc.com",
            zipCode: "31008",
        },
        registrationStatus: "EVERWELL_EXISTING",
        memberId: 3,
        groupId: 77904,
        contact: {
            address: {
                address1: "54476 hbkjhjuhk",
                address2: "Apt 102",
                city: "dcwcwdcwd",
                state: "GA",
                zip: "31008",
            },
            emailAddresses: [
                {
                    email: "abc@abc.com",
                    type: "PERSONAL",
                    verified: false,
                    primary: true,
                    id: 2,
                },
            ],
            phoneNumbers: [
                {
                    phoneNumber: "9098908980",
                    type: "HOME",
                    isMobile: false,
                    verified: false,
                    primary: true,
                    id: 4,
                },
            ],
            phoneNumber: "9098908980",
            email: "abc@abc.com",
            contactId: 2,
            contactType: "HOME",
            addressValidationDate: "2023-12-12T04:00:23",
            immediateContactPreference: "UNKNOWN",
        },
    },
};

describe("DependentAddEditComponent", () => {
    let component: DependentAddEditComponent;
    let fixture: ComponentFixture<DependentAddEditComponent>;
    let store: Store;
    let memberService: MemberService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DependentAddEditComponent],
            imports: [NgxsModule.forRoot([SharedState]), ReactiveFormsModule, HttpClientTestingModule, MaterialModule],
            providers: [
                FormBuilder,
                DatePipe,
                NgxMaskPipe,
                DateService,
                Configuration,
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: matDialogData,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
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
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: MembersBusinessService,
                    useValue: mockMembersBusinessService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DependentAddEditComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        memberService = TestBed.inject(MemberService);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: { NAME_WITH_SPACE_ALLOWED: "value" },
                portal: "portal",
            },
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should call getMemberDependents method of memberService in ngOnInit()", () => {
            const spy = jest.spyOn(memberService, "getMemberDependents");

            component.ngOnInit();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("Feature: Address Verification Modal", () => {
        let addressDialog: any;
        let dependentAddressDialog: any;
        let openDialogSpy: jest.SpyInstance;

        const option = "1";

        const afterClosed = {
            data: {
                selectedAddress: "123 address",
                isVerifyAddress: true,
                contact: { address: null },
            },
        };

        const memberProfile = {
            name: null,
            birthDate: "",
            gender: Gender.MALE,
            profile: null,
            workInformation: null,
            ssn: "",
            hireDate: "",
            employeeId: "",
            organizationId: 0,
            id: 1,
            username: "john.doe",
            memberId: 1,
            groupId: 1,
            contact: { address: null },
        };

        const errorStatus = {} as never;

        const expectOnlyAddressModalShown = () => {
            expect(openDialogSpy).toHaveBeenCalledTimes(1);

            expect(openDialogSpy).toHaveBeenLastCalledWith(AddressVerificationComponent, {
                data: {
                    suggestedAddress: component.suggestedAddress,
                    providedAddress: component.tempMemberAddress,
                    addressResp: component.addressResp,
                    addressMessage: component.addressMessage,
                    option: option,
                    errorStatus: errorStatus,
                },
            });
        };

        const expectBothAddressAndDependentAddressModalShown = () => {
            expect(openDialogSpy).toHaveBeenCalledTimes(2);

            expect(openDialogSpy).toHaveBeenLastCalledWith(DependentAddressUpdateModalComponent, {
                data: {
                    memberId: component.data.userData.memberId,
                    memberAddress: component.suggestedAddress,
                },
            });
        };

        const initialize = (isVerifyAddress: boolean) => {
            afterClosed.data.isVerifyAddress = isVerifyAddress;

            component.suggestedAddress = {
                address1: "123 address",
                address2: "Apt 102",
                city: "dcwcwdcwd",
                state: "GA",
                zip: "31008",
            };

            component.tempMemberAddress = {
                address1: "12345 address",
                address2: "Apt 102",
                city: "dcwcwdcwd",
                state: "GA",
                zip: "31008",
            };

            component.addressResp = false;

            addressDialog = {
                afterClosed: () => of({ ...afterClosed }),
            };

            dependentAddressDialog = {
                afterClosed: () => of({ ...afterClosed }),
            };

            openDialogSpy = jest
                .spyOn(component["empoweredModalService"], "openDialog")
                .mockReturnValue(addressDialog)
                .mockReturnValueOnce(addressDialog)
                .mockReturnValueOnce(dependentAddressDialog);
        };

        const setTestState = (state: { enableDependentAddressModal: boolean; dependentList?: unknown[] }) => {
            component["enableDependentAddressModal"] = state.enableDependentAddressModal;
            component["dependentList"] = state.dependentList?.length > 0 ? (state.dependentList as never) : [];
        };

        const act = (assertion: CallableFunction) =>
            component
                .openModal(option, memberProfile, errorStatus)
                .pipe(take(1))
                .subscribe(() => assertion());

        afterEach(() => jest.clearAllMocks());

        describe("Scenario: Address verification is active", () => {
            beforeEach(() => initialize(true));

            describe("Scenario: There are dependents, but dependent address verification is not active", () => {
                beforeEach(() => {
                    setTestState({
                        enableDependentAddressModal: false,
                        dependentList: [{ memberId: 1 }],
                    });
                });

                it(`
                    GIVEN address verification is active
                    AND there are dependents
                    BUT the dependent address modal config is not active
                    WHEN the address verification modal closes
                    THEN the dependent address modal should not open
                `, () => {
                    act(expectOnlyAddressModalShown);
                });
            });

            describe("Scenario: Address verification is active, but there are no dependents", () => {
                beforeEach(() => {
                    setTestState({
                        enableDependentAddressModal: true,
                        dependentList: [],
                    });
                });

                it(`
                    GIVEN address verification is active
                    AND the dependent address modal config is active
                    BUT there are no dependents
                    WHEN the address verification modal closes
                    THEN the dependent address modal should not open
                `, () => {
                    act(expectOnlyAddressModalShown);
                });
            });

            describe("Scenario: Address verification is active, and there are dependents", () => {
                beforeEach(() => {
                    setTestState({
                        enableDependentAddressModal: true,
                        dependentList: [{ memberId: 1 }],
                    });
                });

                it(`
                    GIVEN address verification is active
                    AND the dependent address modal config is active
                    AND there are dependents
                    WHEN the address verification modal closes
                    THEN the dependent address modal should open
                `, () => {
                    act(expectBothAddressAndDependentAddressModalShown);
                });
            });
        });

        describe("Scenario: Address verification is not active", () => {
            beforeEach(() => initialize(false));

            describe("Scenario: There are dependents, and dependent address modal config is active", () => {
                beforeEach(() => {
                    setTestState({
                        enableDependentAddressModal: true,
                        dependentList: [{ memberId: 1 }],
                    });
                });

                it(`
                    GIVEN address verification is not active
                    BUT the dependent address modal config is active
                    AND there are dependents
                    WHEN the address verification modal closes
                    THEN the dependent address modal should not open
                `, () => {
                    act(expectOnlyAddressModalShown);
                });
            });

            describe("Scenario: Address verification is active, but there are no dependents", () => {
                beforeEach(() => {
                    setTestState({
                        enableDependentAddressModal: true,
                        dependentList: [],
                    });
                });

                it(`
                    GIVEN address verification is not active
                    AND there are no dependents
                    BUT the dependent address modal config is active
                    WHEN the address verification modal closes
                    THEN the dependent address modal should not open
                `, () => {
                    act(expectOnlyAddressModalShown);
                });
            });

            describe("Scenario: Address verification is active, and there are dependents", () => {
                beforeEach(() => {
                    setTestState({
                        enableDependentAddressModal: true,
                        dependentList: [{ memberId: 1 }],
                    });
                });

                it(`
                    GIVEN address verification is not active
                    BUT there are dependents
                    AND the dependent address modal config is active
                    WHEN the address verification modal closes
                    THEN the dependent address modal should not open
                `, () => {
                    act(expectOnlyAddressModalShown);
                });
            });
        });
    });

    describe("updateMemberData()", () => {
        it("should call updateFullMemberProfile when updateMemberData is called", () => {
            const spy = jest.spyOn(memberService, "updateFullMemberProfile");
            component.updateMemberData({} as MemberFullProfile);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("compareMemberAndDependentAddress()", () => {
        it("should return true when address match in compareMemberAndDependentAddress method", () => {
            const memberAddress = {
                address: {
                    address1: "111 abc road",
                    state: "NC",
                    zip: "28202",
                },
            } as DependentContact;
            const dependentAddress = {
                address: {
                    address1: "111 abc road",
                    state: "NC",
                    zip: "28202",
                },
            } as DependentContact;
            expect(component.compareMemberAndDependentAddress(memberAddress, dependentAddress)).toBe(true);
        });
    });
});
