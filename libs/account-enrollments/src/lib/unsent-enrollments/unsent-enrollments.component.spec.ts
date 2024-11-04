import { DatePipe } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import {
    AccountService,
    AflacService,
    Assignment,
    BenefitsOfferingService,
    BUSINESS_ENROLLMENT_TYPE,
    CommissionSplit,
    EnrollmentService,
    NotificationService,
    StaticService,
    TRANSMITTAL_SCHEDULE,
} from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";
import {
    MockConfigEnableDirective,
    MockReplaceTagPipe,
    mockDatePipe,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockUserService,
    mockUtilService,
} from "@empowered/testing";
import { UserService } from "@empowered/user";
import { NgxsModule, Store } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { UnsentEnrollmentsComponent } from "./unsent-enrollments.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { of } from "rxjs";
import { Accounts, Configurations, PlanYear, SITCode, SitusState, WritingNumber, WritingNumberSitCode } from "@empowered/constants";
import { AccountInfoState, AddEnrollments, BusinessState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { SelectionModel } from "@angular/cdk/collections";
import { MatTableDataSource } from "@angular/material/table";
import { MaterialModule } from "@empowered/ui";

describe("UnsentEnrollmentsComponent", () => {
    let component: UnsentEnrollmentsComponent;
    let fixture: ComponentFixture<UnsentEnrollmentsComponent>;
    let staticUtilService: StaticUtilService;
    let store: Store;
    let stateForNgxsStore: Store;
    let accountService: AccountService;
    let benefitsOfferingService: BenefitsOfferingService;
    let aflacService: AflacService;
    let staticService: StaticService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UnsentEnrollmentsComponent, MockReplaceTagPipe, MockConfigEnableDirective],
            imports: [RouterTestingModule, HttpClientTestingModule, NgxsModule.forRoot([BusinessState, AccountInfoState]), MaterialModule],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                SharedService,

                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                AflacService,
                EnrollmentService,
                BenefitsOfferingService,
                NotificationService,
                FormBuilder,
                StaticUtilService,
                AccountService,
                StaticService,
                Store,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(UnsentEnrollmentsComponent);
        component = fixture.componentInstance;
        staticUtilService = TestBed.inject(StaticUtilService);
        store = TestBed.inject(Store);
        stateForNgxsStore = {
            ...store.snapshot(),
            accountEnrollments: {
                mpGroupId: "222",
                activeMemberId: 1,
            },
            accountInfo: {
                name: "accountName",
            },
        };
        store.reset(stateForNgxsStore);
        accountService = TestBed.inject(AccountService);
        benefitsOfferingService = TestBed.inject(BenefitsOfferingService);
        aflacService = TestBed.inject(AflacService);
        staticService = TestBed.inject(StaticService);
        component.situs = {
            state: {
                abbreviation: "GA",
            },
        } as SitusState;
        component.commissionSplitList = [
            {
                id: 1,
                name: "commission split 1",
                assignments: [
                    {
                        sitCodeId: 1,
                        percent: 100,
                    },
                ] as Assignment[],
                rules: [
                    {
                        type: "CARRIER",
                        carrierId: 1,
                    },
                ],
            },
            {
                id: 2,
                name: "commission split 2",
                assignments: [
                    {
                        sitCodeId: 2,
                        percent: 100,
                    },
                ] as Assignment[],
                rules: [
                    {
                        type: "CARRIER",
                        carrierId: 4,
                    },
                ],
            },
        ] as CommissionSplit[];
        component.sitCodes = [
            {
                id: 1,
                companyCode: "US",
            },
        ] as SITCode[];
        component.data = [
            {
                enrollmentId: 1,
                producerId: 111,
            },
        ];
        component.languageStrings = {
            "primary.portal.accountEnrollments.now": "Now",
            "primary.portal.accountEnrollments.endOfOE": "End",
        };
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("checkCallCentrePermission()", () => {
        it("should set isEfinancialAgent", () => {
            jest.spyOn(staticUtilService, "hasPermission").mockReturnValue(of(false));
            component.checkCallCentrePermission();
            expect(component.isEfinancialAgent).toBe(false);
            jest.spyOn(staticUtilService, "hasPermission").mockReturnValue(of(true));
            component.checkCallCentrePermission();
            expect(component.isEfinancialAgent).toBe(true);
        });
    });
    describe("checkTranzactRole()", () => {
        it("should set isTranzactUser", () => {
            jest.spyOn(staticUtilService, "hasPermission").mockReturnValue(of(false));
            component.checkTranzactRole();
            expect(component.isTranzactUser).toBe(false);
            jest.spyOn(staticUtilService, "hasPermission").mockReturnValue(of(true));
            component.checkTranzactRole();
            expect(component.isTranzactUser).toBe(true);
        });
    });
    describe("initializeForm()", () => {
        it("should set unsentEnrollmentForm", () => {
            component.initializeForm();
            expect(component.unsentEnrollmentForm).toBeDefined();
        });
    });
    describe("initialize()", () => {
        it("should set mpGroupId and make api calls", () => {
            const spy1 = jest.spyOn(accountService, "getAccount").mockReturnValue(
                of({
                    situs: { state: { abbreviation: "GA", name: "Georgea" } } as SitusState,
                    partnerAccountType: "PAYROLL",
                } as Accounts),
            );
            const spy2 = jest.spyOn(benefitsOfferingService, "getPlanYears").mockReturnValue(of([] as PlanYear[]));
            const spy3 = jest.spyOn(aflacService, "getSitCodes").mockReturnValue(of([] as WritingNumber[]));
            const spy4 = jest.spyOn(staticService, "getConfigurations").mockReturnValue(of([] as Configurations[]));
            component.selfEnrollmentFlag = true;
            component.initialize();
            expect(component.mpGroupId).toStrictEqual("222");
            expect(spy1).toBeCalledWith("222");
            expect(spy2).toBeCalledWith(222, false, true);
            expect(spy3).toBeCalledTimes(3);
            expect(spy4).toBeCalledWith("aflac.account.read.business.display.messages.maximum", 222);
            expect(component.unsentEnrollmentForm).toBeDefined();
            component.selfEnrollmentFlag = false;
            component.initialize();
            expect(component.mpGroupId).toStrictEqual("222");
        });
    });
    describe("onInitialLoad()", () => {
        it("should call getBusinessEnrollments,getSitCodes and getCommissionSplits", () => {
            const spy1 = jest.spyOn(aflacService, "getSitCodes").mockReturnValue(of([] as WritingNumber[]));
            const spy2 = jest.spyOn(aflacService, "getCommissionSplits").mockReturnValue(of([] as CommissionSplit[]));
            component.onInitialLoad();
            expect(spy1).toBeCalledWith("US");
            expect(spy2).toBeCalledWith("222");
        });
    });
    describe("getStateManagement()", () => {
        it("should call cacheConfigEnabled,cacheConfigValue and set data", () => {
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
            const spy2 = jest.spyOn(staticUtilService, "cacheConfigValue").mockReturnValue(of("GA,PR"));
            component.getStateManagement();
            expect(component.mpGroupId).toStrictEqual("222");
            expect(component.memberId).toBe(1);
            expect(spy1).toBeCalledTimes(3);
            expect(spy2).toBeCalledWith("general.enrollment.states_requiring_eea_completion");
            expect(component.isCrossBorderRuleEnabledForMd).toBe(true);
            expect(component.isCrossBorderRuleEnabledForMo).toBe(true);
            expect(component.sendRejectModalStates).toStrictEqual(["GA", "PR"]);
        });
    });
    describe("findSelectOption()", () => {
        beforeEach(() => {
            component.sendDateArr = [
                [
                    {
                        enrollmentId: 10,
                        type_literal: TRANSMITTAL_SCHEDULE.END_OF_DAY,
                        type: null,
                        dateVal: null,
                        value: null,
                    },
                    {
                        enrollmentId: 11,
                        type_literal: TRANSMITTAL_SCHEDULE.IMMEDIATELY,
                        type: null,
                        dateVal: null,
                        value: null,
                    },
                ],
            ];
        });
        it("should return sendDateOption related to END_OF_DAY type_literal for selfEnrollmentFlag", () => {
            component.selfEnrollmentFlag = true;
            component.rowSelection = false;
            const sendDateOption = component.findSelectOption(10, TRANSMITTAL_SCHEDULE.IMMEDIATELY);
            expect(sendDateOption.enrollmentId).toStrictEqual(10);
        });
        it("should return sendDateOption related to type_literal passed when selfEnrollmentFlag is false", () => {
            component.selfEnrollmentFlag = false;
            const sendDateOption = component.findSelectOption(10, TRANSMITTAL_SCHEDULE.IMMEDIATELY);
            expect(sendDateOption.type_literal).toStrictEqual("IMMEDIATELY");
        });
    });
    describe("getAllWritingNumbers()", () => {
        it("should set allWritingNumbers", () => {
            const writingNumbers: WritingNumber[] = [
                {
                    // eslint-disable-next-line id-denylist
                    number: "AA5",
                    sitCodes: [
                        {
                            id: 1,
                            companyCode: "US",
                        },
                    ],
                },
            ] as WritingNumber[];
            const spy1 = jest.spyOn(aflacService, "getSitCodes").mockReturnValue(of(writingNumbers));
            const spy2 = jest.spyOn(staticService, "getConfigurations").mockReturnValue(
                of([
                    {
                        name: "aflac.account.read.business.display.messages.maximum",
                        value: "10",
                    },
                ] as Configurations[]),
            );
            component.getAllWritingNumbers();
            expect(spy1).toBeCalledTimes(2);
            expect(spy2).toBeCalledWith("aflac.account.read.business.display.messages.maximum", 222);
            expect(component.allWritingNumbers).toStrictEqual([...writingNumbers, ...writingNumbers]);
            expect(component.businessDisplayMessagesMaximum).toBe(10);
        });
    });
    describe("getCommissionSplitsWithEnrollmentState()", () => {
        it("should return commission split with enrolment state", () => {
            const commissionSplit = component.getCommissionSplitsWithEnrollmentState(component.commissionSplitList, [
                {
                    ...component.sitCodes[0],
                },
            ]);
            expect(commissionSplit).toStrictEqual([
                {
                    ...component.commissionSplitList[0],
                    enrollmentState: "US",
                },
                {
                    ...component.commissionSplitList[1],
                },
            ]);
        });
    });
    describe("getAllSITCodesFromWritingNumbers()", () => {
        it("should return sitCodes from writingNumbers", () => {
            const sitCodes1 = [
                {
                    id: 1,
                    companyCode: "US",
                },
            ];
            const sitCodes2 = [
                {
                    id: 3,
                    companyCode: "US",
                },
            ];
            const writingNumbers: WritingNumber[] = [
                {
                    // eslint-disable-next-line id-denylist
                    number: "AB1",
                    sitCodes: sitCodes1,
                },
                {
                    // eslint-disable-next-line id-denylist
                    number: "AB2",
                    sitCodes: sitCodes2,
                },
            ] as WritingNumber[];
            const sitCodes = component.getAllSITCodesFromWritingNumbers(writingNumbers);
            expect(sitCodes).toStrictEqual([...sitCodes1, ...sitCodes2]);
        });
    });
    describe("isSitCodeExpired()", () => {
        it("should return boolean if sitCode expired or not", () => {
            component.expiredSitCodes = [
                {
                    writingNumber: "AB1",
                    sitCodeId: 1,
                },
                {
                    writingNumber: "AB2",
                    sitCodeId: 2,
                },
            ] as WritingNumberSitCode[];
            const result1 = component.isSitCodeExpired(1);
            expect(result1).toBe(true);
            const result2 = component.isSitCodeExpired(2);
            expect(result2).toBe(true);
            const result3 = component.isSitCodeExpired(3);
            expect(result3).toBe(false);
        });
    });
    describe("setValueInStore()", () => {
        it("should dispatch an action", () => {
            const spy1 = jest.spyOn(store, "dispatch");
            component.setValueInStore();
            expect(spy1).toBeCalledWith(
                new AddEnrollments(
                    {
                        unsentEnrollments: component.data,
                        commissionList: component.commissionSplitList,
                        mpGroupId: "222",
                        sitCodes: component.sitCodes,
                    },
                    BUSINESS_ENROLLMENT_TYPE.UNSENT,
                ),
            );
        });
    });
    describe("checkForSelectedRows()", () => {
        it("should return boolean if there are selected rows", () => {
            component.selection = new SelectionModel(true, [{ enrollmentId: 1 }]);
            const hasSelectedRows1 = component.checkForSelectedRows();
            expect(hasSelectedRows1).toBe(true);
            component.selection = new SelectionModel(true, []);
            const hasSelectedRows2 = component.checkForSelectedRows();
            expect(hasSelectedRows2).toBe(false);
        });
    });
    describe("comparingEnrollments()", () => {
        it("should return if specified enrollment is changed", () => {
            const initialEnrollment = {
                commissionSplitId: [1],
                sentDate: "2022-12-06",
                enrollmentComment: "comment",
                transmittalSchedule: "IMMEDIATELY",
            };
            const currentEnrollment = {
                commissionSplitId: [1],
                sentDate: "2022-12-06",
                enrollmentComment: "comment",
                transmittalSchedule: "IMMEDIATELY",
            };
            const isEnrollmentChanged1 = component.comparingEnrollments(initialEnrollment, currentEnrollment);
            expect(isEnrollmentChanged1).toBe(false);
            initialEnrollment.commissionSplitId = [];
            const isEnrollmentChanged2 = component.comparingEnrollments(initialEnrollment, currentEnrollment);
            expect(isEnrollmentChanged2).toBe(true);
            initialEnrollment.commissionSplitId = [1];
            currentEnrollment.transmittalSchedule = "END_OF_DAY";
            const isEnrollmentChanged3 = component.comparingEnrollments(initialEnrollment, currentEnrollment);
            expect(isEnrollmentChanged3).toBe(true);
        });
    });
    describe("detectActualChanges()", () => {
        it("should set boolean to hasBeenChanged variable", () => {
            component.initialData = [
                {
                    enrollmentId: 1,
                    commissionSplitId: [1],
                    sentDate: "2022-12-06",
                    enrollmentComment: "comment",
                    transmittalSchedule: "IMMEDIATELY",
                },
            ];
            component.dataSource = {
                data: [
                    {
                        enrollmentId: 1,
                        commissionSplitId: [1],
                        sentDate: "2022-12-06",
                        enrollmentComment: "comment",
                        transmittalSchedule: "END_OF_DAY",
                    },
                ],
            } as MatTableDataSource<any>;
            component.detectActualChanges(1);
            expect(component.hasBeenChanged).toBe(true);
            component.dataSource.data[0].transmittalSchedule = TRANSMITTAL_SCHEDULE.IMMEDIATELY;
            component.detectActualChanges(1);
            expect(component.hasBeenChanged).toBe(false);
        });
    });
    describe("isAllSelected()", () => {
        it("should return boolean true if all rows selected and set isEnrolled", () => {
            component.selection = new SelectionModel(true, [{ enrollmentId: 1 }]);
            component.dataSource = {
                data: [],
            } as MatTableDataSource<any>;
            const isAllSelected1 = component.isAllSelected();
            expect(component.isEnrolled).toBe(true);
            expect(isAllSelected1).toBe(false);
            component.dataSource.data = [
                {
                    isHeader: false,
                    applicationStatus: "COMPLETE",
                },
                {
                    isHeader: false,
                    applicationStatus: "INCOMPLETE_PENDING_SUBSCRIBER_APPROVAL",
                },
            ];
            const isAllSelected2 = component.isAllSelected();
            expect(isAllSelected2).toBe(false);
        });
    });

    describe("setSendDateBySchedule()", () => {
        it("should return the language key for immediately send response", () => {
            expect(component.setSendDateBySchedule(TRANSMITTAL_SCHEDULE.IMMEDIATELY, null)).toBe("Now");
        });

        it("should return the language key for end of OE send response", () => {
            expect(component.setSendDateBySchedule(TRANSMITTAL_SCHEDULE.END_OF_OE, null)).toBe("End");
        });

        it("should return the language key for end of day and prior to start date send response", () => {
            expect(component.setSendDateBySchedule(TRANSMITTAL_SCHEDULE.END_OF_DAY_PRIOR_TO_START, "09/09/1989")).toBe("09/08/1989");
        });

        it("should return the language key for default/null send response", () => {
            expect(component.setSendDateBySchedule(null, "09/09/1989")).toBe(null);
        });
    });

    describe("hideAlertBox()", () => {
        it("should hide the alert box by setting enrollmentSentCount to zero", () => {
            component.hideAlertBox();
            expect(component.enrollmentSentCount).toBe(0);
        });
    });
});
