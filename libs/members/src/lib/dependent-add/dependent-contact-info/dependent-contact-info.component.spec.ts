import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DependentContactInfoComponent } from "./dependent-contact-info.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Pipe, PipeTransform, SimpleChange, SimpleChanges } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, FormGroup } from "@angular/forms";
import { LanguageService, ReplaceTagPipe } from "@empowered/language";
import {
    mockActivatedRoute,
    mockAuthenticationService,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockMemberService,
    mockSharedService,
    mockStaticService,
    mockStore,
} from "@empowered/testing";
import { AuthenticationService, Configuration, MemberDependentContact, MemberService, StaticService } from "@empowered/api";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { SharedState } from "@empowered/ngxs-store";
import { DependentContactInterface } from "@empowered/constants";
import { BehaviorSubject, Subject, Subscription, of } from "rxjs";
import { EmpoweredModalService, SharedService } from "@empowered/common-services";
import { ActivatedRoute, Params } from "@angular/router";
import exp from "constants";
import { PhoneFormatConverterPipe } from "@empowered/ui";
import { MatMenuModule } from "@angular/material/menu";
import { MatHeaderRowDef, MatRowDef, MatFooterRowDef } from "@angular/material/table";

const data = {
    title: "Add phone number",
    inputLabel: "Phone",
    fieldType: ["HOME", "OTHER"],
    isPhone: true,
    inputName: "phonenumber",
    contacttype: "phonetype",
    validatorMaxLength: 12,
    editData: {},
    action: "Add",
    rowIndex: undefined,
    contactLength: 0,
    contactData: [{ id: 13, isMobile: false, phoneNumber: "9876667778", primary: true, type: "HOME", verified: false }],
};

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any): string {
        return "replaced";
    }
}

const mockRouteParams = new BehaviorSubject<Params>({ dependentId: 1 });

const mockRoute = {
    params: mockRouteParams.asObservable(),
} as ActivatedRoute;

