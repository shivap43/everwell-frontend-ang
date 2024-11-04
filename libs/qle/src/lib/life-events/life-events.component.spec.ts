import {
    mockDatePipe,
    mockLanguageService,
    mockMatDialog,
    mockRouter,
    MockCurrencyPipe,
    mockAuthenticationService,
    MockReplaceTagPipe,
} from "@empowered/testing";
import { Subscription } from "rxjs";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AuthenticationService } from "@empowered/api";
import { MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { LifeEventsComponent } from "./life-events.component";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { MemberQualifyingEvent } from "@empowered/constants";
import { DualPlanYearService, SetIdToCloseSEP } from "@empowered/ngxs-store";
import { MatHeaderRowDef, MatRowDef } from "@angular/material/table";
import { MatMenuModule } from "@angular/material/menu";

const mockSubscription = [
    {
        unsubscribe: () => {},
    },
] as Subscription[];
describe("LifeEventsComponent", () => {
    let component: LifeEventsComponent;
    let fixture: ComponentFixture<LifeEventsComponent>;
    let dualPlanYearService: DualPlanYearService;
    let store: Store;
    let router: Router;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, MatMenuModule],
            declarations: [LifeEventsComponent, MockReplaceTagPipe, MatHeaderRowDef, MatRowDef],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                { provide: DatePipe, useValue: mockDatePipe },
                {
                    provide: CurrencyPipe,
                    useValue: MockCurrencyPipe,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockRouter,
                },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(LifeEventsComponent);
        dualPlanYearService = TestBed.inject(DualPlanYearService);
        store = TestBed.inject(Store);
        router = TestBed.inject(Router);
        component = fixture.componentInstance;
        component.mpGroupId = 75123;
        component.isAdmin = true;
        component.dataSource = [
            {
                isStatusViewPendingCoverage: false,
                isPending: false,
                type: "By Request",
                endPlanRequestStatus: "COVERAGE_CANCELLATION_REQUEST_SUBMITTED",
                id: 2,
                eventDate: "2023/01/01",
                documents: [],
                adminComment: "Approved",
            },
        ];
        component.changedQLE = {
            eventDate: "2023/02/01",
            adminComment: "",
        } as MemberQualifyingEvent;
        component.MemberInfo = {
            id: 1,
        };
    });

    describe("LifeEventsComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("displayStatusValue()", () => {
        it("should return the language key 'primary.portal.qle.inProgressText' when status is 'IN_PROGRESS'", () => {
            expect(component.displayStatusValue("IN_PROGRESS")).toEqual("primary.portal.qle.inProgressText");
        });
        it("should return the language key 'primary.portal.qle.approvedText' when status is 'APPROVED'", () => {
            expect(component.displayStatusValue("APPROVED")).toEqual("primary.portal.qle.approvedText");
        });
        it("should return the language key 'primary.portal.qle.pendingText' when status is 'PENDING'", () => {
            expect(component.displayStatusValue("PENDING")).toEqual("primary.portal.qle.pendingText");
        });
        it("should return the language key 'primary.portal.qle.pendingHrApproval' when status is 'PENDING_HR_APPROVAL'", () => {
            expect(component.displayStatusValue("PENDING_HR_APPROVAL")).toEqual("primary.portal.qle.pendingHrApproval");
        });
        it("should return the language key 'primary.portal.qle.deniedText' when status is 'DENIED'", () => {
            expect(component.displayStatusValue("DENIED")).toEqual("primary.portal.qle.deniedText");
        });
        it("should return the language key 'primary.portal.qle.pendingAflacApproval' when status is 'PENDING_AFLAC_APPROVAL'", () => {
            expect(component.displayStatusValue("PENDING_AFLAC_APPROVAL")).toEqual("primary.portal.qle.pendingAflacApproval");
        });
    });
    describe("viewByRequest()", () => {
        it("should mark isStatusViewPendingCoverage to be true when end plan request status is pending for HR approval", () => {
            component.viewByRequest({ endPlanRequestStatus: "PENDING_HR_APPROVAL" } as MemberQualifyingEvent, 0);
            expect(component.dataSource[0].isStatusViewPendingCoverage).toBeTruthy();
        });
        it("should mark the request as pending when end plan request is submitted for cancellation", () => {
            component.viewByRequest({ endPlanRequestStatus: "COVERAGE_CANCELLATION_REQUEST_SUBMITTED" } as MemberQualifyingEvent, 0);
            expect(component.dataSource[0].isPending).toBeTruthy();
        });
    });
    describe("viewPendingEnrollments()", () => {
        it("should mark the flag isStatusViewPendingEnrollments to be true for selected index", () => {
            component.viewPendingEnrollments(0);
            expect(component.dataSource[0].isStatusViewPendingEnrollments).toBeTruthy();
        });
    });
    describe("changeStatus()", () => {
        it("should populate the admin comment from data source", () => {
            component.changeStatus(2);
            expect(component.changedQLE.adminComment).toStrictEqual("Approved");
        });
        it("should not populate the event date from data source if id doesn't matches from QLE list", () => {
            component.changeStatus(1);
            expect(component.changedQLE.eventDate).toStrictEqual("2023/02/01");
        });
    });

    describe("viewDetails()", () => {
        it("should mark the flag isStatusViewPendingEnrollments to be false for selected index if type is not By Request", () => {
            component.dataSource = [
                {
                    isStatusViewPendingCoverage: false,
                    isPending: false,
                    type: "New Hire",
                    endPlanRequestStatus: "COVERAGE_CANCELLATION_REQUEST_SUBMITTED",
                    id: 2,
                    eventDate: "2023/01/01",
                    documents: [],
                    adminComment: "Approved",
                },
            ];
            component.viewDetails(0);
            expect(component.dataSource[0].isStatusViewPendingEnrollments).toBeFalsy();
        });
        it("should mark the flag isStatusViewPendingEnrollments to be false for selected index if type is not By Request", () => {
            component.dataSource = [
                {
                    isStatusViewPendingCoverage: false,
                    isPending: false,
                    type: "By Request",
                    endPlanRequestStatus: "COVERAGE_CANCELLATION_REQUEST_SUBMITTED",
                    id: 2,
                    eventDate: "2023/01/01",
                    documents: [],
                    adminComment: "Approved",
                },
            ];
            component.viewDetails(0);
            expect(component.dataSource[0].type).toEqual("primary.portal.qle.endCoverageRequest");
        });
    });

    describe("viewDetails()", () => {
        it("should mark the flag isPending to be false for selected index for In progress QLE", () => {
            component.displayInProgress(0);
            expect(component.dataSource[0].isPending).toBeFalsy();
            expect(component.dataSource[0].isStatusInprogress).toBeTruthy();
        });
    });
    describe("openShop()", () => {
        it("should route to QLE or OE shop for generic shop button", () => {
            component.MemberInfo.id = 3;
            component.mpGroupId = 4;
            const spy = jest.spyOn(dualPlanYearService, "genericShopOeQLeNavigate");
            component.openShop(5);
            expect(spy).toBeCalledWith(3, 4);
        });
        it("should dispatch SetIdToCloseSEP action", () => {
            const spy = jest.spyOn(store, "dispatch");
            component.openShop(5);
            expect(spy).toBeCalledWith(new SetIdToCloseSEP(5));
        });

        it("should navigate to shop page", () => {
            const spy = jest.spyOn(router, "navigate");
            component.openShop(5);
            expect(spy).toBeCalledWith(["member/wizard/enrollment/shop"]);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
