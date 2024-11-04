import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NavigationExtras, Router } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { AppFlowService } from "@empowered/ngxs-store";
import { mockAppFlowService, mockEmpoweredModalService, mockLanguageService, mockStore } from "@empowered/testing";
import { EmpoweredModalService } from "@empowered/common-services";
import { Store } from "@ngxs/store";
import { TpiApplicationFlowComponent } from "./tpi-application-flow.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatMenuModule } from "@angular/material/menu";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ConfirmationStepLabels } from "@empowered/constants";

const mockRouter = {
    url: "",
    navigate: (commands: any[], extras?: NavigationExtras) => {},
};

describe("TpiApplicationFlowComponent", () => {
    let component: TpiApplicationFlowComponent;
    let fixture: ComponentFixture<TpiApplicationFlowComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TpiApplicationFlowComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: AppFlowService,
                    useValue: mockAppFlowService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
            ],
            imports: [HttpClientTestingModule, MatMenuModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TpiApplicationFlowComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("backToTPP()", () => {
        it("should close the modal", () => {
            const spy = jest.spyOn(router, "navigate");
            const EXIT = "tpi/exit";
            component.backToTPP();
            expect(spy).toBeCalledWith([EXIT]);
        });
    });

    describe("backToShop()", () => {
        it("should back to shop page", () => {
            const spy = jest.spyOn(router, "navigate");
            const SHOP = "tpi/shop";
            component.backToShop();
            expect(spy).toBeCalledWith([SHOP]);
        });
    });
    describe("backToReview()", () => {
        it("should back to Review and Apply page", () => {
            const spy = jest.spyOn(router, "navigate");
            const SHOP = "tpi/shop";
            component.backToReview();
            expect(spy).toBeCalledWith([SHOP], { queryParams: { review: true } });
        });
    });

    describe("displayButtonNames()", () => {
        it("should display the name of buttons in tpi footer", () => {
            component.languageStrings = {
                "primary.portal.applicationFlow.confirmation.viewCoverageSummary": "viewCoverageSummary",
            } as Record<string, string>;
            component.displayButtonNames("primary.portal.applicationFlow.confirmation.viewCoverageSummary");
            expect(component.displayButtonName).toStrictEqual("viewCoverageSummary");
        });
    });

    describe("initializeConfirmationPageButtons()", () => {
        it("should hide back button and display exit button for EXIT_ENROLLMENT", () => {
            component.initializeConfirmationPageButtons(ConfirmationStepLabels.EXIT_ENROLLMENT);
            expect(component.hideBackButton).toBe(true);
            expect(component.displayExitButton).toBe(true);
        });

        it("should hide back button, display exit button and set correct button name for VIEW_COVERAGE_SUMMARY", () => {
            jest.spyOn(component, "displayButtonNames");
            component.initializeConfirmationPageButtons(ConfirmationStepLabels.VIEW_COVERAGE_SUMMARY);
            expect(component.hideBackButton).toBe(true);
            expect(component.displayExitButton).toBe(true);
            expect(component.displayButtonNames).toHaveBeenCalledWith("primary.portal.applicationFlow.confirmation.viewCoverageSummary");
        });

        it("should hide back button, display exit button and set correct button name for VIEW_MY_COVERAGE", () => {
            jest.spyOn(component, "displayButtonNames");
            component.initializeConfirmationPageButtons(ConfirmationStepLabels.VIEW_MY_COVERAGE);
            expect(component.hideBackButton).toBe(true);
            expect(component.displayExitButton).toBe(true);
            expect(component.displayButtonNames).toHaveBeenCalledWith("primary.portal.applicationFlow.confirmation.viewMyCoverage");
        });

        it("should display product button and set display button name for other cases", () => {
            const customLabel = "custom_label";
            component.initializeConfirmationPageButtons(customLabel);
            expect(component.displayProductButton).toBe(true);
            expect(component.displayButtonName).toBe(customLabel);
        });
    });

    describe("initializeValues()", () => {
        it("should initialize values correctly when nextClick is true", () => {
            component.initializeValues(true);
            expect(component.showNextProductButton).toBe(true);
            expect(component.displayBackButton).toBe(false);
            expect(component.displayProductButton).toBe(false);
            expect(component.displayExitButton).toBe(false);
            expect(component.hideBackButton).toBe(false);
        });

        it("should initialize values correctly when nextClick is false", () => {
            component.initializeValues(false);
            expect(component.showNextProductButton).toBe(false);
            expect(component.displayBackButton).toBe(false);
            expect(component.displayProductButton).toBe(false);
            expect(component.displayExitButton).toBe(false);
            expect(component.hideBackButton).toBe(false);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
