import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { EmpoweredModalService, SharedService } from "@empowered/common-services";
import { LanguageService } from "@empowered/language";
import { StaticUtilService, UtilService } from "@empowered/ngxs-store";
import {
    mockAccountService,
    mockActivatedRoute,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    MockReplaceTagPipe,
    mockRouter,
    mockSharedService,
    mockShoppingCartDisplayService,
    mockStaticService,
    mockStaticUtilService,
    mockStore,
    mockUserService,
    mockUtilService,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { DocumentsComponent } from "./documents.component";
import { ActivatedRoute, Router } from "@angular/router";
import { ShoppingCartDisplayService, MemberService, AccountService, StaticService } from "@empowered/api";
import { MatDialog } from "@angular/material/dialog";
import { UserService } from "@empowered/user";
import { MatMenuModule } from "@angular/material/menu";
import { Accounts, MemberContact, MemberProfile } from "@empowered/constants";
import { Observable, of, throwError } from "rxjs";
import { RouterTestingModule } from "@angular/router/testing";
import { MatTableModule } from "@angular/material/table";
import { HttpResponse } from "@angular/common/http";

@Pipe({
    name: "date",
})
class mockDatePipe implements PipeTransform {
    transform(date: string) {
        return "12/12/2021";
    }
}

@Pipe({
    name: "summary",
})
class mockSummaryPipe implements PipeTransform {
    transform(date: number) {
        return 90;
    }
}

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Directive({
    selector: "[isRestricted]",
})
class MockRestrictedDirective {
    @Input() isRestricted;
}

const mockMemberService = {
    getMemberContacts: (memberId: MemberProfile["id"], mpGroup?: string) =>
        of([
            {
                address: {
                    state: "GA",
                    zip: "30034",
                },
                emailAddresses: [
                    {
                        email: "test@aflac.com",
                        type: "PERSONAL",
                        verified: false,
                        primary: true,
                        id: 7,
                    },
                ],
                phoneNumbers: [
                    {
                        phoneNumber: "7041111111",
                        type: "HOME",
                        isMobile: false,
                        verified: false,
                        primary: true,
                        id: 4,
                    },
                ],
                phoneNumber: "7041111111",
                email: "test@aflac.com",
                contactId: 35,
                contactType: "HOME",
                immediateContactPreference: "EMAIL",
            },
        ]),
    getMemberNotes: (memberId: number, mpGroup: number, expand?: string) => of({}),
};

describe("DocumentsComponent", () => {
    let component: DocumentsComponent;
    let fixture: ComponentFixture<DocumentsComponent>;
    let store: Store;
    let memberService: MemberService;
    let accountService: AccountService;
    let shoppingCartService: ShoppingCartDisplayService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule,
                HttpClientTestingModule,
                ReactiveFormsModule,
                FormsModule,
                MatMenuModule,
                MatTableModule,
                NgxsModule.forRoot([]),
            ],
            declarations: [
                DocumentsComponent,
                MockReplaceTagPipe,
                mockDatePipe,
                mockSummaryPipe,
                MockRestrictedDirective,
                MockHasPermissionDirective,
            ],
            providers: [
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: ShoppingCartDisplayService,
                    useValue: mockShoppingCartDisplayService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
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
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DocumentsComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        memberService = TestBed.inject(MemberService);
        component.mpGroupId = 1;
        component.memberId = 2;
        accountService = TestBed.inject(AccountService);
        shoppingCartService = TestBed.inject(ShoppingCartDisplayService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getContactList()", () => {
        it("should initialize the form control name 'contacts'", () => {
            component.getContactList();
            expect(component.contactForm.controls.contacts).toBeDefined();
        });

        it("should select the email radio option in the presence of email address", () => {
            component.getContactList();
            expect(component.contactForm.controls.contacts.value.type).toBe("email");
        });

        it("should select the no email address radio option in the absence of email address", () => {
            jest.spyOn(memberService, "getMemberContacts").mockReturnValue(
                of([
                    {
                        phoneNumbers: [{ phoneNumber: "7041111111", type: "HOME", isMobile: false, verified: false, primary: true, id: 4 }],
                        phoneNumber: "7041111111",
                    },
                ]) as unknown as Observable<MemberContact[]>,
            );
            component.getContactList();
            expect(component.contactForm.controls.contacts.value.contact).toBe("primary.portal.headset.noemailaddress");
        });

        it("should not select any radio button if no email or phone number part of profile", () => {
            jest.spyOn(memberService, "getMemberContacts").mockReturnValue(
                of([
                    {
                        address: {
                            state: "GA",
                            zip: "30034",
                        },
                    },
                ]) as unknown as Observable<MemberContact[]>,
            );
            component.getContactList();
            expect(component.contactForm.controls.contacts.value).toBeFalsy();
        });
    });
    describe("getProducerDetails()", () => {
        it("should call getAccountProducers and set isAccountProducer", () => {
            component.producerId = 111;
            const spy = jest.spyOn(accountService, "getAccountProducers").mockReturnValue(of([{ producer: { id: 111 } }]));
            component.getProducerDetails();
            expect(spy).toBeCalledTimes(1);
            expect(component.isAccountProducer).toBe(true);
        });
    });
    describe("sendToCustomer()", () => {
        beforeEach(() => {
            component.contactForm = new FormGroup({
                contacts: new FormControl({ contact: "123456789" }),
            });
            component.isLoading = true;
            component.requestSent = false;
            jest.clearAllMocks();
        });
        it("should call requestShoppingCartSignature and set requestSent", () => {
            const spy = jest.spyOn(shoppingCartService, "requestShoppingCartSignature").mockReturnValue(of({} as HttpResponse<void>));
            component.sendToCustomer();
            expect(spy).toBeCalledWith(1, 2, { phoneNumber: "123456789" }, "PENDING_PDA");
            expect(component.requestSent).toBe(true);
        });
        it("should set isLoading and not set requestSent", () => {
            jest.spyOn(shoppingCartService, "requestShoppingCartSignature").mockReturnValue(throwError({ status: 404 }));
            component.sendToCustomer();
            expect(component.requestSent).toBe(false);
            expect(component.isLoading).toBe(false);
        });
    });
    describe("setCreatePDAPartnerAccountType()", () => {
        it("should set isCreatePdaPartnerAccountType$ call getAccount", () => {
            const spy = jest.spyOn(accountService, "getAccount").mockReturnValue(of({} as Accounts));
            component.setCreatePDAPartnerAccountType();
            expect(component.isCreatePdaPartnerAccountType$).toBeDefined();
            component.isCreatePdaPartnerAccountType$.subscribe();
            expect(spy).toBeCalledWith("1");
        });
    });
    describe("fetchDocuments()", () => {
        it("should call getMemberNotes", () => {
            component.isPrPDAConfigEnabled = true;
            const spy = jest.spyOn(memberService, "getMemberNotes").mockReturnValue(
                of([
                    { formInfo: { type: "PDA_PR" }, documents: [] },
                    { formInfo: { type: "PDA" }, documents: [] },
                ]),
            );
            component.fetchDocuments();
            expect(spy).toBeCalledWith(2, 1, "createAdminId,updateAdminId,documentIds");
            expect(component.showContact).toBe(true);
        });
    });
});
