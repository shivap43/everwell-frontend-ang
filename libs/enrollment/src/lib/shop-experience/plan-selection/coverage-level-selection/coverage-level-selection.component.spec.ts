import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormControl, ReactiveFormsModule } from "@angular/forms";
import { TPIRestrictionsForHQAccountsService } from "@empowered/common-services";
import { PlanOfferingPricing } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { AppFlowService, SetExitPopupStatus, ShopCartService } from "@empowered/ngxs-store";
import {
    mockAppFlowService,
    MockCoverageNamePipe,
    MockCurrencyPipe,
    mockLanguageService,
    MockReplaceTagPipe,
    mockStore,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";

import { CoverageLevelSelectionComponent } from "./coverage-level-selection.component";

describe("CoverageLevelSelectionComponent", () => {
    let component: CoverageLevelSelectionComponent;
    let fixture: ComponentFixture<CoverageLevelSelectionComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NgxsModule.forRoot([])],
            declarations: [CoverageLevelSelectionComponent, MockReplaceTagPipe, MockCoverageNamePipe, MockCurrencyPipe],
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
                    provide: AppFlowService,
                    useValue: mockAppFlowService,
                },
                ShopCartService,
                ReactiveFormsModule,
                TPIRestrictionsForHQAccountsService,
                ChangeDetectorRef,
                FormBuilder,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CoverageLevelSelectionComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        component.updateAmount = new EventEmitter<PlanOfferingPricing>();
        component.pricingData = [
            { coverageLevelId: 10, memberCost: 50, benefitAmount: 100 },
            { coverageLevelId: 10, memberCost: 40, benefitAmount: 200 },
        ] as PlanOfferingPricing[];
        component.coverageSelectRadio = new FormControl();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("selectCoverage()", () => {
        it("should emit event and dispatch action", () => {
            const spy1 = jest.spyOn(component.updateAmount, "emit");
            const spy2 = jest.spyOn(store, "dispatch");
            component.selectCoverage(10);
            expect(spy1).toBeCalledWith({ coverageLevelId: 10, memberCost: 40, benefitAmount: 200 });
            expect(spy2).toBeCalledWith(new SetExitPopupStatus(true));
        });
    });
    describe("selectByDefaultCoverageLevel()", () => {
        it("should emit event", () => {
            component.currentCoverageLevel = null;
            const spy1 = jest.spyOn(component.updateAmount, "emit");
            component.selectByDefaultCoverageLevel();
            expect(spy1).toBeCalledWith({ coverageLevelId: 10, memberCost: 40, benefitAmount: 200 });
        });
        it("should set currentCoverage", () => {
            component.currentCoverageLevel = component.pricingData[0];
            component.selectByDefaultCoverageLevel();
            expect(component.currentCoverage).toBe(component.pricingData[0]);
        });
    });
    describe("getPlanOfferingPricingById()", () => {
        it("should return existing plan offering pricing based on id and benefitAmount", () => {
            component.pricingData.push({ coverageLevelId: 10, memberCost: 70, benefitAmount: 300 } as PlanOfferingPricing);
            const planOffringPricing = component.getPlanOfferingPricingById(10);
            expect(planOffringPricing).toStrictEqual({ coverageLevelId: 10, memberCost: 50, benefitAmount: 100 });
            component.pricingData.push({ coverageLevelId: 10, memberCost: 40 } as PlanOfferingPricing);
            const planOffringPricing2 = component.getPlanOfferingPricingById(10);
            expect(planOffringPricing2).toStrictEqual({ coverageLevelId: 10, memberCost: 40 });
        });
    });
    describe("getCoverageAmountById()", () => {
        it("should return memberCost based on id", () => {
            const memberCost = component.getCoverageAmountById(10);
            expect(memberCost).toBe(40);
            component.pricingData = [];
            const memberCost2 = component.getCoverageAmountById(10);
            expect(memberCost2).toBe(-1);
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
