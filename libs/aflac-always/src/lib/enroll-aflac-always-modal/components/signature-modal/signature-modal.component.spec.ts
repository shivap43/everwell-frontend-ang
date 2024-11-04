import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SignatureModalComponent } from "./signature-modal.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { RouterTestingModule } from "@angular/router/testing";
import { LanguageService } from "@empowered/language";
import {
    mockLanguageService,
    mockMatDialog,
    mockMatDialogRef,
    mockMemberService,
    mockRouter,
    mockShoppingCartDisplayService,
    mockUtilService,
} from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { AflacAlwaysService, MemberService, ShoppingCartDisplayService } from "@empowered/api";
import { UtilService } from "@empowered/ngxs-store";
import { Gender, MemberContact, MemberProfile } from "@empowered/constants";
import { of, throwError } from "rxjs";
import { HttpEventType, HttpHeaders, HttpResponse } from "@angular/common/http";

const mockMatDialogData = {
    mpGroup: 111,
    memberId: 2,
};

const mockContactData: MemberContact[] = [
    {
        address: {
            address1: "Marvel",
            city: "Colombia",
            state: "GA",
            zip: "30009",
        },
        emailAddresses: [
            {
                email: "plant-voyage+78@73rrdw3c.mailosaur.net",
                type: "PERSONAL",
                verified: false,
                primary: true,
                id: 32,
            },
        ],
        phoneNumbers: [
            {
                phoneNumber: "9876543232",
                type: "HOME",
                isMobile: false,
                verified: false,
                primary: true,
                id: 33,
            },
        ],
        phoneNumber: "9876543232",
        email: "plant-voyage+78@73rrdw3c.mailosaur.net",
    },
];

const mockMemberData: HttpResponse<MemberProfile> = {
    body: {
        id: 62,
        name: {
            firstName: "John",
            lastName: "Nichols",
            suffix: "",
            maidenName: "",
        },
        birthDate: "1982-09-01",
        ssn: "789234567",
        ssnConfirmed: true,
        verificationInformation: {
            verifiedPhone: "9876543232",
            verifiedEmail: "plant-voyage+78@73rrdw3c.mailosaur.net",
            zipCode: "30009",
        },
        registrationStatus: "CIAM_BASIC",
        gender: Gender.MALE,
    },
    type: HttpEventType.Response,
    clone: function (): HttpResponse<MemberProfile> {
        throw new Error("Function not implemented.");
    },
    headers: new HttpHeaders(),
    status: 0,
    statusText: "",
    url: "",
    ok: false,
};

