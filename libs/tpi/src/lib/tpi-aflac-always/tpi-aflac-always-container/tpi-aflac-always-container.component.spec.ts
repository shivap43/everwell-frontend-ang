import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";

import { TpiAflacAlwaysContainerComponent } from "./tpi-aflac-always-container.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MockComponent, mockLanguageService, mockTpiService } from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { of } from "rxjs";
import { Router } from "@angular/router";
import { TpiServices } from "@empowered/common-services";
import { provideMockStore } from "@ngrx/store/testing";
import { HttpClient, HttpHandler } from "@angular/common/http";
import { DatePipe } from "@angular/common";

describe("TpiAflacAlwaysContainerComponent", () => {
    let component: TpiAflacAlwaysContainerComponent;
    let fixture: ComponentFixture<TpiAflacAlwaysContainerComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TpiAflacAlwaysContainerComponent, MockComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: TpiServices, useValue: mockTpiService },
                provideMockStore({}),
                HttpClient,
                HttpHandler,
                DatePipe,
            ],
            imports: [
                NgxsModule.forRoot(),
                RouterTestingModule.withRoutes([
                    { path: "tpi/coverage-summary", component: MockComponent },
                    { path: "tpi/exit", component: MockComponent },
                ]),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TpiAflacAlwaysContainerComponent);
        router = TestBed.inject(Router);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("TpiAflacAlwaysContainerComponent", () => {
        describe("ngOnInit()", () => {
            it("should set isSelfAssisted to false if sso details has producerId", fakeAsync(() => {
                const spy = jest.spyOn(Store.prototype, "select").mockReturnValue(of({ user: { producerId: 123454 } }));
                component.ngOnInit();
                tick(1);
                expect(component.isSelfAssisted).toBe(false);
            }));

            it("should set isSelfAssisted to true if sso details doesn't have producerId", fakeAsync(() => {
                const spy = jest.spyOn(Store.prototype, "select").mockReturnValue(of({ user: {} }));
                component.ngOnInit();
                tick(1);
                expect(component.isSelfAssisted).toBe(true);
            }));
        });

        describe("backToCoverageSummary()", () => {
            it("should navigate to coverage summary page", () => {
                const spy = jest.spyOn(router, "navigate");
                component.backToCoverageSummary();
                expect(spy).toHaveBeenCalledWith(["tpi/coverage-summary"]);
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
});
