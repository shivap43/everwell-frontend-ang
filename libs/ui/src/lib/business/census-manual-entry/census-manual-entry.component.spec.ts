import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CensusManualEntryComponent } from "./census-manual-entry.component";
import { NgxsModule, Store } from "@ngxs/store";
import { AccountProfileService, AuthenticationService, MemberService, StaticService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import {
    MockFilterSpousePipe,
    mockAccountProfileService,
    mockAuthenticationService,
    mockLanguageService,
    mockMatDialog,
    mockMemberService,
    mockRouter,
    mockStaticService,
    mockStore,
} from "@empowered/testing";
import { SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MemberContact, Vocabulary } from "@empowered/constants";
import { HasPermissionDirective } from "../../directives";
import { MaterialModule } from "../../material/material.module";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { Observable, Subject, of } from "rxjs";
import { MatMenuModule } from "@angular/material/menu";
import { StoreModule } from "@ngrx/store";

const mockRouteParams = new Subject<Params>();
const mockRoute = {
    snapshot: { params: mockRouteParams.asObservable() },
    parent: { parent: { parent: { parent: { params: mockRouteParams.asObservable() } } } },
};

const mockDialogData = {
    canOnlyCreateTestMember: false,
    canCreateTestMember: true,
    canCreateMember: true,
    isQuoteShopPage: false,
    mpGroupId: "12345",
};
const mockStaticUtilService = {
    cacheConfigValue: (configName: string) => of("some-config-value"),
    cacheConfigEnabled: (configName: string) => of(true),
    hasPermission: (permission: string) => of(true),
    cacheConfigs: (configNames: string[]) => of([{ name: "config-name", value: "config-value", dataType: "string" }]),
    fetchConfigs: (configNames: string[], mpGroup?: number) => of([{ name: "config-name", value: "config-value", dataType: "string" }]),
} as StaticUtilService;

describe("CensusManualEntryComponent", () => {
    let component: CensusManualEntryComponent;
    let fixture: ComponentFixture<CensusManualEntryComponent>;
    let store: Store;
    let memberService: MemberService;
    let languageService: LanguageService;
    let staticService: StaticService;
    let staticUtilService: StaticUtilService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CensusManualEntryComponent, HasPermissionDirective, MockFilterSpousePipe],
            imports: [
                NgxsModule.forRoot([SharedState]),
                HttpClientTestingModule,
                BrowserAnimationsModule,
                MaterialModule,
                MatMenuModule,
                ReactiveFormsModule,
                StoreModule.forRoot({}),
            ],
            providers: [
                FormBuilder,
                DatePipe,
                TitleCasePipe,
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
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
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockDialogData,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: AccountProfileService,
                    useValue: mockAccountProfileService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CensusManualEntryComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        memberService = TestBed.inject(MemberService);
        languageService = TestBed.inject(LanguageService);
        staticService = TestBed.inject(StaticService);
        staticUtilService = TestBed.inject(StaticUtilService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("fetchSecondaryLanguages()", () => {
        it("should call fetchSecondaryLanguageValues()", () => {
            const spy = jest.spyOn(languageService, "fetchSecondaryLanguageValues");
            component.fetchSecondaryLanguages();
            expect(spy).toBeCalled();
        });
    });

    describe("getEmployeeGender()", () => {
        it("should call getGenders()", () => {
            const spy = jest.spyOn(staticService, "getGenders");
            component.getEmployeeGender();
            expect(spy).toBeCalled();
        });
    });

    describe("fetchLanguageStrings()", () => {
        it("should call fetchPrimaryLanguageValues()", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            component.fetchLanguageStrings();
            expect(spy).toBeCalled();
        });
    });

    describe("worksiteLocationEnabled$", () => {
        it("Get worksiteLocationEnable config", (done) => {
            expect.assertions(1);
            component.worksiteLocationEnabled$.subscribe((config) => {
                expect(config).toBe(true);
                done();
            });
        });
    });

    describe("worksiteAddressSelectionChange()", () => {
        it("should disable work state and zip form control and set default value", () => {
            component.worksiteAddressSelectionChange(true);
            component.workAddressSameAsAccount = true;
            component.workInfoForm?.controls.state.disable();
            component.workInfoForm?.controls.zip.disable();
            component.workInfoForm?.controls.state.patchValue(component.accountDetails?.situs?.state.abbreviation);
            component.workInfoForm?.controls.zip.patchValue(component.accountDetails?.situs?.zip);
        });
        it("should enable work state and zip form control and clear value", () => {
            component.worksiteAddressSelectionChange(false);
            component.workAddressSameAsAccount = false;
            component.workInfoForm?.controls.state.enable();
            component.workInfoForm?.controls.zip.enable();
            component.workInfoForm?.controls.zip.reset();
            component.workInfoForm?.controls.state.reset();
        });
    });

    describe("addWorkStateAndZipFormControls()", () => {
        beforeEach(() => {
            component.workInfoForm = new FormGroup({
                hireDate: new FormControl(""),
                employeeId: new FormControl(""),
                hoursPerWeek: new FormControl(""),
                annualSalary: new FormControl(""),
                department: new FormControl(1),
            });
        });
        it("Should add state and zip form control to workInfoForm", (done) => {
            expect.assertions(2);
            component["worksiteLocationEnabled$"].subscribe((config) => {
                component.addWorkStateAndZipFormControls();
                component.workInfoForm.addControl(
                    "state",
                    new FormControl({
                        value: component.accountDetails?.situs?.state.abbreviation,
                        disabled: component.workAddressSameAsAccount,
                    }),
                );
                component.workInfoForm.addControl(
                    "zip",
                    new FormControl({ value: component.accountDetails?.situs?.zip, disabled: component.workAddressSameAsAccount }),
                );
                expect(config).toBe(true);
                expect(component.workAddressSameAsAccount).toBe(true);
                done();
            });
        });
    });

    describe("checkWorkZipCode()", () => {
        beforeEach(() => {
            component.workInfoForm = new FormGroup({
                hireDate: new FormControl(""),
                employeeId: new FormControl(""),
                hoursPerWeek: new FormControl(""),
                annualSalary: new FormControl(""),
                department: new FormControl(""),

                worksiteSameAsAccount: new FormControl(true),
                state: new FormControl(""),
                zip: new FormControl(""),
            });
        });
        it("should reset errors if no state or zip", () => {
            const zip = "";
            const state = "";
            component.checkWorkZipCode(state, zip);
            expect(component.workInfoForm.controls.state.errors).toBeFalsy();
            expect(component.workInfoForm.controls.zip.errors).toBeFalsy();
        });
        it("should set error based on zip length", () => {
            const zip = "222";
            const state = "CO";
            component.checkWorkZipCode(state, zip);
            expect(component.workInfoForm.controls.zip.errors.length).toBeTruthy();
        });
        it("should set error if state but no zip", () => {
            const zip = "";
            const state = "CO";
            component.checkWorkZipCode(state, zip);
            expect(component.workInfoForm.controls.zip.errors.workZipRequired).toBeTruthy();
        });
        it("should set error if zip but no state", () => {
            const zip = "80211";
            const state = "";
            component.checkWorkZipCode(state, zip);
            expect(component.workInfoForm.controls.state.errors.workStateRequired).toBeTruthy();
        });
    });

    describe("saveMemberWorkStateAndZip()", () => {
        beforeEach(() => {
            component.memberId = "1";
            component.workInfoForm = new FormGroup({
                hireDate: new FormControl(""),
                employeeId: new FormControl(""),
                hoursPerWeek: new FormControl(""),
                annualSalary: new FormControl(""),
                department: new FormControl(""),

                worksiteSameAsAccount: new FormControl(true),
                state: new FormControl(""),
                zip: new FormControl(""),
            });
        });
        it("should save member work state and zip", () => {
            component.workInfoForm.controls.zip.setValue("30350");
            component.workInfoForm.controls.state.setValue("GA");
            const workAddress = {
                state: component.workInfoForm.controls.state.value,
                zip: component.workInfoForm.controls.zip.value,
            };
            const memberWorkInfoDetails = {
                address: workAddress,
            } as MemberContact;
            const spy2 = jest.spyOn(memberService, "saveMemberContact");
            component.saveMemberWorkStateAndZip();
            expect(spy2).toBeCalledWith(+component.memberId, "WORK", memberWorkInfoDetails, "12345");
        });
    });

    describe("saveMemberContactObservable()", () => {
        beforeEach(() => {
            component.memberId = "1";
            component.workInfoForm = new FormGroup({
                hireDate: new FormControl(""),
                employeeId: new FormControl(""),
                hoursPerWeek: new FormControl(""),
                annualSalary: new FormControl(""),
                department: new FormControl(""),

                worksiteSameAsAccount: new FormControl(true),
                state: new FormControl(""),
                zip: new FormControl(""),
            });

            component.employeeForm = new FormGroup({
                firstName: new FormControl("firstname"),
                lastName: new FormControl("lastname"),
                birthDate: new FormControl(""),
                genderName: new FormControl(""),
                address1: new FormControl(""),
                address2: new FormControl(""),
                city: new FormControl(""),
                state: new FormControl(""),
                zip: new FormControl(""),
                emailAddress: new FormControl(""),
                phoneNumber: new FormControl(""),
                preferredLanguage: new FormControl(Vocabulary.ENGLISH),
                deliveryPreferance: new FormControl(""),
                sendTo: new FormControl(""),
                phoneType: new FormControl(""),
                cellType: new FormControl(false),
            });
        });
        it("should save work state and zip if user added zip", () => {
            const saveMemberContactObservables: Observable<void>[] = [];
            component.workInfoForm.controls.zip.setValue("30350");
            const spy2 = jest.spyOn(component, "saveMemberWorkStateAndZip");
            component.saveMemberContactObservables();
            expect(spy2).toBeCalled();
            expect(saveMemberContactObservables).toEqual([]);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });

        it("should clean up subscriptions when subscription array is empty", () => {
            component.subscriptions = [];
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
    });

    describe("workInfoData()", () => {
        beforeEach(() => {
            component.validationRegex = {
                HOURSPERWEEK: "some sample regex",
            };
        });
        it("should have workInfoForm defined", () => {
            component.workInfoData();
            expect(component.workInfoForm).toBeInstanceOf(FormGroup);
            expect(Object.keys(component.workInfoForm.controls).length).toBe(8);
        });

        it("should enable employerName field if config is true", () => {
            component.isEmployerNameFieldEnabled = true;
            component.isEmployerNameFieldReadOnly = false;
            component.workInfoData();
            expect(component.workInfoForm.controls.employerName).toBeDefined();
            expect(Object.keys(component.workInfoForm.controls).length).toBe(9);
        });

        it("should disable employerName field if config is false", () => {
            component.isEmployerNameFieldEnabled = false;
            component.isEmployerNameFieldReadOnly = true;
            component.workInfoData();
            expect(component.workInfoForm.controls.employerName).toBeUndefined();
        });
    });

    describe("getWorkInfoFormErrorMessage()", () => {
        it("should return selection required language value if formControl has required error", () => {
            component.validationRegex = {};
            component.workInfoData();
            expect(component.getWorkInfoFormErrorMessage("hireDate")).toStrictEqual("primary.portal.common.selectionRequired");
        });
    });

    describe("cellType()", () => {
        it("should change phone flag based on event", () => {
            component.cellType({ checked: true });
            expect(component.isMobile).toBe(true);
        });
    });

    describe("getNameErrorMessages()", () => {
        beforeEach(() => {
            component.employeeForm = new FormGroup({
                firstName: new FormControl(""),
                lastName: new FormControl("lastname"),
                birthDate: new FormControl(""),
                genderName: new FormControl(""),
                address1: new FormControl(""),
                address2: new FormControl(""),
                city: new FormControl(""),
                state: new FormControl(""),
                zip: new FormControl(""),
                emailAddress: new FormControl(""),
                phoneNumber: new FormControl(""),
                preferredLanguage: new FormControl(Vocabulary.ENGLISH),
                deliveryPreferance: new FormControl(""),
                sendTo: new FormControl(""),
                phoneType: new FormControl(""),
                cellType: new FormControl(false),
            });
        });
        it("should return undefined when the form name is empty", () => {
            const result = component.getNameErrorMessages("", "firstName", "");
            expect(result).toBeUndefined();
        });
        it("should return undefined when the form is not submitted,untouched and the field is empty", () => {
            component.isEmployeeFormSubmit = false;
            const result = component.getNameErrorMessages("employeeForm", "firstName", "");
            expect(result).toBe("");
        });
        it("should return error message when the form is submitted and the field is empty", () => {
            component.isEmployeeFormSubmit = true;
            const result = component.getNameErrorMessages("employeeForm", "firstName", "");
            expect(result).toBe("primary.portal.common.requiredField");
        });

        it("should return error message when the field is empty and the form is not submitted but touched", () => {
            component.isEmployeeFormSubmit = false;
            component.employeeForm?.controls["firstName"]?.markAsTouched();
            const result = component.getNameErrorMessages("employeeForm", "firstName", "");
            expect(result).toBe("primary.portal.common.requiredField");
        });
    });
});