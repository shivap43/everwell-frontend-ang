import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { NgxsModule } from "@ngxs/store";
import { QuickQuotePlansComponent } from "./quick-quote-plans.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/portal";
import { Subject, of } from "rxjs";
import { provideMockStore } from "@ngrx/store/testing";
import { MockReplaceTagPipe, mockStore } from "@empowered/testing";
import { BackdropStyleInput, Plan } from "@empowered/constants";
import { BenefitCoverageSelectionModel, SharedState } from "@empowered/ngxs-store";
import { DropDownPortalComponent } from "@empowered/ui";
import { MatTableModule } from "@angular/material/table";
import { MatExpansionModule } from "@angular/material/expansion";

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

@Pipe({
    name: "[date]",
})
class MockDatePipe implements PipeTransform {
    transform(value: any, ...args: any[]) {
        return String(value);
    }
}

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) => ({
        afterClosed: () => of(undefined),
    }),
} as MatDialog;

@Pipe({
    name: "[currency]",
})
class MockCurrencyPipe implements PipeTransform {
    transform(value: any): string {
        return String(value);
    }
}

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

@Directive({
    selector: "[empoweredPortalTrigger]",
})
class MockPortalTriggerDirective {
    @Input("empoweredPortalTrigger") portalRef: DropDownPortalComponent;
}

const portalShownSubject = new Subject<void>();
const portalHiddenSubject = new Subject<void>();
@Component({
    selector: "empowered-drop-down-portal",
    template: "",
})
class MockDropdownPortalComponent {
    @Input() backdropAnchor: HTMLElement;
    @Input() ariaTitle: string;
    @Input() backdropStyle: BackdropStyleInput = BackdropStyleInput.NONE;
    @Input() portalClass = "";

    shown = portalShownSubject.asObservable();
    hidden = portalHiddenSubject.asObservable();
}

@Directive({
    selector: "[configEnabled]",
})
class MockConfigEnableDirective {
    @Input("configEnabled") configKey: string;
}

