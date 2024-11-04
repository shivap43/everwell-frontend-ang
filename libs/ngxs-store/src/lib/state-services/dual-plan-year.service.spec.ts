import { DatePipe } from "@angular/common";
import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { BenefitsOfferingService, MemberService, ShoppingService } from "@empowered/api";
import { Characteristics, DualPlanYearSettings, GetCartItems, GroupedCartItems, PlanYear, StatusType } from "@empowered/constants";
import { provideMockStore } from "@ngrx/store/testing";
import { StaticUtilService } from "./static-util.service";
import { Store } from "@ngxs/store";
import { DualPlanYearService } from "./dual-plan-year.service";
import { mockBenefitsOfferingService, mockMemberService, mockShoppingService, mockStaticUtilService, mockStore } from "@empowered/testing";
import { QleOeShopModel } from "../dual-plan-year/dual-plan-year.model";

describe("DualPlanYearService", () => {
    let service: DualPlanYearService;
    const cartItems = [
        {
            id: 1,
            planOffering: { planYearId: 1, plan: { characteristics: [] } },
        },
        {
            id: 2,
            planOffering: { planYearId: undefined, plan: { characteristics: [] } },
        },
        {
            id: 3,
            planOffering: { planYearId: 1, plan: { characteristics: [Characteristics.COMPANY_PROVIDED] } },
        },
    ] as unknown as GetCartItems[];

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                DualPlanYearService,
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                {
                    provide: ShoppingService,
                    useValue: mockShoppingService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                DatePipe,
                provideMockStore({}),
            ],
            imports: [RouterTestingModule],
        });

        service = TestBed.inject(DualPlanYearService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("filterQleEventData", () => {
        it("should return QLE event data as it is if the array has nothing.", () => {
            service.qleEventData = [];
            const filteredData = service.filterQleEventData();
            expect(filteredData).toHaveLength(0);
        });

        it("should return QLE event data that is in progress or has the code 'By request'.", () => {
            const today = new Date();
            service.qleEventData = [
                {
                    type: { id: 1, code: "", description: "", daysToReport: 3 },
                    status: StatusType.INPROGRESS,
                    createdBy: "",
                    typeId: 0,
                    eventDate: today,
                    enrollmentValidity: { effectiveStarting: today },
                    createDate: today,
                    memberComment: "",
                    adminComment: "",
                    coverageStartDates: [],
                    requestedCoverageEndDate: "",
                },
                {
                    type: { id: 1, code: "By Request", description: "", daysToReport: 4 },
                    status: StatusType.APPROVED,
                    createdBy: "",
                    typeId: 0,
                    eventDate: today,
                    enrollmentValidity: { effectiveStarting: today },
                    createDate: today,
                    memberComment: "",
                    adminComment: "",
                    coverageStartDates: [],
                    requestedCoverageEndDate: "",
                },
                {
                    type: { id: 1, code: "", description: "", daysToReport: 5 },
                    status: StatusType.APPROVED,
                    createdBy: "",
                    typeId: 0,
                    eventDate: today,
                    enrollmentValidity: { effectiveStarting: today },
                    createDate: today,
                    memberComment: "",
                    adminComment: "",
                    coverageStartDates: [],
                    requestedCoverageEndDate: "",
                },
            ];
            const filteredData = service.filterQleEventData();
            expect(filteredData).toHaveLength(1);
        });
    });

    describe("getDualPlanYearCoverageDate", () => {
        it("should return QLE coverage start date if QLE shop is selected.", () => {
            const coverageDate = service.getDualPlanYearCoverageDate({
                selectedShop: DualPlanYearSettings.QLE_SHOP,
                qleCoverageStartDate: "2022-09-26",
                oeCoverageStartDate: "2022-09-25",
            } as unknown as QleOeShopModel);
            expect(coverageDate).toEqual("2022-09-26");
        });

        it("should return OE coverage start date if OE shop is selected.", () => {
            const coverageDate = service.getDualPlanYearCoverageDate({
                selectedShop: DualPlanYearSettings.OE_SHOP,
                qleCoverageStartDate: "2022-09-26",
                oeCoverageStartDate: "2022-09-25",
            } as unknown as QleOeShopModel);
            expect(coverageDate).toEqual("2022-09-25");
        });

        it("should return OE coverage start date if new PY QLE shop is selected.", () => {
            const coverageDate = service.getDualPlanYearCoverageDate({
                selectedShop: DualPlanYearSettings.NEW_PY_QLE_SHOP,
                qleCoverageStartDate: "2022-09-26",
                oeCoverageStartDate: "2022-09-25",
            } as unknown as QleOeShopModel);
            expect(coverageDate).toEqual("2022-09-25");
        });

        it("should return a default value", () => {
            const coverageDate = service.getDualPlanYearCoverageDate({
                selectedShop: DualPlanYearSettings.LIFE_EVENT_ENROLLMENT,
                qleCoverageStartDate: "2022-09-26",
                oeCoverageStartDate: "2022-09-25",
            } as unknown as QleOeShopModel);
            expect(coverageDate).toBeTruthy();
        });
    });

    describe("groupCartItems", () => {
        let result: GroupedCartItems;
        beforeEach(() => {
            result = service.groupCartItems(cartItems);
        });

        it("should correctly group post-tax plans", () => {
            expect(result.postTaxPlans.length).toEqual(1);
            expect(result.postTaxPlans[0].id).toEqual(2);
        });

        it("should correctly group pre-tax plans", () => {
            expect(result.preTaxPlans.length).toEqual(1);
            expect(result.preTaxPlans[0].id).toEqual(1);
        });

        it("should correctly group VAS plans", () => {
            expect(result.vasPlans.length).toEqual(1);
            expect(result.vasPlans[0].id).toEqual(3);
        });
    });

    describe("checkForCartItems", () => {
        let result: string;
        beforeEach(() => {
            service.planYearsData = [{ id: 3 }, { id: 2 }, { id: 1 }] as unknown as PlanYear[];
            result = service.checkForCartItems(cartItems);
        });

        it("should return an empty string if the input is empty", () => {
            expect(service.checkForCartItems([])).toEqual("");
        });
        it("should return a string flag to determine shop page", () => {
            expect(result).toEqual(DualPlanYearSettings.OE_SHOP);
        });
    });
});
