import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { ContactInfoComponent } from "./contact-info.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialog, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder } from "@angular/forms";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { DatePipe } from "@angular/common";
import { RouterTestingModule } from "@angular/router/testing";
import { PrimaryContact, StaticService } from "@empowered/api";
import { Router } from "@angular/router";
import { MemberInfoState } from "@empowered/ngxs-store";
import { mockLanguageService, mockMatDialog, mockStaticService, mockRouter } from "@empowered/testing";
import { MatTableModule } from "@angular/material/table";
import { MatMenuModule } from "@angular/material/menu";
import { StoreModule } from "@ngrx/store";

@Pipe({
    name: "phone",
})
class MockPhonePipe implements PipeTransform {
    transform(value: number, country: string): string {
        return "123-456-7890";
    }
}

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}

@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

@Directive({
    selector: "[isRestricted]",
})
class MockIsRestrictedDirective {
    @Input() isRestricted;
}
@Component({
    selector: "mon-alert",
    template: "",
})
class MockMonAlertComponent {}

describe("ContactInfoComponent", () => {
    let component: ContactInfoComponent;
    let fixture: ComponentFixture<ContactInfoComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ContactInfoComponent,
                MockPhonePipe,
                MockMonSpinnerComponent,
                MockMonAlertComponent,
                MockRichTooltipDirective,
                MockIsRestrictedDirective,
            ],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
                FormBuilder,
                DatePipe,
                RouterTestingModule,
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [
                NgxsModule.forRoot([MemberInfoState]),
                HttpClientTestingModule,
                MatTableModule,
                MatMenuModule,
                StoreModule.forRoot({}),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            MemberAdd: {
                activeMemberId: 18,
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
                    verificationInformation: { zipCode: "32606" },
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
                    },
                },
                errorMessage: null,
                mpGroupId: "12345",
            },
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ContactInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("formValueChange()", () => {
        it("should set the form value change flag to true", () => {
            component.formValueChange();
            expect(component.isFormValueChange).toBeTruthy();
        });
    });

    describe("getPhoneEmailTypes()", () => {
        it("should get phone and email types from API", () => {
            component.getPhoneEmailTypes();
            expect(component.phonenumberTypes).toStrictEqual([]);
            expect(component.emailTypes).toStrictEqual([]);
        });
    });

    describe("getDefaultCommunicationPreference()", () => {
        it("should return PHONE if phone data is available", () => {
            component.primaryPhone = {
                isMobile: true,
            };
            component.getMemberData = {
                profile: {
                    communicationPreference: "PHONE",
                },
            };
            const response = component.getDefaultCommunicationPreference();
            expect(response).toBe("PHONE");
        });
        it("should return EMAIL if no phone data is available and email data is available", () => {
            component.primaryEmail = "test@gmail.com";
            component.getMemberData = {
                profile: {
                    communicationPreference: "EMAIL",
                },
            };
            const response = component.getDefaultCommunicationPreference();
            expect(response).toBe("EMAIL");
        });
        it("should return EMAIL by default", () => {
            component.phoneData = [];
            expect(component.getDefaultCommunicationPreference()).toBe(undefined);
        });
    });

    describe("handlePhoneAndEmailTypeEdit()", () => {
        let contact: PrimaryContact;
        beforeEach(() => {
            contact = {
                address: {
                    state: "LA",
                    zip: "35232",
                },
                phoneNumbers: [],
                emailAddresses: [],
                phoneNumber: "",
                cellPhoneNumber: "",
                email: "",
                id: 1,
                name: "",
                typeId: 1,
                type: {},
                primary: true,
            };
        });
        it("should set id as undefined for primary phone", () => {
            component.phoneData = [
                {
                    num: "1233211234",
                    type: "mobile",
                    primary: true,
                },
            ];
            component.handlePhoneAndEmailTypeEdit("phone", true, contact);
            expect(component.phoneData[0].id).toBe(undefined);
        });
        it("should set id as undefined for secondary phone", () => {
            component.phoneData = [
                {},
                {
                    num: "1233211234",
                    type: "mobile",
                    primary: true,
                },
            ];
            component.handlePhoneAndEmailTypeEdit("phone", false, contact);
            expect(component.phoneData[1].id).toBe(undefined);
        });
        it("should set id as undefined for primary email", () => {
            component.emailData = [
                {
                    email: "testprimary@gmail.com",
                    type: "email",
                    primary: true,
                },
            ];
            component.handlePhoneAndEmailTypeEdit("email", true, contact);
            expect(component.emailData[0].id).toBe(undefined);
        });
        it("should set id as undefined for secondary email", () => {
            component.emailData = [
                {},
                {
                    email: "testprimary@gmail.com",
                    type: "email",
                    primary: true,
                },
            ];
            component.handlePhoneAndEmailTypeEdit("email", false, contact);
            expect(component.emailData[1].id).toBe(undefined);
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
});
