import { PlanOfferingService } from "./../plan-offering/plan-offering.service";
import { TestBed } from "@angular/core/testing";
import { PlanOfferingHelperService } from "@empowered/ngrx-store/services/plan-offering-helper/plan-offering-helper.service";
import { PanelIdentifiers } from "../producer-shop-component-store/producer-shop-component-store.model";

import { PlanPanelService } from "./plan-panel.service";
import {
    PlanOfferingWithCartAndEnrollment,
    Characteristics,
    Enrollments,
    PlanYear,
    MemberQualifyingEvent,
    Validity,
} from "@empowered/constants";
import { HttpClient } from "@angular/common/http";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Store } from "@ngxs/store";
import { Router } from "@angular/router";
import { mockStore, mockRouter } from "@empowered/testing";
import { DualPlanYearService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

const MOCK_PLAN_PANEL = {
    planOffering: { id: 1 },
    enrollment: { id: 2 },
    cartItemInfo: { id: 3 },
} as PlanOfferingWithCartAndEnrollment;

const MOCK_PANEL_IDENTIFIERS: PanelIdentifiers = {
    planOfferingId: 1,
    enrollmentId: 2,
    cartId: 3,
};

const mockDualPlanYear = {
    planYearsData: [
        {
            type: "AFLAC_INDIVIDUAL",
            locked: true,
            id: 1,
            name: "py1",
            coveragePeriod: {
                effectiveStarting: "2023-10-01",
                expiresAfter: "2024-09-30",
            },
            enrollmentPeriod: {
                effectiveStarting: "2023-09-15",
                expiresAfter: "2023-09-15",
            },
            activeEnrollments: false,
        } as PlanYear,
    ],
    qleEventData: [
        {
            createdBy: "PRODUCER",
            id: 1,
            type: {
                code: "NEW_HIRE",
                daysToReport: 90,
                description: "New Hire",
                id: 58,
            },
            eventDate: "2023-08-01",
            enrollmentValidity: {
                effectiveStarting: "2023-09-18",
                expiresAfter: "2023-12-16",
            },
            createDate: "2023-09-18",
            adminComment: "",
            status: "IN_PROGRESS",
        } as MemberQualifyingEvent,
    ],
};

describe("PlanPanelService", () => {
    let service: PlanPanelService;
    let planOfferingHelperService: PlanOfferingHelperService;
    let planOfferingService: PlanOfferingService;
    let dateService: DateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                PlanOfferingHelperService,
                PlanOfferingService,
                HttpClient,
                PlanPanelService,
                DualPlanYearService,
                DateService,
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: DualPlanYearService,
                    useValue: mockDualPlanYear,
                },
            ],
        });

        service = TestBed.inject(PlanPanelService);
        planOfferingHelperService = TestBed.inject(PlanOfferingHelperService);
        planOfferingService = TestBed.inject(PlanOfferingService);
        dateService = TestBed.inject(DateService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("getPlanOffering()", () => {
        it("should get PlanOffering", () => {
            expect(service.getPlanOffering(MOCK_PLAN_PANEL)).toStrictEqual({ id: 1 });
        });
    });

    describe("getPanelIdentifiers()", () => {
        it("should get PlanOffering, Enrollment, CartItem id", () => {
            expect(service.getPanelIdentifiers(MOCK_PLAN_PANEL)).toStrictEqual(MOCK_PANEL_IDENTIFIERS);
        });
    });

    describe("isSamePlanPanel()", () => {
        it("should return true if all ids match", () => {
            expect(service.isSamePlanPanel({ ...MOCK_PANEL_IDENTIFIERS }, { ...MOCK_PANEL_IDENTIFIERS })).toBe(true);
        });

        it("should return false if Enrollment ids don't match", () => {
            expect(service.isSamePlanPanel({ ...MOCK_PANEL_IDENTIFIERS, enrollmentId: -1 }, { ...MOCK_PANEL_IDENTIFIERS })).toBe(false);
            expect(service.isSamePlanPanel({ ...MOCK_PANEL_IDENTIFIERS, enrollmentId: null }, { ...MOCK_PANEL_IDENTIFIERS })).toBe(false);
        });

        it("should return false if CartItem ids don't match", () => {
            expect(service.isSamePlanPanel({ ...MOCK_PANEL_IDENTIFIERS, cartId: -1 }, { ...MOCK_PANEL_IDENTIFIERS })).toBe(false);
            expect(service.isSamePlanPanel({ ...MOCK_PANEL_IDENTIFIERS, cartId: undefined }, { ...MOCK_PANEL_IDENTIFIERS })).toBe(false);
        });

        it("should return false if PlanOffering ids don't match", () => {
            expect(service.isSamePlanPanel({ ...MOCK_PANEL_IDENTIFIERS, planOfferingId: -1 }, { ...MOCK_PANEL_IDENTIFIERS })).toBe(false);
            expect(service.isSamePlanPanel({ ...MOCK_PANEL_IDENTIFIERS, planOfferingId: null }, { ...MOCK_PANEL_IDENTIFIERS })).toBe(false);
        });
    });

    describe("isEnrollmentEditable()", () => {
        it("should return true if PlanOffering is valid and not auto-enrolled, and there is an Enrollment", () => {
            const spy = jest.spyOn(planOfferingHelperService, "isAutoEnrollable").mockReturnValueOnce(false);

            const planPanel = {
                planOffering: { validity: {} },
                enrollment: {},
            } as PlanOfferingWithCartAndEnrollment;

            expect(service.isEnrollmentEditable(planPanel)).toBe(true);
            expect(spy).toBeCalledWith(planPanel.planOffering);
        });

        it("should return false if there is NO Enrollment", () => {
            const planPanel = {
                planOffering: { validity: {} },
            } as PlanOfferingWithCartAndEnrollment;

            expect(service.isEnrollmentEditable(planPanel)).toBe(false);
        });

        it("should return false if PlanOffering is NOT valid", () => {
            const planPanel = {
                planOffering: {},
                enrollment: {},
            } as PlanOfferingWithCartAndEnrollment;

            expect(service.isEnrollmentEditable(planPanel)).toBe(false);
        });

        it("should return false if PlanOffering is auto-enrolled", () => {
            jest.spyOn(planOfferingHelperService, "isAutoEnrollable").mockReturnValueOnce(true);
            jest.spyOn(service, "isEnrollmentOpen").mockReturnValueOnce(false);
            const planPanel = {
                planOffering: {},
                enrollment: {},
            } as PlanOfferingWithCartAndEnrollment;

            expect(service.isEnrollmentEditable(planPanel)).toBe(false);
        });

        it("should return true if PlanOffering is valid with ADV selected, and there is an Enrollment", () => {
            const spy = jest.spyOn(planOfferingHelperService, "isAutoEnrollable").mockReturnValueOnce(true);
            jest.spyOn(service, "isEnrollmentOpen").mockReturnValueOnce(true);

            const planPanel = {
                planOffering: {
                    plan: {
                        carrierId: 70,
                    },
                    validity: {},
                },
                enrollment: {},
            } as PlanOfferingWithCartAndEnrollment;

            expect(service.isEnrollmentEditable(planPanel)).toBe(true);
            expect(spy).toBeCalledWith(planPanel.planOffering);
        });
    });

    describe("planOfferingHasStackablePlan()", () => {
        it("should return false if Plan has no characteristics", () => {
            expect(service.planOfferingHasStackablePlan({ planOffering: { plan: {} } } as PlanOfferingWithCartAndEnrollment)).toBe(false);
        });

        it("should return false if characteristics excludes Characteristics.STACKABLE", () => {
            expect(
                service.planOfferingHasStackablePlan({
                    planOffering: {
                        plan: { characteristics: [Characteristics.AUTOENROLLABLE, Characteristics.COMPANY_PROVIDED] },
                    },
                } as PlanOfferingWithCartAndEnrollment),
            ).toBe(false);
        });

        it("should return true if characteristics includes Characteristics.STACKABLE", () => {
            expect(
                service.planOfferingHasStackablePlan({
                    planOffering: {
                        plan: {
                            characteristics: [Characteristics.AUTOENROLLABLE, Characteristics.STACKABLE, Characteristics.COMPANY_PROVIDED],
                        },
                    },
                } as PlanOfferingWithCartAndEnrollment),
            ).toBe(true);
        });
    });

    describe("getEnrollmentPlan()", () => {
        it("should get enrolled plan for the member", () => {
            const spy = jest.spyOn(planOfferingService, "getPlanId").mockReturnValueOnce(2);
            expect(service.getEnrollmentPlan({ ...MOCK_PLAN_PANEL, enrollment: { plan: { id: 2 } } as Enrollments })).toStrictEqual({
                plan: { id: 2 },
            });
            expect(spy).toBeCalledWith(MOCK_PLAN_PANEL.planOffering);
        });

        it("should not get any enrolled plan for a group having no enrollment", () => {
            jest.spyOn(planOfferingService, "getPlanId").mockReturnValueOnce(1);
            jest.spyOn(service, "isEnrollmentEditable").mockReturnValueOnce(false);
            const planPanel = {
                planOffering: {},
            } as PlanOfferingWithCartAndEnrollment;

            expect(service.getEnrollmentPlan(planPanel)).toStrictEqual(null);
        });

        it("should not get any enrolled plan for a group having auto enrolled plan", () => {
            jest.spyOn(planOfferingService, "getPlanId").mockReturnValueOnce(1);
            jest.spyOn(planOfferingHelperService, "isAutoEnrollable").mockReturnValueOnce(true);
            // jest.spyOn(service, "isEnrollmentEditable").mockReturnValueOnce(false);
            jest.spyOn(service, "isEnrollmentOpen").mockReturnValueOnce(false);
            const planPanel = {
                planOffering: {
                    plan: { id: 1, characteristics: [Characteristics.AUTOENROLLABLE] },
                },
            } as PlanOfferingWithCartAndEnrollment;
            expect(service.getEnrollmentPlan(planPanel)).toStrictEqual(null);
        });
    });

    describe("isEnrollmentOpen()", () => {
        it("should return true if within valid date range", () => {
            jest.spyOn(dateService, "isBetween").mockReturnValueOnce(true);
            const enrollmentPeriod = {
                effectiveStarting: "2023-10-03",
                expiresAfter: "2023-10-30",
            } as Validity;
            expect(service.isEnrollmentOpen(enrollmentPeriod)).toBe(true);
        });
    });
});
