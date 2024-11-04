import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PlanSeriesSettingsComponent } from "./plan-series-settings.component";
import { NGRXStore } from "@empowered/ngrx-store";
import { mockLanguageService } from "@empowered/testing";
import { TitleCasePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { provideMockStore } from "@ngrx/store/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { Gender, SettingsDropdownName, TobaccoStatus } from "@empowered/constants";
import { from } from "rxjs";

describe("PlanSeriesSettingsComponent", () => {
    let component: PlanSeriesSettingsComponent;
    let fixture: ComponentFixture<PlanSeriesSettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlanSeriesSettingsComponent],
            providers: [NGRXStore, provideMockStore({}), TitleCasePipe, { provide: LanguageService, useValue: mockLanguageService }],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanSeriesSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        component.selectedRateSheetPlanSeriesOptions = [
            {
                ageBands: [],
                genders: [],
                tobaccoStatuses: [],
                planId: 12,
                salaryRange: { minSalary: 50000, maxSalary: 90000 },
                coverageLevelOptions: [],
                riders: [],
                benefitAmounts: [],
            },
        ];
        expect(component).toBeTruthy();
    });

    describe("getMeta", () => {
        it("should get meta fata for portals", () => {
            const result = component.getMeta(SettingsDropdownName.AGE, "Ages", from(["1", "2", "3"]));
            expect(result.footer).toBeDefined();
            expect(result.portal).toBeDefined();
            expect(result.backdrop).toBeDefined();
        });
    });

    describe("getLabel", () => {
        beforeEach(() => {
            component.allString = "All";
        });
        it("should return the correct label for gender dropdown", () => {
            expect(component.getLabel(SettingsDropdownName.GENDER, [Gender.MALE, Gender.FEMALE], [Gender.MALE])).toBe("Male");
        });

        it("should return the correct label for gender dropdown if all options are selected", () => {
            expect(component.getLabel(SettingsDropdownName.GENDER, [Gender.MALE, Gender.FEMALE], [Gender.MALE, Gender.FEMALE])).toBe("All");
        });

        it("should return the correct label for gender dropdown if there is only one option selected and availbale", () => {
            expect(component.getLabel(SettingsDropdownName.GENDER, [Gender.FEMALE], [Gender.FEMALE])).toBe("Female");
        });

        it("should return the correct label for tobacco dropdown if all options are selected", () => {
            expect(
                component.getLabel(
                    SettingsDropdownName.TOBACCO,
                    [TobaccoStatus.TOBACCO, TobaccoStatus.NONTOBACCO, TobaccoStatus.UNDEFINED],
                    [TobaccoStatus.TOBACCO, TobaccoStatus.NONTOBACCO],
                ),
            ).toBe("2");
        });

        it("should return the correct label for tobacco dropdown", () => {
            expect(
                component.getLabel(
                    SettingsDropdownName.TOBACCO,
                    [TobaccoStatus.TOBACCO, TobaccoStatus.NONTOBACCO],
                    [TobaccoStatus.TOBACCO, TobaccoStatus.NONTOBACCO],
                ),
            ).toBe("All");
        });

        it("should return the correct label for ages dropdown", () => {
            expect(
                component.getLabel(
                    SettingsDropdownName.AGE,
                    [
                        {
                            minAge: 18,
                            maxAge: 24,
                        },
                    ],
                    [
                        {
                            minAge: 18,
                            maxAge: 24,
                        },
                    ],
                ),
            ).toBe("18–24");
        });

        it("should return the correct label for age bands dropdown", () => {
            expect(
                component.getLabel(
                    SettingsDropdownName.AGE,
                    [
                        {
                            minAge: 18,
                            maxAge: 24,
                        },
                        {
                            minAge: 25,
                            maxAge: 31,
                        },
                    ],
                    [
                        {
                            minAge: 18,
                            maxAge: 24,
                        },
                        {
                            minAge: 25,
                            maxAge: 31,
                        },
                    ],
                ),
            ).toBe("All");
        });
    });

    describe("ngOnDestroy", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy).toBeCalled();
        });
    });
});
