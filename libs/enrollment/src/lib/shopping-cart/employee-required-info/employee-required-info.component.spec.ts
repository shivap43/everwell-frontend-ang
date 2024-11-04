import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Directive, ElementRef, Input } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { EmployeeRequiredInfoComponent } from "./employee-required-info.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { LanguageService } from "@empowered/language";
import {
    mockAccountService,
    mockAddressMatchingService,
    mockCoreService,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockMatDialogRef,
    mockMemberService,
    mockSharedService,
    mockStaticUtilService,
    mockStore,
    mockUserService,
    mockUtilService,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { ConfirmSsnService, DependentAddressUpdateModalComponent, SsnFormatPipe } from "@empowered/ui";
import {
    AccountDetails,
    AccountProfileService,
    AccountService,
    CartItem,
    CoreService,
    DependentContact,
    MemberService,
    StaticService,
} from "@empowered/api";
import { SetErrorForShop, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { DomSanitizer } from "@angular/platform-browser";
import { UserService } from "@empowered/user";
import {
    AccountProfileBusinessService,
    AddressMatchingService,
    EmpoweredModalService,
    SharedService,
    TPIRestrictionsForHQAccountsService,
} from "@empowered/common-services";
import { RouterTestingModule } from "@angular/router/testing";
import { Address, ApiError, CorrespondenceType, MemberContact, MemberDependent, MemberProfile, RiskClass } from "@empowered/constants";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDatepicker } from "@angular/material/datepicker";
import { of, throwError } from "rxjs";
import { HttpResponse } from "@angular/common/http";

const matDialogData = {
    mpGroupId: "123",
    checkEBSEmail: false,
};
@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

@Component({
    selector: "mat-datepicker",
    template: "",
})
class MockMatDatepickerComponent {}

@Component({
    selector: "mat-datepicker-toggle",
    template: "",
})
class MockMatDatepickerToggleComponent {
    @Input() for!: string;
}

@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}
@Directive({
    selector: "[maxlength]",
})
class MockMaxlengthDirective {
    @Input() maxlength!: string;
}
@Directive({
    selector: "[disableControl]",
})
class MockDisabledDirective {
    @Input() disableControl: boolean;
}