describe("DependentContactInfoComponent", () => {
    let component: DependentContactInfoComponent;
    let fixture: ComponentFixture<DependentContactInfoComponent>;
    let staticService: StaticService;
    let memberService: MemberService;
    const formBuilder = new FormBuilder();
    let store: Store;
    let route: ActivatedRoute;
    let dialog: MatDialog;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                DependentContactInfoComponent,
                MockReplaceTagPipe,
                PhoneFormatConverterPipe,
                MatHeaderRowDef,
                MatRowDef,
                MatFooterRowDef,
            ],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
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
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                FormBuilder,
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                Configuration,
            ],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([SharedState]), MatMenuModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        store = TestBed.inject(Store);
        memberService = TestBed.inject(MemberService);
        store.reset({
            ...store.snapshot(),
            Member: {
                mpGroup: 111,
                memberId: 222,
            },
        });
        fixture = TestBed.createComponent(DependentContactInfoComponent);
        component = fixture.componentInstance;
        staticService = TestBed.inject(StaticService);
        route = TestBed.inject(ActivatedRoute);
        dialog = TestBed.inject(MatDialog);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("ngOnInit ", () => {
            const spy = jest.spyOn(component, "getConfigurations");
            component.ngOnInit();
            expect(spy).toBeCalledTimes(1);
        });

        it("should set serviceFirstName when ngOnInit is called", () => {
            component.ngOnInit();
            expect(component.serviceFirstName).toBe("Test");
        });
    });

    describe("ngOnChanges()", () => {
        it("should set the isLoading to false when change detected", () => {
            const spy = jest.spyOn(component as any, "getDependentContacts$");
            component.ngOnChanges({ isContactTab: { currentValue: "sss" } } as unknown as SimpleChanges);
            fixture.detectChanges();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("createFormControl()", () => {
        it("should initialized contactPreferenceForm when createFormControl", () => {
            component.createFormControl();
            expect(component.contactPreferenceForm).toBeTruthy();
        });
    });

    describe("showErrorAlertMessage", () => {
        it("should call showErrorAlertMessage() for api error response", () => {
            const error = {
                error: {
                    status: 400,
                    code: "incorrect parameter",
                    details: [{ code: "ValidEmail" }],
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toBe(undefined);
        });
    });

    describe("getDependentContacts", () => {
        it("should call getDependentContacts() for api error response", () => {
            (component as any).getDependentContacts$();
            expect(component.dependentId).toBe(1);
        });
    });

    describe("getConfigurations()", () => {
        it("should call getConfigurations api when 'getConfigurations' is called", () => {
            const spy = jest.spyOn(staticService, "getConfigurations");
            component.getConfigurations();
            expect(spy).toBeCalled();
        });
    });

    describe("setDependentCifStatus()", () => {
        it("should call getMemberDependent api when 'setDependentCifStatus' is called", () => {
            const spy = jest.spyOn(memberService, "getMemberDependent");
            component.setDependentCifStatus();
            expect(spy).toBeCalled();
        });
    });

    describe("settingValidations", () => {
        it("should call getValidationForKey when settingValidations is called with formGroup type", () => {
            const mockFormData = formBuilder.group({
                contactMethod: ["Phone"],
                timeOfDay: ["MORNING"],
            });
            component.validationConfigurations = [
                { name: "portal.member.form.contactInfoPopupForm.type", value: "required", dataType: "STRING" },
            ];
            const spy = jest.spyOn(component, "getValidationValueForKey");
            component.settingValidations(mockFormData);
            expect(spy).toBeCalled();
        });
    });

    describe("revertForm()", () => {
        beforeEach(() => {
            const mockFormData = formBuilder.group({
                contactMethod: ["Phone"],
                timeOfDay: ["MORNING"],
            });
            component.contactPreferenceForm = mockFormData;
        });

        it("Should revert form and other flags when revertForm method is called", () => {
            component.revertForm();
            expect(component.phoneData).toStrictEqual([]);
        });
    });

    describe("getContactDataChanges()", () => {
        beforeEach(() => {
            component.dependentContact = {
                emailAddresses: [],
                phoneNumbers: [],
            } as MemberDependentContact;
            component.languageStrings = {
                emailAddress: "email",
                phoneNumber: "phone",
            } as any;
            component.savedPrimaryEmailData = { email: "abc@abc.com" };
            component.savedPrimaryPhoneData = { phoneNumber: "9898777888" };
        });

        it("Should return updates primary phone number and email when getContactDataChanges method is called", () => {
            expect(component.getContactDataChanges()).toStrictEqual(["email : ", "phone : "]);
        });
    });

    describe("normalizeFormat()", () => {
        it("should remove - from phone numbers that is passed as input to function 'normalizeFormat'", () => {
            const valueNum = "998-009-334";
            expect(component.normalizeFormat(valueNum)).toBe("998009334");
        });
    });

    describe("bindDataToPhoneTableAndControls", () => {
        const res = {
            address: {
                address1: "2576 Andrew Unions Port",
                city: "Winston",
                state: "GA",
                zip: "30187",
                country: "USA",
            },
            emailAddresses: [],
            phoneNumbers: [
                {
                    phoneNumber: "8798989876",
                    type: "HOME",
                    isMobile: false,
                    verified: false,
                    primary: true,
                    id: 2,
                },
            ],
            phoneNumber: "8798989876",
            contactId: 4,
            contactType: "HOME",
            immediateContactPreference: "UNKNOWN",
        };
        it("should set phonenumber when bindDataToPhoneTableAndControls is called ", () => {
            component.dependentContact = {
                address: {
                    address1: "2576 Andrew Unions Port",
                    city: "Winston",
                    state: "GA",
                    zip: "30187",
                    country: "USA",
                },
                emailAddresses: [],
                phoneNumbers: [
                    {
                        phoneNumber: "8798989876",
                        type: "HOME",
                        isMobile: false,
                        verified: false,
                        primary: true,
                        id: 2,
                    },
                ],
                phoneNumber: "8798989876",
                contactType: undefined,
                immediateContactPreference: undefined,
            };
            (component as any).bindDataToPhoneTableAndControls$(res);
            expect(component.dependentContact["phoneNumbers"]).toStrictEqual([
                { id: 2, isMobile: false, phoneNumber: "8798989876", primary: true, type: "HOME", verified: false },
            ]);
        });
    });

    describe("bindDataToEmailTableAndControl", () => {
        const res = {
            address: {
                address1: "2576 Andrew Unions Port",
                city: "Winston",
                state: "GA",
                zip: "30187",
                country: "USA",
            },
            emailAddresses: [],
            phoneNumbers: [
                {
                    phoneNumber: "8798989876",
                    type: "HOME",
                    isMobile: false,
                    verified: false,
                    primary: true,
                    id: 2,
                },
            ],
            phoneNumber: "8798989876",
            contactId: 4,
            contactType: "HOME",
            immediateContactPreference: "UNKNOWN",
        };
        it("should set email when bindDataToEmailTableAndControl is called ", () => {
            component.dependentContact = {
                address: {
                    address1: "2576 Andrew Unions Port",
                    city: "Winston",
                    state: "GA",
                    zip: "30187",
                    country: "USA",
                },
                emailAddresses: [],
                phoneNumbers: [
                    {
                        phoneNumber: "8798989876",
                        type: "HOME",
                        isMobile: false,
                        verified: false,
                        primary: true,
                        id: 2,
                    },
                ],
                phoneNumber: "8798989876",
                contactType: undefined,
                immediateContactPreference: undefined,
            };
            (component as any).bindDataToEmailTableAndControl$(res);
            expect(component.dependentContact["emailAddresses"]).toStrictEqual([]);
        });
    });

    describe.skip("openDialog()", () => {
        it("should openDialog", () => {
            component.languageStrings = {
                emailAddress: "email",
                phoneNumber: "phone",
            } as any;
            const rowData = {
                phoneNumber: "8798989876",
                type: "HOME",
                isMobile: false,
                verified: false,
                primary: true,
                id: 2,
            };
            const spy = jest.spyOn(dialog, "open");
            component.openDialog("Phone", "Edit", rowData, 0);
            expect(spy).toBeCalled();
        });

        it("should call checkPrimaryContact, when action is add and isPhone is true", () => {
            const response = {
                afterClosed: () =>
                    of({
                        type: "OTHER",
                        phoneNumber: "878-698-9789",
                        extension: "",
                        primary: false,
                        isMobile: false,
                        isPhone: true,
                        action: "Add",
                        verified: false,
                    }),
            } as MatDialogRef<any>;
            jest.spyOn(mockMatDialog, "open").mockReturnValue(response);
            component.languageStrings = {
                emailAddress: "email",
                phoneNumber: "phone",
            } as any;
            const rowData = {
                phoneNumber: "8798989876",
                type: "HOME",
                isMobile: false,
                verified: false,
                primary: true,
                id: 2,
            };
            const spy = jest.spyOn(component, "checkPrimaryContact");
            component.openDialog("Phone", "Edit", rowData, 0);
            expect(spy).toBeCalledTimes(1);
        });

        it("should call checkPrimaryContact, when action is add and isPhone is false", () => {
            const response = {
                afterClosed: () =>
                    of({
                        type: "OTHER",
                        phoneNumber: "878-698-9789",
                        extension: "",
                        primary: false,
                        isMobile: false,
                        isPhone: false,
                        action: "Add",
                        verified: false,
                    }),
            } as MatDialogRef<any>;
            jest.spyOn(mockMatDialog, "open").mockReturnValue(response);
            component.languageStrings = {
                emailAddress: "email",
                phoneNumber: "phone",
            } as any;
            const rowData = {
                phoneNumber: "8798989876",
                type: "HOME",
                isMobile: false,
                verified: false,
                primary: true,
                id: 2,
            };
            const spy = jest.spyOn(component, "checkPrimaryContact");
            component.openDialog("Phone", "Edit", rowData, 0);
            expect(spy).toBeCalledTimes(1);
        });

        it("should call checkPrimaryContact, when action is edit and isPhone is true", () => {
            const response = {
                afterClosed: () =>
                    of({
                        type: "OTHER",
                        phoneNumber: "878-698-9789",
                        extension: "",
                        primary: false,
                        isMobile: false,
                        isPhone: true,
                        action: "Edit",
                        verified: false,
                    }),
            } as MatDialogRef<any>;
            jest.spyOn(mockMatDialog, "open").mockReturnValue(response);
            component.languageStrings = {
                emailAddress: "email",
                phoneNumber: "phone",
            } as any;
            const rowData = {
                phoneNumber: "8798989876",
                type: "HOME",
                isMobile: false,
                verified: false,
                primary: true,
                id: 2,
            };
            const spy = jest.spyOn(component, "checkPrimaryContact");
            component.openDialog("Phone", "Edit", rowData, 0);
            expect(spy).toBeCalledTimes(1);
        });

        it("should call checkPrimaryContact, when action is edit and isPhone is false", () => {
            const response = {
                afterClosed: () =>
                    of({
                        type: "OTHER",
                        phoneNumber: "878-698-9789",
                        extension: "",
                        primary: false,
                        isMobile: false,
                        isPhone: false,
                        action: "Edit",
                        verified: false,
                    }),
            } as MatDialogRef<any>;
            jest.spyOn(mockMatDialog, "open").mockReturnValue(response);
            component.languageStrings = {
                emailAddress: "email",
                phoneNumber: "phone",
            } as any;
            const rowData = {
                phoneNumber: "8798989876",
                type: "HOME",
                isMobile: false,
                verified: false,
                primary: true,
                id: 2,
            };
            const spy = jest.spyOn(component, "checkPrimaryContact");
            component.openDialog("Phone", "Edit", rowData, 0);
            expect(spy).toBeCalledTimes(1);
        });

        it("should set phoneData to [], when action is delete and isPhone is false", () => {
            const response = {
                afterClosed: () =>
                    of({
                        type: "OTHER",
                        phoneNumber: "878-698-9789",
                        extension: "",
                        primary: false,
                        isMobile: false,
                        isPhone: false,
                        action: "Delete",
                        verified: false,
                    }),
            } as MatDialogRef<any>;
            jest.spyOn(mockMatDialog, "open").mockReturnValue(response);
            component.languageStrings = {
                emailAddress: "email",
                phoneNumber: "phone",
            } as any;
            const rowData = {
                phoneNumber: "8798989876",
                type: "HOME",
                isMobile: false,
                verified: false,
                primary: true,
                id: 2,
            };
            component.openDialog("Phone", "Delete", rowData, 0);
            expect(component.phoneData).toStrictEqual([]);
        });
    });

    describe("OnConfirmDialogAction()", () => {
        beforeEach(() => {
            const mockFormData = formBuilder.group({
                contactMethod: ["Phone"],
                timeOfDay: ["MORNING"],
            });
            component.contactPreferenceForm = mockFormData;

            component.dependentContact = {
                emailAddresses: [],
                phoneNumbers: [],
            } as MemberDependentContact;
        });
        it("should remove - from phone numbers that is passed as input to function 'OnConfirmDialogAction'", () => {
            const spy = jest.spyOn(component, "saveDependentContact");
            component.OnConfirmDialogAction(true);
            expect(spy).toBeCalled();
        });

        it("should complete navigation", () => {
            component.allowNavigation = new Subject<boolean>();
            const spy1 = jest.spyOn(component["allowNavigation"], "next");
            const spy2 = jest.spyOn(component["allowNavigation"], "complete");
            component.OnConfirmDialogAction(false);
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
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

        it("should complete allowNavigation subject when component is destroyed", () => {
            component.allowNavigation = new Subject<boolean>();
            component.allowNavigation.next(true);
            component.allowNavigation.complete();
            const spy1 = jest.spyOn(component["allowNavigation"], "unsubscribe");
            component.ngOnDestroy();
            expect(spy1).toBeCalled();
        });
    });
});
