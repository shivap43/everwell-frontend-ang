import { ShopPeriodType } from "./dual-plan-year-helper.model";
import { TestBed } from "@angular/core/testing";
import { MemberQualifyingEvent, PlanYear } from "@empowered/constants";
import { NgxsModule, Store } from "@ngxs/store";
import { of } from "rxjs";
import { DualPlanYearHelperService } from "./dual-plan-year-helper.service";

describe("DualPlanYearHelperService", () => {
    let service: DualPlanYearHelperService;
    let store: Store;
    const mockNgxsStore = {
        select: () =>
            of({
                isQleEnrollmentWindow: false,
            }),
    };
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot()],
            providers: [
                {
                    provide: Store,
                    useValue: mockNgxsStore,
                },
            ],
        });
        service = TestBed.inject(DualPlanYearHelperService);
        store = TestBed.inject(Store);
    });
    describe("DualPlanYearHelperService", () => {
        it("should create dual plan year service", () => {
            expect(service).toBeTruthy();
        });
    });
    describe("getStandardShopPeriod()", () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date("1990/05/05"));
        });
        afterAll(() => {
            jest.useRealTimers();
        });
        it("should return shopping period as Open Enrollment ", () => {
            const memberQualifyingEventData = [
                {
                    enrollmentValidity: {
                        effectiveStarting: "1989-11-11",
                        expiresAfter: "1989-12-12",
                    },
                } as MemberQualifyingEvent,
            ];
            const planYearsData = [
                {
                    enrollmentPeriod: {
                        effectiveStarting: "1989-01-01",
                    },
                } as PlanYear,
            ];
            const shopPeriodType = service.getStandardShopPeriod(memberQualifyingEventData, planYearsData);
            expect(shopPeriodType).toBe(ShopPeriodType.OE_SHOP);
        });
        it("should return shopping period as QLE Shop", () => {
            const shopPeriodType = service.getStandardShopPeriod(
                [
                    {
                        enrollmentValidity: {
                            effectiveStarting: "1989-11-11",
                            expiresAfter: "1990-12-12",
                        },
                    } as MemberQualifyingEvent,
                ],
                [],
            );
            expect(shopPeriodType).toBe(ShopPeriodType.QLE_SHOP);
        });
        it("should return shopping period as 'Continuous Shop' in absence of plan years and QLE", () => {
            const shopPeriodType = service.getStandardShopPeriod([], []);
            expect(shopPeriodType).toBe(ShopPeriodType.CONTINUOUS_SHOP);
        });
    });

    describe("getDualPlanYearData()", () => {
        it("should retrieve the data from NGXS store of DualPlanYear", (done) => {
            expect.assertions(2);
            const spy = jest.spyOn(store, "select");
            service.getDualPlanYearData().subscribe((result) => {
                expect(result).toStrictEqual({ isQleEnrollmentWindow: false });
                expect(spy).toBeCalled();
                done();
            });
        });
    });
});
