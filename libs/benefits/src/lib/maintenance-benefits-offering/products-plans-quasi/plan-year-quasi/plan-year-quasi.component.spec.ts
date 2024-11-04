import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { LanguageService } from "@empowered/language";
import { FormBuilder } from "@angular/forms";
import { ComponentType } from "@angular/cdk/portal";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { PlanYearQuasiComponent } from "./plan-year-quasi.component";
import { of } from "rxjs";
import { MapPlanChoicesToNewPlanYearPanel, SetManagePlanYearChoice, UpdateCurrentPlanYearId } from "@empowered/ngxs-store";
import { PlanChoice, PlanYear } from "@empowered/constants";
import { StoreModule } from "@ngrx/store";

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as MatDialog;

const mockMatDialogData = {
    productInformation: {
        plans: [{ plan: { plan: { productId: 1 } }, planYear: { id: 1 } }],
    },
    planYears: [{ id: 1 }],
};

describe("PlanYearQuasiComponent", () => {
    let component: PlanYearQuasiComponent;
    let fixture: ComponentFixture<PlanYearQuasiComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlanYearQuasiComponent],
            providers: [
                RouterTestingModule,
                FormBuilder,
                DatePipe,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, StoreModule.forRoot({})],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanYearQuasiComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("updateSelection()", () => {
        it("should dispatch MapPlanChoicesToNewPlanYearPanel when choice value is not 'new_plan' and 'current_plan'", () => {
            component["approvedPlanChoices"] = [];
            component["unApprovedPlanChoices"] = [];
            const spy1 = jest.spyOn(store, "dispatch");
            component.updateSelection({ value: "test" });
            expect(spy1).toBeCalledTimes(2);
            expect(spy1).toHaveBeenCalledWith(new MapPlanChoicesToNewPlanYearPanel([]));
        });
        it("should not dispatch MapPlanChoicesToNewPlanYearPanel when choice value is 'new_plan'", () => {
            component["approvedPlanChoices"] = [];
            component["unApprovedPlanChoices"] = [];
            const spy1 = jest.spyOn(store, "dispatch");
            component.updateSelection({ value: "new_plan" });
            expect(spy1).toBeCalledTimes(0);
        });
    });

    describe("arrangeFuturePlanYears()", () => {
        it("should arrange future plan years", () => {
            component["planYears"] = [
                { id: 1, coveragePeriod: { effectiveStarting: "2022-01-01" } },
                { id: 2, coveragePeriod: { effectiveStarting: "2023-01-01" } },
                { id: 3, coveragePeriod: { effectiveStarting: "2024-01-01" } },
            ] as PlanYear[];
            const py = { id: 2, coveragePeriod: { effectiveStarting: "2023-01-01" } } as PlanYear;
            component.arrangeFuturePlanYears(py);
            expect(component["planYears"]).toStrictEqual([{ id: 3, coveragePeriod: { effectiveStarting: "2024-01-01" } }]);
        });
    });

    describe("onNext()", () => {
        it("should not dispatch any action when userChoice is null", () => {
            component["userChoice"] = null;
            const spy1 = jest.spyOn(store, "dispatch");
            component.onNext();
            expect(spy1).toBeCalledTimes(0);
        });

        it("should dispatch UpdateCurrentPlanYearId action with null when userChoice is 'new_plan'", () => {
            component["userChoice"] = "new_plan";
            const spy1 = jest.spyOn(store, "dispatch");
            component.onNext();
            expect(spy1).toBeCalledTimes(3);
            expect(spy1).toBeCalledWith(new SetManagePlanYearChoice("new_plan"));
            expect(spy1).toBeCalledWith(new MapPlanChoicesToNewPlanYearPanel([]));
            expect(spy1).toBeCalledWith(new UpdateCurrentPlanYearId(null));
        });

        it("should dispatch UpdateCurrentPlanYearId action with currentPlanYearId when userChoice is 'current_plan'", () => {
            component["userChoice"] = "current_plan";
            component["currentPlanYearId"] = 1;
            const spy1 = jest.spyOn(store, "dispatch");
            jest.spyOn(store, "selectSnapshot").mockReturnValueOnce([
                { id: 1, planYearId: 1 },
                { id: 2, planYearId: 2 },
            ]);
            component.onNext();
            expect(spy1).toBeCalledTimes(4);
            expect(spy1).toBeCalledWith(new SetManagePlanYearChoice("current_plan"));
            expect(spy1).toBeCalledWith(new MapPlanChoicesToNewPlanYearPanel([]));
            expect(spy1).toBeCalledWith(new UpdateCurrentPlanYearId(1));
            expect(spy1).toBeCalledWith(new MapPlanChoicesToNewPlanYearPanel([{ id: 1, planYearId: 1 } as PlanChoice]));
        });
    });

    describe("getPlanYearRelatedProduct()", () => {
        it("should get return product ids of the products related to plan year", () => {
            component["productId"] = 12;
            const planChoices = [
                { id: 1, planYearId: 1, continuous: false, plan: { productId: 12 } },
                { id: 2, planYearId: 2, continuous: false, plan: { productId: 12 } },
                { id: 3, planYearId: 1, continuous: false, plan: { productId: 13 } },
            ] as PlanChoice[];
            const returnValue = component.getPlanYearRelatedProduct(planChoices, 1);
            expect(returnValue).toStrictEqual([12]);
        });
    });

    describe("getPlanYearRelatedChoices()", () => {
        it("should get return product ids of the products related to plan year", () => {
            component["productId"] = 13;
            component["approvedPlanChoices"] = [
                { id: 1, planYearId: 1, continuous: false, plan: { productId: 12 } },
                { id: 2, planYearId: 2, continuous: false, plan: { productId: 12 } },
            ] as PlanChoice[];
            component["unApprovedPlanChoices"] = [
                { id: 4, planYearId: 1, continuous: false, plan: { productId: 12 } },
                { id: 5, planYearId: 2, continuous: false, plan: { productId: 12 } },
                { id: 6, planYearId: 1, continuous: false, plan: { productId: 13 } },
            ] as PlanChoice[];
            const returnValue = component.getPlanYearRelatedChoices(1);
            expect(returnValue).toStrictEqual([13]);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
