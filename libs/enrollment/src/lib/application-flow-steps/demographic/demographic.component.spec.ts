import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";

import { DemographicComponent } from "./demographic.component";
import { mockDatePipe, mockLanguageService } from "@empowered/testing";
import { MemberService, ShoppingCartDisplayService, StaticService } from "@empowered/api";
import { EnrollmentState, AppFlowService, StaticUtilService, UtilService } from "@empowered/ngxs-store";

import { HttpClientTestingModule } from "@angular/common/http/testing";
import { DatePipe } from "@angular/common";
import { RouterTestingModule } from "@angular/router/testing";
import { CountryState, GetCartItems, ResponseItem } from "@empowered/constants";
import { of, throwError } from "rxjs";
import { NgxMaskPipe } from "ngx-mask";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { StoreModule } from "@ngrx/store";

@Directive({
    selector: "[empoweredFocusOnFirstInvalidField]",
})
class MockFocusOnFirstInvalidFieldDirective {
    @Input("empoweredFocusOnFirstInvalidField") queryString: string;
}
@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}

@Component({
    selector: "mon-alert",
    template: "",
})
class MockMonAlertComponent {}
@Component({
    selector: "empowered-input",
    template: "",
})
class MockInputComponent {}

const mockMaskPipe = {
    transform: (value: string, mask: string) => "09/09/2000",
} as NgxMaskPipe;

@Directive({
    selector: "[patterns]",
})
class MockPatternDirective {
    @Input("patterns") matchPatterns: string;
}
describe("DemographicComponent", () => {
    let component: DemographicComponent;
    let fixture: ComponentFixture<DemographicComponent>;
    let store: Store;
    let stateForNgxsStore: Store;
    let staticService: StaticService;

    const cartData = {
        id: 13,
        riders: [
            {
                planId: 12,
            },
            {
                planId: 22,
            },
        ],
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                NgxsModule.forRoot([EnrollmentState]),
                RouterTestingModule,
                ReactiveFormsModule,
                StoreModule.forRoot({}),
            ],
            declarations: [
                DemographicComponent,
                MockFocusOnFirstInvalidFieldDirective,
                MockInputComponent,
                MockMonAlertComponent,
                MockMonSpinnerComponent,
                MockPatternDirective,
            ],
            providers: [
                FormBuilder,
                Store,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                StaticService,
                MemberService,
                AppFlowService,
                ShoppingCartDisplayService,
                UtilService,
                StaticUtilService,
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                { provide: NgxMaskPipe, useValue: mockMaskPipe },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DemographicComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        staticService = TestBed.inject(StaticService);
        stateForNgxsStore = {
            ...store.snapshot(),
            enrollment: {
                appResponseItems: [
                    {
                        planId: 1,
                        application: {
                            id: 11,
                            planId: 12,
                            cartItemId: 13,
                        },
                    },
                    {
                        planId: 2,
                        application: {
                            id: 21,
                            planId: 22,
                            cartItemId: 23,
                        },
                    },
                ] as ResponseItem[],
            },
        };
        store.reset(stateForNgxsStore);
        component.planObject = {
            application: {
                id: 11,
                planId: 12,
                cartData: cartData,
                appData: {
                    planId: 12,
                },
            },
            steps: [
                {
                    directions: "directions",
                },
            ],
            reinstate: false,
        };
        component.cartData = cartData as GetCartItems;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("loadApplicationResponses()", () => {
        it("should set appResponses", () => {
            component.loadApplicationResponses();
            expect(component.appResponses).toStrictEqual({
                planId: 1,
                application: {
                    id: 11,
                    planId: 12,
                    cartItemId: 13,
                },
            });
        });
    });
    describe("createDemographicsData()", () => {
        it("should set data form planObject", () => {
            component.createDemographicsData();
            expect(component.planId).toBe(12);
            expect(component.cartData).toBe(cartData);
            expect(component.riderCartData).toStrictEqual({
                planId: 12,
            });
            expect(component.stepsData).toStrictEqual({
                directions: "directions",
            });
        });
    });
    describe("getRiderCartDataFromCart()", () => {
        it("should return riders", () => {
            component.planId = 12;
            component.cartData = {} as GetCartItems;
            const riders1 = component.getRiderCartDataFromCart({});
            expect(riders1).toBeNull();
            component.cartData = { riders: [] } as GetCartItems;
            const riders2 = component.getRiderCartDataFromCart({ riders: [] });
            expect(riders2).toBeNull();
            component.cartData = cartData as GetCartItems;
            const riders3 = component.getRiderCartDataFromCart(cartData);
            expect(riders3).toStrictEqual({
                planId: 12,
            });
        });
    });
    describe("getStatesResponse()", () => {
        it("should set stateDropDown", () => {
            const spy = jest.spyOn(staticService, "getStates").mockReturnValue(
                of([
                    {
                        abbreviation: "GA",
                        name: "Georgea",
                    },
                    {
                        abbreviation: "AL",
                        name: "Alabama",
                    },
                ] as CountryState[]),
            );
            component.getStatesResponse();
            expect(spy).toBeCalledTimes(1);
            expect(component.stateDropDown).toStrictEqual(["GA", "AL"]);
        });
        it("should set errorMessage when there is api error response", () => {
            jest.spyOn(staticService, "getStates").mockReturnValue(
                throwError({
                    error: { message: "api error message" },
                    status: 400,
                }),
            );
            component.getStatesResponse();
            expect(component.errorMessage).toStrictEqual("secondary.portal.applicationFlow.demographics.saveResponseError");
        });
    });
});
