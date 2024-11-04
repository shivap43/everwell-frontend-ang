import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import {
    mockActivatedRoute,
    mockAuthenticationService,
    mockDatePipe,
    mockLanguageService,
    mockRouter,
    mockStore,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";

import { ApplicationFlowComponent } from "./application-flow.component";
@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}
describe("ApplicationFlowComponent", () => {
    let component: ApplicationFlowComponent;
    let fixture: ComponentFixture<ApplicationFlowComponent>;
    let router: Router;
    let store: Store;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ApplicationFlowComponent, MockHasPermissionDirective],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([])],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                { provide: Store, useValue: mockStore },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ApplicationFlowComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        store = TestBed.inject(Store);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("backToReview()", () => {
        it("should navigate back to review page", () => {
            const spy = jest.spyOn(router, "navigate");
            component.backToReview();
            expect(spy).toBeCalledWith(["tpi/shop"], { queryParams: { review: true } });
        });
    });

    describe("dualPlanYearScenario()", () => {
        it("should update qleYear value if selectedShop value is 'Qle Shop' ", () => {
            jest.spyOn(store, "selectSnapshot").mockReturnValue({
                isDualPlanYear: true,
                isQleDuringOeEnrollment: false,
                isQleAfterOeEnrollment: false,
                qleYear: "PY-1",
                selectedShop: "Qle Shop",
            });
            component.isQleShop = false;
            component.isOeShop = true;
            component.isQleDuringOeEnrollment = true;
            component.isQleAfterOeEnrollment = true;
            component.dualPlanYearScenario();
            expect(component.qleYear).toStrictEqual("PY-1");
            expect(component.isQleShop).toBe(true);
        });

        it("should update oeYear value if selectedShop value is 'New PY Qle Shop' ", () => {
            jest.spyOn(store, "selectSnapshot").mockReturnValue({
                isDualPlanYear: true,
                isQleDuringOeEnrollment: false,
                isQleAfterOeEnrollment: false,
                oeYear: "PY-2",
                selectedShop: "New PY Qle Shop",
            });
            component.isQleShop = true;
            component.isOeShop = false;
            component.isQleDuringOeEnrollment = true;
            component.isQleAfterOeEnrollment = true;
            component.dualPlanYearScenario();
            expect(component.oeYear).toStrictEqual("PY-2");
            expect(component.isQleShop).toBe(false);
        });

        it("should update the samePlanYear value as true if oeYear and qleYear value are same", () => {
            jest.spyOn(store, "selectSnapshot").mockReturnValue({
                isDualPlanYear: true,
                isQleDuringOeEnrollment: false,
                isQleAfterOeEnrollment: true,
                oeYear: "PY-1",
                qleYear: "PY-1",
            });
            component.isQleDuringOeEnrollment = true;
            component.isQleAfterOeEnrollment = true;
            component.dualPlanYearScenario();
            expect(component.samePlanYear).toBe(true);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