describe("EmployeeRequiredInfoComponent", () => {
    let component: EmployeeRequiredInfoComponent;
    let fixture: ComponentFixture<EmployeeRequiredInfoComponent>;
    let empoweredModalService: EmpoweredModalService;
    const formBuilder = new FormBuilder();
    let matDialogRef: MatDialogRef<EmployeeRequiredInfoComponent>;
    let sharedService: SharedService;
    let addressMatchingService: AddressMatchingService;
    let memberService: MemberService;
    let staticUtilService: StaticUtilService;
    let accountProfileService: AccountProfileService;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                EmployeeRequiredInfoComponent,
                MockRichTooltipDirective,
                MockMatDatepickerToggleComponent,
                MockMatDatepickerComponent,
                MockMatDatePickerDirective,
                MockMaxlengthDirective,
                MockDisabledDirective,
            ],
            providers: [
                {
                    provide: StaticService,
                    useValue: {},
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: ElementRef,
                    useValue: {},
                },
                {
                    provide: DomSanitizer,
                    useValue: {},
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: empoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: TPIRestrictionsForHQAccountsService,
                    useValue: {},
                },
                {
                    provide: AccountProfileBusinessService,
                    useValue: {},
                },
                {
                    provide: CoreService,
                    useValue: mockCoreService,
                },
                {
                    provide: AddressMatchingService,
                    useValue: mockAddressMatchingService,
                },
                {
                    provide: ConfirmSsnService,
                    useValue: {},
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: matDialogData,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                SsnFormatPipe,
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                FormBuilder,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [NgxsModule.forRoot([]), HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EmployeeRequiredInfoComponent);
        component = fixture.componentInstance;
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        fixture = TestBed.createComponent(EmployeeRequiredInfoComponent);
        component = fixture.componentInstance;
        component.form = formBuilder.group({
            emailAddress: [""],
            phoneType: [""],
            firstName: [""],
            lastName: [""],
            deliveryPreferance: [""],
            consentEmail: [""],
            birthDate: [""],
            genderName: [""],
            city: [""],
            ssn: [""],
            phoneNumber: [""],
            address1: [""],
            state: [""],
            zip: [""],
            cellType: [""],
            workState: [""],
            workZip: [""],
            jobDuties: [""],
            jobTitle: [""],
            employeeCustomID: [""],
            organizationId: [""],
        });
        component.validationRegex = { JOB_TITLE: "some job name regex" };
        component.validationRegex = { NAME: "some name regex" };
        matDialogRef = TestBed.inject(MatDialogRef);
        jest.clearAllMocks();
        sharedService = TestBed.inject(SharedService);
        addressMatchingService = TestBed.inject(AddressMatchingService);
        component.memberInfo = { id: 10 } as MemberProfile;
        component.mpGroupId = 12345;
        memberService = TestBed.inject(MemberService);
        store = TestBed.inject(Store);
        staticUtilService = TestBed.inject(StaticUtilService);
        accountProfileService = TestBed.inject(AccountProfileService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("saveInfo()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            component.memberContactInfo = { address: { address1: "street1", city: "test" } } as MemberContact;
        });
        it("should set ssn field as touched", () => {
            component.data.ssnRequiredForEnrollment = true;
            component.memberInfo = {} as MemberProfile;
            component.saveInfo();
            expect(component.form.controls["ssn"].touched).toBe(true);
        });

        it("should call checkAgentSelfEnrolled, validateAccountContactOrAccountProducerMatch and set isAddressMatched if it is not isAgentSelfEnrolled", () => {
            component.addressMatchConfig = true;
            component.data.isAIPlanInCart = true;
            const spy1 = jest.spyOn(sharedService, "checkAgentSelfEnrolled").mockReturnValue(of(false));
            const spy2 = jest.spyOn(addressMatchingService, "validateAccountContactOrAccountProducerMatch").mockReturnValue(of(true));
            component.saveInfo();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
            expect(component.isAddressMatched).toBe(true);
        });
        it("should call checkAgentSelfEnrolled and not call validateAccountContactOrAccountProducerMatch if it is isAgentSelfEnrolled", () => {
            component.addressMatchConfig = true;
            component.data.isAIPlanInCart = true;
            const spy1 = jest.spyOn(sharedService, "checkAgentSelfEnrolled").mockReturnValue(of(true));
            const spy2 = jest.spyOn(addressMatchingService, "validateAccountContactOrAccountProducerMatch");
            component.saveInfo();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(0);
        });
    });

    describe("checkEmailAndDeliveryPreference()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            component.memberContactInfo = { emailAddresses: [] };
            component.memberWorkContact = { emailAddresses: [] };
            component.updateMemberContact = { emailAddresses: [] };
            component.validationRegex = { email: "regex" };
        });

        it("should call checkEmailAndDeliveryPreference", () => {
            expect.assertions(1);
            const spy1 = jest.spyOn(component, "checkEmailAndDeliveryPreference");
            component.checkEmailAndDeliveryPreference();
            expect(spy1).toBeCalledTimes(1);
        });

        it("should enter first if when form submit true and no email", () => {
            expect.assertions(1);
            const spy1 = jest.spyOn(component, "checkEmailAndDeliveryPreference");
            component.memberContactInfo.emailAddresses.length = 0;
            component.memberWorkContact.emailAddresses.length = 0;
            component.isFormSubmit = true;
            component.checkEmailAndDeliveryPreference();
            expect(spy1).toBeCalledTimes(1);
        });

        it("should not close the modal form submit and checkEBSEmail", () => {
            expect.assertions(2);
            const spy1 = jest.spyOn(component, "checkEmailAndDeliveryPreference");
            component.memberContactInfo.emailAddresses.length = 0;
            component.memberWorkContact.emailAddresses.length = 0;
            component.isFormSubmit = true;
            component.data.checkEBSEmail = true;
            component.checkEmailAndDeliveryPreference();
            expect(spy1).toBeCalledTimes(1);
            expect(component.shouldCloseModal).toBeFalsy();
        });

        it("not form submit", () => {
            component.form.controls["deliveryPreferance"].setValue(CorrespondenceType.ELECTRONIC);
            component.checkEmailAndDeliveryPreference();
            expect(component.isEmailOptional).toBe(false);
        });
        it("form submit - check email", () => {
            component.isFormSubmit = true;
            component.form.controls["emailAddress"].setValue("test@test.com");
            component.checkEmailAndDeliveryPreference();
            expect(component.form.controls["consentEmail"].value).toBe("test@test.com");
        });

        it("form submit - check ebs", () => {
            component.isFormSubmit = true;
            matDialogData.checkEBSEmail = true;
            component.checkEmailAndDeliveryPreference();
            expect(component.isEmailOptional).toBe(false);
        });

        it("form submit - no email & email set to optional", () => {
            component.memberContactInfo.emailAddresses.length = 0;
            component.memberWorkContact.emailAddresses.length = 0;
            component.isFormSubmit = true;
            component.isEmailOptional = true;
            component.checkEmailAndDeliveryPreference();
            expect(component.shouldCloseModal).toBe(false);
        });

        it("form submit - no email", () => {
            component.form.controls.emailAddress.setValue("");
            component.isFormSubmit = true;
            component.data.checkEBSEmail = false;
            component.isEmailOptional = false;
            component.checkEmailAndDeliveryPreference();
            expect(component.shouldCloseModal).toBe(false);
        });

        it("form submit - email is added & modal will close", () => {
            component.isFormSubmit = true;
            component.form.controls["emailAddress"].setValue("test@test.com");
            component.checkEmailAndDeliveryPreference();
            expect(component.shouldCloseModal).toBe(true);
        });
    });

    describe("closeModal on submit", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            component.updateMemberContact = { address: {} } as MemberContact;
        });
        it("should close modal", () => {
            component.isAddressMatched = false;
            component.shouldCloseModal = true;
            const spy = jest.spyOn(matDialogRef, "close");
            component.closeDialogModal(true);
            expect(spy).toBeCalled();
        });

        it("should not close modal", () => {
            component.isAddressMatched = false;
            component.shouldCloseModal = false;
            const spy = jest.spyOn(matDialogRef, "close");
            component.closeDialogModal(true);
            expect(spy).toBeCalledTimes(0);
        });

        it("should call openDialog", () => {
            component.isAddressMatched = true;
            component.memberContactInfo = {};
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.closeDialogModal(true);
            expect(spy).toBeCalledTimes(1);
        });
    });
    describe("openProfileChangesConfirmPrompt()", () => {
        it("should call openDialog", (done) => {
            expect.assertions(1);
            const spy = jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () => of(true),
            } as MatDialogRef<any>);
            component.openProfileChangesConfirmPrompt(["steve", "smith"]).subscribe(() => {
                expect(spy).toBeCalledTimes(1);
                done();
            });
        });
    });
    describe("disableSubmitButton()", () => {
        it("should set disableSubmit and isSpinnerLoading", () => {
            component.disableSubmitButton();
            expect(component.disableSubmit).toBe(false);
            expect(component.isSpinnerLoading).toBe(false);
        });
    });
    describe("updateDependentAddress()", () => {
        it("should call saveDependentContact", (done) => {
            expect.assertions(1);
            component.mappedDependent = [{ address: { address1: "test" }, id: 1 }];
            const spy = jest.spyOn(memberService, "saveDependentContact").mockReturnValueOnce(of({} as HttpResponse<Response>));
            component.updateDependentAddress().subscribe(() => {
                expect(spy).toBeCalledWith({ address1: "test" }, 10, "1", 12345);
                done();
            });
        });
    });
    describe("checkCifNumber()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it("should call getMember, getStandardDemographicChangesConfig and openDialog", () => {
            const spy1 = jest
                .spyOn(memberService, "getMember")
                .mockReturnValue(of({ body: { customerInformationFileNumber: "234567" } } as HttpResponse<MemberProfile>));
            const spy2 = jest.spyOn(sharedService, "getStandardDemographicChangesConfig").mockReturnValue(of(true));
            const spy3 = jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () => of(true),
            } as MatDialogRef<any>);
            component.checkCifNumber(["firstName: steve"]);
            expect(spy1).toBeCalledWith(10, true, "12345");
            expect(spy2).toBeCalledTimes(1);
            expect(spy3).toBeCalledTimes(1);
        });
        it("should not call openDialog if member does not have customerInformationFileNumber", () => {
            jest.spyOn(memberService, "getMember").mockReturnValue(of({ body: {} } as HttpResponse<MemberProfile>));
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            expect(spy).not.toBeCalled();
        });
    });
    describe("getMemberDependents()", () => {
        it("should call getMemberDependents, getDependentContact and set dependentsArray", () => {
            const spy1 = jest.spyOn(memberService, "getMemberDependents").mockReturnValue(
                of([
                    { id: 1, name: "johny" },
                    { id: 2, name: "richard" },
                ] as MemberDependent[]),
            );
            const spy2 = jest.spyOn(memberService, "getDependentContact").mockReturnValue(of({ contactId: 3 } as DependentContact));
            component.getMemberDependents();
            expect(spy1).toBeCalledWith(10, true, 12345);
            expect(spy2).toBeCalledTimes(2);
            expect(component.dependentsArray).toStrictEqual([
                { id: 1, name: "johny", address: { contactId: 3 } },
                { id: 2, name: "richard", address: { contactId: 3 } },
            ]);
        });
        it("should dispatch an action when api throws an error", () => {
            jest.spyOn(memberService, "getMemberDependents").mockReturnValue(throwError({ error: { status: "500" } } as ApiError));
            const spy = jest.spyOn(store, "dispatch");
            component.getMemberDependents();
            expect(spy).toBeCalledWith(new SetErrorForShop({ status: "500" } as ApiError));
        });
    });
    describe("openDependentAddressUpdateModal()", () => {
        it("should call openDialog", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.dependentAddressUpdateConfig = true;
            component.dependentsArray = [{ id: 1 }];
            component.openDependentAddressUpdateModal({} as Address);
            expect(spy).toBeCalledWith(DependentAddressUpdateModalComponent, {
                data: {
                    memberId: 10,
                    memberAddress: {},
                },
                panelClass: "emp-modal-lib",
            });
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });

    describe("setJobDuty()", () => {
        it("should set jobDuties", () => {
            component.jobTitleAndDuties = [
                { title: "title1", duties: "duties1" },
                { title: "title2", duties: "duties2" },
            ];
            component.setJobDuty("title1");
            expect(component.jobDuty).toStrictEqual("duties1");
            expect(component.jobDutyPlaceholder).toStrictEqual("duties1");
            expect(component.form.controls.jobDuties.value).toStrictEqual("duties1");
        });
    });
    describe("calculateARatedJobClassAndDuty()", () => {
        it("should make api calls and set jobTitleAndDuties", () => {
            const spy1 = jest.spyOn(sharedService, "getIsDefaultOccupationClassA").mockReturnValue(true);
            const spy2 = jest.spyOn(staticUtilService, "cacheConfigValue").mockReturnValue(of("title1=duties1,title2=duties2"));
            const spy3 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
            component.accountCarrierRiskClass$ = of([] as RiskClass[]);
            component.calculateARatedJobClassAndDuty();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledWith("group.member.A_rated_job_duties");
            expect(spy3).toBeCalledWith("general.feature.enforce_job_duties_for_A_rate_code.enabled");
            expect(component.jobTitleAndDuties).toStrictEqual([
                { title: "title1", duties: "duties1" },
                { title: "title2", duties: "duties2" },
            ]);
        });
        it("should set jobTitle if isRiskClassA is true", () => {
            jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
            jest.spyOn(sharedService, "getIsDefaultOccupationClassA").mockReturnValue(false);
            component.accountCarrierRiskClass$ = of([
                { id: 1, name: "A" },
                { id: 2, name: "B" },
            ] as RiskClass[]);
            component.cartItems = [{ riskClassOverrideId: 1, id: 1 }] as CartItem[];
            component.memberInfo = {
                workInformation: { occupation: "Developer", occupationDescription: "description details" },
            } as MemberProfile;
            component.calculateARatedJobClassAndDuty();
            expect(component.memberInfo.workInformation.occupation).toBeNull();
            expect(component.memberInfo.workInformation.occupationDescription).toBeNull();
            expect(component.form.controls.jobDuties.value).toStrictEqual("");
        });
    });
    describe("fetchJobClasses()", () => {
        it("should assign getAccountCarrierRiskClasses when account info rating code is STANDARD", (done) => {
            const spy = jest.spyOn(accountProfileService, "getAccountCarrierRiskClasses").mockReturnValue(of([]));
            component.getAccountInfo = { ratingCode: "STANDARD" } as AccountDetails;
            expect.assertions(1);
            component.fetchJobClasses();
            component.accountCarrierRiskClass$.subscribe(() => {
                expect(spy).toBeCalledTimes(1);
                done();
            });
        });
        it("should assign getMemberCarrierRiskClasses when account info rating code is PEO", (done) => {
            const spy = jest.spyOn(memberService, "getMemberCarrierRiskClasses").mockReturnValue(of([]));
            component.getAccountInfo = { ratingCode: "PEO" } as AccountDetails;
            component.fetchJobClasses();
            expect.assertions(1);
            component.accountCarrierRiskClass$.subscribe(() => {
                expect(spy).toBeCalledTimes(1);
                done();
            });
        });
    });
});
