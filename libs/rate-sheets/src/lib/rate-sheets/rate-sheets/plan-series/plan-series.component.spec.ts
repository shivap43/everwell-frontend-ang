import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { PlanSeriesComponent } from "./plan-series.component";
import { mockLanguageService } from "@empowered/testing";
import { LanguageService } from "@empowered/language";
import { MissingInfoType, PlanSeries, PlanSeriesCategory, RateSheetSettings } from "@empowered/constants";
import { RateSheetsActions } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { MatAccordion } from "@angular/material/expansion";

const moreSettings = { eligibleEmployees: "Eligible employees", sicCode: "SIC/ABI code", zipCode: "Zip code" };

const mockPlanSeries = {
    id: 1,
    code: "test",
    name: "test",
    categories: [],
    plans: [],
} as PlanSeries;

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("PlanSeriesComponent", () => {
    let component: PlanSeriesComponent;
    let fixture: ComponentFixture<PlanSeriesComponent>;
    let ngrxStore: NGRXStore;
    let accordion: MatAccordion;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlanSeriesComponent, MockRichTooltipDirective],
            providers: [NGRXStore, provideMockStore({}), MatAccordion, { provide: LanguageService, useValue: mockLanguageService }],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanSeriesComponent);
        component = fixture.componentInstance;
        ngrxStore = TestBed.inject(NGRXStore);
        accordion = TestBed.inject(MatAccordion);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("disablePlanSeries()", () => {
        it("should not disable plan if no requiredPriceRateProperties", () => {
            component.disablePlanSeries(mockPlanSeries);
            expect(component.disable[mockPlanSeries.id]).toBe(false);
        });
        it("should disable plan", () => {
            component.moreSettingsProperties = [{}];
            component.disablePlanSeries({
                id: 1,
                code: "test",
                name: "test plan series",
                categories: [],
                plans: [
                    {
                        id: 1,
                        name: "test plan",
                        adminName: "test plan",
                        carrierId: 1,
                        missingEmployerFlyer: false,
                        displayOrder: 1,
                        description: "test",
                        planDetails: { requiredPriceRateProperties: [MissingInfoType.ADDRESS] },
                    },
                ],
            });
            expect(component.disable[mockPlanSeries.id]).toBe(true);
        });
    });

    describe("removeProperties()", () => {
        const rateSheetSettings = {
            zipCode: "30350",
            sicCode: "105",
            eligibleSubscribers: 25,
        } as RateSheetSettings;
        it("should exit early if tobacco FormGroup is invalid", () => {
            component.moreSettingsProperties = [];
            const spy1 = jest.spyOn(component, "removeRequiredProperty");
            const spy2 = jest.spyOn(component, "removeMoreSettingProperty");
            component.removeProperties(rateSheetSettings);
            expect(spy1).not.toBeCalled();
            expect(spy2).not.toBeCalled();
        });
        it("remove 'Eligible employees' from moreSettingsProperties array and 'ELIGIBLE_EMPLOYEES' from requiredProperty array", () => {
            component.moreSettingsProperties = [moreSettings.eligibleEmployees];
            const spy1 = jest.spyOn(component, "removeRequiredProperty");
            const spy2 = jest.spyOn(component, "removeMoreSettingProperty");
            component.removeProperties(rateSheetSettings);
            expect(spy1).toBeCalledWith(MissingInfoType.ELIGIBLE_EMPLOYEES);
            expect(spy2).toBeCalledWith(moreSettings.eligibleEmployees);
        });
        it("remove 'SIC/ABI code' from moreSettingsProperties array and 'SIC_CODE' from requiredProperty array", () => {
            component.moreSettingsProperties = [moreSettings.sicCode];
            const spy1 = jest.spyOn(component, "removeRequiredProperty");
            const spy2 = jest.spyOn(component, "removeMoreSettingProperty");
            component.removeProperties(rateSheetSettings);
            expect(spy1).toBeCalledWith(MissingInfoType.SIC_CODE);
            expect(spy2).toBeCalledWith(moreSettings.sicCode);
        });
        it("remove 'Zip code' from moreSettingsProperties array and 'WORK_ZIP_STATE' from requiredProperty array", () => {
            component.moreSettingsProperties = [moreSettings.zipCode];
            const spy1 = jest.spyOn(component, "removeRequiredProperty");
            const spy2 = jest.spyOn(component, "removeMoreSettingProperty");
            component.removeProperties(rateSheetSettings);
            expect(spy1).toBeCalledWith(MissingInfoType.WORK_ZIP_STATE);
            expect(spy2).toBeCalledWith(moreSettings.zipCode);
        });
    });

    describe("addMoreSettingsProperty()", () => {
        it("Add property 'Eligible employees' into moreSettingsProperties array when requiredProperty is 'ELIGIBLE_EMPLOYEES'", () => {
            component.addMoreSettingsProperty(MissingInfoType.ELIGIBLE_EMPLOYEES);
            expect(component.moreSettingsProperties).toEqual(["Eligible employees"]);
        });
        it("Add property 'SIC/ABI code' into moreSettingsProperties array when requiredProperty is 'SIC_CODE'", () => {
            component.addMoreSettingsProperty(MissingInfoType.SIC_CODE);
            expect(component.moreSettingsProperties).toEqual(["SIC/ABI code"]);
        });
        it("Add property 'Zip code' into moreSettingsProperties array when requiredProperty is 'WORK_ZIP_STATE'", () => {
            component.addMoreSettingsProperty(MissingInfoType.WORK_ZIP_STATE);
            expect(component.moreSettingsProperties).toEqual(["Zip code"]);
        });
    });

    describe("removeRequiredProperty()", () => {
        it("Remove Required property from the requiredProperties array when user update more setting", () => {
            component.requiredProperties = [MissingInfoType.ELIGIBLE_EMPLOYEES, MissingInfoType.SIC_CODE, MissingInfoType.WORK_ZIP_STATE];
            component.removeRequiredProperty(MissingInfoType.SIC_CODE);
            expect(component.requiredProperties).toStrictEqual(["ELIGIBLE_EMPLOYEES", "WORK_ZIP_STATE"]);
        });
    });

    describe("removeMoreSettingProperty()", () => {
        it("Remove property from the moreSettingsProperties array when user update more setting.", () => {
            component.moreSettingsProperties = [moreSettings.zipCode, moreSettings.eligibleEmployees, moreSettings.sicCode];
            component.removeMoreSettingProperty(moreSettings.zipCode);
            expect(component.moreSettingsProperties).toStrictEqual([moreSettings.eligibleEmployees, moreSettings.sicCode]);
        });
    });

    describe("generateMissingInfoToolTip()", () => {
        it("should generate toolTipMessage", () => {
            component.generateMissingInfoToolTip();
            expect(component.toolTipMessage).toBeTruthy();
        });
    });

    describe("onExpand()", () => {
        it("should open panel", () => {
            const spy = jest.spyOn(component.panelOpenSubject$, "next");
            component.onExpand(mockPlanSeries);
            expect(spy).toBeCalledWith(true);
        });
        it("should update store", () => {
            const spy = jest.spyOn(ngrxStore, "dispatch");
            component.onExpand(mockPlanSeries);
            expect(spy).toBeCalledWith(RateSheetsActions.setSelectedPlanSeries({ planSeries: mockPlanSeries }));
        });
    });

    describe("onClose()", () => {
        it("Executes on closing of the plans series panel.", () => {
            const spy = jest.spyOn(component.panelOpenSubject$, "next");
            component.expandedPlanSeries = { id: 25, code: "Some Code", name: "Some Name", categories: [PlanSeriesCategory.MAC] };
            component.onClose(25);
            expect(spy).toBeCalledWith(false);
        });
    });

    describe("closeAllPanels()", () => {
        it("should close all panels for accordion", () => {
            component.accordion = accordion;
            const spy = jest.spyOn(component.accordion, "closeAll");
            component.closeAllPanels();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyNext).toBeCalledTimes(1);
            expect(spyComplete).toBeCalledTimes(1);
        });
    });
});