@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("QuickQuotePlansComponent", () => {
    let component: QuickQuotePlansComponent;
    let fixture: ComponentFixture<QuickQuotePlansComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                QuickQuotePlansComponent,
                MockMonSpinnerComponent,
                MockMonIconComponent,
                MockRichTooltipDirective,
                MockPortalTriggerDirective,
                MockDropdownPortalComponent,
                MockReplaceTagPipe,
                MockConfigEnableDirective,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: DatePipe, useClass: MockDatePipe },
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: CurrencyPipe, useClass: MockCurrencyPipe },
                { provide: Store, useValue: mockStore },
            ],
            imports: [NgxsModule.forRoot([SharedState]), HttpClientTestingModule, MatTableModule, MatExpansionModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuickQuotePlansComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
    });

    describe("QuickQuotePlansComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("checkRiderCoverage()", () => {
            const sampleRiderData = {
                coverageLevelPricing: [{ coverageLevel: { id: 3 } }, { coverageLevel: { id: 4 } }],
            };
            beforeEach(() => {
                component.planInfo = {
                    coverageLevelPricing: [{ coverageLevel: { id: 1 } }, { coverageLevel: { id: 2 } }],
                };
            });
            it("should be truthy for non matching coverageLevel Id of ride and base policy", () => {
                expect(component.checkRiderCoverage(sampleRiderData)).toBeTruthy();
            });
            it("should be falsy for matching coverageLevel id of ride and base policy", () => {
                sampleRiderData.coverageLevelPricing[0].coverageLevel.id = 1;
                sampleRiderData.coverageLevelPricing[1].coverageLevel.id = 2;
                expect(component.checkRiderCoverage(sampleRiderData)).toBeFalsy();
            });
        });

        describe("getRiderMissingInfoStatus", () => {
            const samplePlanInfo = { tag: "rider 1" };
            beforeEach(() => {
                component.planInfo = {
                    riders: [{ plan: { name: "rider 1" } }],
                };
            });

            it("should return true for same name of rider and plan", () => {
                expect(component.getRiderMissingInfoStatus(samplePlanInfo)).toBe(true);
            });
        });

        describe("isSTDSelected", () => {
            beforeEach(() => {
                component.quickQuotePlans = [
                    {
                        plans: [],
                        productId: 5,
                        productName: "Short-Term Disability",
                    },
                    {
                        plans: [],
                        productId: 28,
                        productName: "Whole Life",
                    },
                    {
                        plans: [],
                        productId: 29,
                        productName: "Term Life",
                    },
                    {
                        plans: [],
                        productId: 65,
                        productName: "Juvenile Whole Life",
                    },
                    {
                        plans: [],
                        productId: 67,
                        productName: "Juvenile Term Life",
                    },
                ];
            });
            it("should set true if STD plan selected", () => {
                component.productIndex = 0;
                component.isSTDSelected();
                expect(component.isSTDProduct).toBe(true);
            });

            it("should set false if STD plan is not selected", () => {
                component.productIndex = 1;
                component.isSTDSelected();
                expect(component.isSTDProduct).toBe(false);
            });
        });

        describe("isLifePlanSelected", () => {
            beforeEach(() => {
                component.quickQuotePlans = [
                    {
                        plans: [],
                        productId: 5,
                        productName: "Short-Term Disability",
                    },
                    {
                        plans: [],
                        productId: 28,
                        productName: "Whole Life",
                    },
                    {
                        plans: [],
                        productId: 29,
                        productName: "Term Life",
                    },
                    {
                        plans: [],
                        productId: 65,
                        productName: "Juvenile Whole Life",
                    },
                    {
                        plans: [],
                        productId: 67,
                        productName: "Juvenile Term Life",
                    },
                ];
            });
            it("should set true if whole life plan selected", () => {
                component.productIndex = 1;
                component.isLifePlanSelected();
                expect(component.isLifePlan).toBe(true);
            });

            it("should set true if term life plan selected", () => {
                component.productIndex = 2;
                component.isLifePlanSelected();
                expect(component.isLifePlan).toBe(true);
            });

            it("should set false if term life/ whole life is not selected", () => {
                component.productIndex = 0;
                component.isLifePlanSelected();
                expect(component.isLifePlan).toBe(false);
            });
        });

        describe("isJuvenile", () => {
            beforeEach(() => {
                component.quickQuotePlans = [
                    {
                        plans: [],
                        productId: 5,
                        productName: "Short-Term Disability",
                    },
                    {
                        plans: [],
                        productId: 28,
                        productName: "Whole Life",
                    },
                    {
                        plans: [],
                        productId: 29,
                        productName: "Term Life",
                    },
                    {
                        plans: [],
                        productId: 65,
                        productName: "Juvenile Whole Life",
                    },
                    {
                        plans: [],
                        productId: 67,
                        productName: "Juvenile Term Life",
                    },
                ];
            });
            it("should set true if Juvenile plan selected", () => {
                component.productIndex = 4;
                expect(component.isJuvenile()).toBe(true);
            });

            it("should set false if Juvenile plan is not selected", () => {
                component.productIndex = 0;
                expect(component.isJuvenile()).toBe(false);
            });
        });

        describe("setSpouseInfoMissingError()", () => {
            beforeEach(() => {
                component.planInfo = {
                    coverageLevelPricing: [{ coverageLevel: { id: 1 } }],
                    riders: [],
                };
                component.coverageLevelsData = [{ eliminationPeriod: "" }];
            });

            it("should not set any error if no missing info", () => {
                jest.spyOn(store, "selectSnapshot").mockReturnValue([{ spouseAge: 30 }]);
                component.setSpouseInfoMissingError();
                expect(component.setSpouseInfoMissingError()).toBe("");
            });
        });

        describe("setBenefitAmounts()", () => {
            const mockPlan = { id: 1 } as Plan;
            const mockBenefitAmounts = [{ benefitAmounts: [10, 20] }] as BenefitCoverageSelectionModel[];
            beforeEach(() => {
                component.planInfo = {
                    coverageLevelPricing: [{ coverageLevel: { id: 1 } }],
                    riders: [],
                };
                component.coverageLevelsData = [{ eliminationPeriod: "" }];
                component.eliminationPeriodObject = {
                    eliminationPeriodList: {},
                    eliminationPeriodValue: { 1: {} },
                    eliminationPeriodRadio: {},
                };
                component.fromRiderClose = true;
            });
            it("should assign coverageLevelPricing to pricingTableArray", () => {
                jest.spyOn(store, "selectSnapshot").mockReturnValue([{ spouseAge: 30 }]);
                component.setBenefitAmounts(mockPlan, mockBenefitAmounts);
                expect(component.pricingTableArray).toEqual(component.planInfo.coverageLevelPricing);
            });

            it("should set iconValMsg to undefined if no info missing", () => {
                component.setBenefitAmounts(mockPlan, mockBenefitAmounts);
                expect(component.iconValMsg[mockPlan.id]).toBe(undefined);
            });

            it("should call setDefaultBenefitAmount method", () => {
                const spy = jest.spyOn(component, "setDefaultBenefitAmount");
                component.setBenefitAmounts(mockPlan, mockBenefitAmounts);
                expect(spy).toBeCalledWith(mockPlan, mockBenefitAmounts);
            });

            it("should call setEliminationPeriodData method", () => {
                const spy = jest.spyOn(component, "setEliminationPeriodData");
                component.setBenefitAmounts(mockPlan, mockBenefitAmounts);
                expect(spy).toBeCalled();
            });
        });

        describe("getCurrentPlanPricing()", () => {
            beforeEach(() => {
                component.productIndex = 0;
                component.quickQuotePlans = [
                    {
                        plans: [],
                        productId: 5,
                        productName: "Short-Term Disability",
                    },
                ];
                jest.spyOn(store, "selectSnapshot").mockReturnValue([{ productId: 5, plans: [{ id: 1 }] }]);
                jest.spyOn(component, "getPlansOfCurrentProduct").mockReturnValue([{ id: 1, pricing: 10 }]);
            });

            it("should call getPlansOfCurrentProduct method", () => {
                const spy = jest.spyOn(component, "getPlansOfCurrentProduct");
                component.getCurrentPlanPricing(5, 1);
                expect(spy).toBeCalled();
            });
            it("should call getPlanIndexById method", () => {
                const spy = jest.spyOn(component, "getPlanIndexById");
                component.getCurrentPlanPricing(5, 1);
                expect(spy).toBeCalledWith(1);
            });
            it("should return the pricing of current plan", () => {
                const price = component.getCurrentPlanPricing(5, 1);
                expect(price).toEqual(10);
            });
        });

        describe("getPlansOfCurrentProduct()", () => {
            beforeEach(() => {
                component.productIndex = 0;
                component.quickQuotePlans = [
                    {
                        plans: [],
                        productId: 5,
                        productName: "Short-Term Disability",
                    },
                ];
                jest.spyOn(store, "selectSnapshot").mockReturnValue([{ productId: 5, plans: [{ id: 1 }] }]);
            });
            it("should return the plans of current product", () => {
                const plans = component.getPlansOfCurrentProduct();
                expect(plans).toEqual([{ id: 1 }]);
            });
        });

        describe("getPlanIndexById()", () => {
            beforeEach(() => {
                component.productIndex = 0;
                component.quickQuotePlans = [
                    {
                        plans: [],
                        productId: 5,
                        productName: "Short-Term Disability",
                    },
                ];
                jest.spyOn(store, "selectSnapshot").mockReturnValue([{ productId: 5, plans: [{ id: 1 }] }]);
            });
            it("should call getPlansOfCurrentProduct method", () => {
                const spy = jest.spyOn(component, "getPlansOfCurrentProduct");
                component.getPlanIndexById(1);
                expect(spy).toBeCalled();
            });

            it("should return index of plan with provided plan Id", () => {
                const index = component.getPlanIndexById(1);
                expect(index).toEqual(0);
            });
        });

        describe("getCurrentPlanCoverageLevel()", () => {
            beforeEach(() => {
                component.productIndex = 0;
                component.quickQuotePlans = [
                    {
                        plans: [],
                        productId: 5,
                        productName: "Short-Term Disability",
                    },
                ];
                jest.spyOn(store, "selectSnapshot").mockReturnValue([{ productId: 5, plans: [{ id: 1 }] }]);
                jest.spyOn(component, "getPlansOfCurrentProduct").mockReturnValue([
                    { id: 1, pricing: 10, coverageLevels: [{ eliminationPeriod: "" }] },
                ]);
            });

            it("should call getPlansOfCurrentProduct method", () => {
                const spy = jest.spyOn(component, "getPlansOfCurrentProduct");
                component.getCurrentPlanCoverageLevel(5, 1);
                expect(spy).toBeCalled();
            });
            it("should call getPlanIndexById method", () => {
                const spy = jest.spyOn(component, "getPlanIndexById");
                component.getCurrentPlanCoverageLevel(5, 1);
                expect(spy).toBeCalledWith(1);
            });
            it("should return the coverage levels of current plan", () => {
                const coverageLevels = [{ eliminationPeriod: "" }];
                const response = component.getCurrentPlanCoverageLevel(5, 1);
                expect(response).toEqual(coverageLevels);
            });
        });

        describe("onChangeRiderRadioButton()", () => {
            it("should set the option selected", () => {
                const riderDataObject = {
                    showRadio: false,
                    showMultiplePrice: false,
                    selectedBenefitAmount: [],
                    temporarySelectedBenefitAmount: [],
                    combinedBenefitAmount: 10000,
                    isCustomSelected: false,
                    optionSelected: component.optionSelected.COMBINED,
                    temporaryOptionSelected: component.optionSelected.COMBINED,
                };
                component.ridersObjectOfPlan[1] = riderDataObject;
                component.onChangeRiderRadioButton(component.optionSelected.CUSTOM, 1);
                expect(component.ridersObjectOfPlan[1].temporaryOptionSelected).toBe(component.optionSelected.CUSTOM);
            });
        });

        describe("ngOnDestroy()", () => {
            it("should unsubscribe from all subscriptions", () => {
                const nextSpy = jest.spyOn(component["unsubscribe$"], "next");
                const completeSpy = jest.spyOn(component["unsubscribe$"], "complete");
                component.ngOnDestroy();
                expect(nextSpy).toHaveBeenCalledTimes(1);
                expect(completeSpy).toHaveBeenCalledTimes(1);
            });
        });
    });
});