describe("SignatureModalComponent", () => {
    let component: SignatureModalComponent;
    let fixture: ComponentFixture<SignatureModalComponent>;
    const formBuilder: FormBuilder = new FormBuilder();
    let matDialogRef: MatDialogRef<SignatureModalComponent>;
    let aflacAlwaysService: AflacAlwaysService;
    let router: Router;
    let memberService: MemberService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SignatureModalComponent],
            imports: [HttpClientTestingModule, ReactiveFormsModule, NgxsModule.forRoot([]), RouterTestingModule],
            providers: [
                { provide: FormBuilder, useValue: formBuilder },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: ShoppingCartDisplayService,
                    useValue: mockShoppingCartDisplayService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SignatureModalComponent);
        component = fixture.componentInstance;
        matDialogRef = TestBed.inject(MatDialogRef);
        aflacAlwaysService = TestBed.inject(AflacAlwaysService);
        memberService = TestBed.inject(MemberService);
        component.contactForm = formBuilder.group({
            firstName: null,
            lastName: null,
            contacts: { type: "email", contact: "a.b@gmail.com" },
        });
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("retrieveAndShowContactInfo", () => {
        it("should populate email and phone list as per the MemberContactList appropriately", () => {
            const mbrContactList = [
                {
                    emailAddresses: [{ email: "a.b@gmail.com", type: "PERSONAL", verified: false, primary: true, id: 1 }],
                    phoneNumbers: [{ phoneNumber: "7067812345", type: "HOME", isMobile: false, verified: false, primary: true, id: 1 }],
                    phoneNumber: "7067812345",
                    email: "a.b@gmail.com",
                    contactId: 2,
                    contactType: "HOME",
                    addressValidationDate: "2024-06-04T20:43:00",
                    immediateContactPreference: "UNKNOWN",
                },
                {
                    emailAddresses: [],
                    phoneNumbers: [],
                    phoneNumber: "7067812345",
                    email: "a.b@gmail.com",
                    contactId: 48,
                    contactType: "WORK",
                    immediateContactPreference: "UNKNOWN",
                },
            ] as unknown as MemberContact[];
            component.retrieveAndShowContactInfo(mbrContactList);
            expect(component.emailContacts).toHaveLength(1);
            expect(component.textContacts).toHaveLength(1);
            expect(component.selectedValue).toStrictEqual({ contact: "a.b@gmail.com", disableField: false, primary: true, type: "email" });
        });

        it("should populate phone and selected when email is missing ", () => {
            const mbrContactList = [
                {
                    phoneNumbers: [{ phoneNumber: "7067812345", type: "HOME", isMobile: false, verified: false, primary: true, id: 1 }],
                    phoneNumber: "7067812345",
                    contactId: 2,
                    contactType: "HOME",
                    addressValidationDate: "2024-06-04T20:43:00",
                    immediateContactPreference: "UNKNOWN",
                },
            ] as unknown as MemberContact[];
            component.retrieveAndShowContactInfo(mbrContactList);
            expect(component.emailContacts).toHaveLength(0);
            expect(component.textContacts).toHaveLength(1);
            expect(component.selectedValue).toStrictEqual({
                contact: "7067812345",
                disableField: false,
                type: "phoneNumber",
                formatted: undefined,
            });
            expect(component.contactList[0].contact).toBe("primary.portal.headset.noemailaddress");
        });
    });

    describe("utility methods", () => {
        it("should close the modal on skip and send later", () => {
            const spy1 = jest.spyOn(matDialogRef, "close");
            component.skipAndSend();
            expect(spy1).toBeCalled();
        });

        it("should close modal and send the enrollment link in text", () => {
            component.contactForm.controls["contacts"].setValue({
                contact: "7869543423",
                disableField: false,
                primary: true,
                type: "phoneNumber",
            });
            const spy1 = jest.spyOn(matDialogRef, "close");
            jest.spyOn(aflacAlwaysService, "requestAflacAlwaysSignature").mockReturnValue(of({} as HttpResponse<void>));
            component.sendToCustomer();
            expect(spy1).toBeCalled();
            expect(component.showError).toBeFalsy();
        });

        it("should return standard error message incase of service error", () => {
            component.contactForm.controls["contacts"].setValue({
                contact: "a.b@gmail.com",
                disableField: false,
                primary: true,
                type: "email",
            });
            jest.spyOn(aflacAlwaysService, "requestAflacAlwaysSignature").mockReturnValue(throwError({}));
            component.sendToCustomer();
            expect(component.showError).toBeTruthy();
            expect(component.errorMessage).toBe("secondary.portal.common.errorSendingRequestSignature");
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });

    describe("addContactInfo", () => {
        it("should navigate and close the modal on calling addContactInfo", () => {
            component.routeAfterLogin = "mockPath";
            component.mpGroup = 1;
            component.memberId = 1;
            const spy1 = jest.spyOn(matDialogRef, "close");
            const spy2 = jest.spyOn(router, "navigate");
            component.addContactInfo();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
    });

    describe("ngOnInit", () => {
        it("should initialize", () => {
            component.data.mpGroupId = 1;
            component.data.memberId = 5;
            const spy = jest.spyOn(component, "getMemberInfo");
            component.ngOnInit();
            expect(component.mpGroup).toEqual(component.data.mpGroupId);
            expect(component.memberId).toEqual(component.data.memberId);
            expect(spy).toBeCalledWith(component.data.memberId, component.data.mpGroupId);
        });
    });

    describe("getMemberInfo", () => {
        it("should fetch member information", () => {
            component.mpGroup = 1;
            component.memberId = 1;
            jest.spyOn(memberService, "getMember").mockReturnValue(of(mockMemberData));
            const spy = jest.spyOn(component, "retrieveAndShowContactInfo");
            component.getMemberInfo(component.memberId, component.mpGroup);
            expect(component.loadSpinner).toBeTruthy();
            expect(component.memberFirstName).toEqual("John");
            expect(spy).toBeCalled();
        });
    });

    describe("retrieveAndShowContactInfo", () => {
        it("should show contact information", () => {
            const emailContactData = [{ email: "plant-voyage+78@73rrdw3c.mailosaur.net", primary: true }];
            const contactListData = [
                { contact: "plant-voyage+78@73rrdw3c.mailosaur.net", disableField: false, primary: true, type: "email" },
                { contact: "9876543232", disableField: false, formatted: undefined, type: "phoneNumber" },
            ];
            const selectedValueData = {
                contact: "plant-voyage+78@73rrdw3c.mailosaur.net",
                disableField: false,
                primary: true,
                type: "email",
            };
            component.retrieveAndShowContactInfo(mockContactData);
            expect(component.emailContacts).toEqual(emailContactData);
            expect(component.textContacts).toEqual(["9876543232"]);
            expect(component.contactList).toEqual(contactListData);
            expect(component.selectedValue).toEqual(selectedValueData);
            expect(component.hasMemberContact).toBeTruthy();
            expect(component.contactForm.controls.contacts.value).toEqual(selectedValueData);
            expect(component.loadSpinner).toBeFalsy();
        });
    });
});
