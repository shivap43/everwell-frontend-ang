import { DatePipe, TitleCasePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { AccountService, AflacService, BenefitsOfferingService, EnrollmentService, MemberService, StaticService } from "@empowered/api";
import { EmpoweredModalService, SharedService, TPIRestrictionsForHQAccountsService } from "@empowered/common-services";
import { AppSettings } from "@empowered/constants";
import { DateService } from "@empowered/date";
import { LanguageService } from "@empowered/language";
import { MemberInfoState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import {
    mockAccountService,
    mockAflacService,
    mockBenefitsOfferingService,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockMemberService,
    mockRouter,
    mockSharedService,
    mockStaticService,
    mockStaticUtilService,
    mockUserService,
    mockUtilService,
} from "@empowered/testing";
import {
    AddressVerificationComponent,
    ConfirmSsnService,
    DependentAddressUpdateModalComponent,
    IsRestrictedDirective,
    MaterialModule,
    SsnFormatPipe,
} from "@empowered/ui";
import { UserService } from "@empowered/user";
import { NgxsModule, Store } from "@ngxs/store";
import { NgxMaskPipe } from "ngx-mask";
import { of } from "rxjs";
import { take } from "rxjs/operators";
import { PersonalInfoComponent } from "./personal-info.component";

describe("PersonalInfoComponent", () => {
    let component: PersonalInfoComponent;
    let fixture: ComponentFixture<PersonalInfoComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PersonalInfoComponent, IsRestrictedDirective],
            imports: [NgxsModule.forRoot([MemberInfoState]), HttpClientTestingModule, MaterialModule],
            providers: [
                FormBuilder,
                DatePipe,
                ChangeDetectorRef,
                NgxMaskPipe,
                TitleCasePipe,
                EnrollmentService,
                SsnFormatPipe,
                ConfirmSsnService,
                DateService,
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
                    provide: TPIRestrictionsForHQAccountsService,
                    useValue: {},
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                {
                    provide: AflacService,
                    useValue: mockAflacService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PersonalInfoComponent);
        component = fixture.componentInstance;

        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            MemberAdd: {
                activeMemberId: 1,
            },
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
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

        const expectOnlyAddressModalShown = () => {
            expect(openDialogSpy).toHaveBeenLastCalledWith(AddressVerificationComponent, {
                data: {
                    suggestedAddress: component.suggestedAddress,
                    providedAddress: component.providedAddress,
                    addressResp: component.addressResp,
                    addressMessage: component.addressMessage,
                    option: option,
                },
            });
        };

        const expectBothAddressAndDependentAddressModalShown = () => {
            expect(openDialogSpy).toHaveBeenLastCalledWith(DependentAddressUpdateModalComponent, {
                width: "667px",
                data: {
                    memberId: 1,
                    memberAddress: component.suggestedAddress,
                },
            });
        };

        const initialize = (isVerifyAddress: boolean) => {
            afterClosed.data.isVerifyAddress = isVerifyAddress;
            component.selectedAddress = AppSettings.TEMPORARY_ADDRESS;

            component.suggestedAddress = {
                address1: "123 address",
                address2: "Apt 102",
                city: "dcwcwdcwd",
                state: "GA",
                zip: "31008",
            };

            addressDialog = {
                afterClosed: () => of({ ...afterClosed }),
            };

            dependentAddressDialog = {
                afterClosed: () => of({ ...afterClosed }),
            };

            openDialogSpy = jest
                .spyOn(component["empoweredModalService"], "openDialog")
                .mockReturnValueOnce(addressDialog)
                .mockReturnValueOnce(dependentAddressDialog);
        };

        const setTestState = (state: { enableDependentAddressModal: boolean; dependentList?: unknown[] }) => {
            component["enableDependentAddressModal"] = state.enableDependentAddressModal;
            component["dependentList"] = state.dependentList?.length > 0 ? (state.dependentList as never) : [];
        };

        const act = (assertion: CallableFunction) =>
            component
                .openModal(option)
                .pipe(take(1))
                .subscribe((p) => assertion());

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
});
