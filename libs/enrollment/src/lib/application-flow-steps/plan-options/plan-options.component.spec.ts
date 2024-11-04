import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { AsyncStatus, GetAncillary, GetCartItems, RiderIndex, StepData } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { State } from "@empowered/ngrx-store/ngrx-states/app.state";
import { AuthState } from "@empowered/ngrx-store/ngrx-states/auth";
import { AUTH_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/auth/auth.reducer";
import { DualPlanYearState, EnrollmentState } from "@empowered/ngxs-store";
import { mockDatePipe, mockMatDialog, mockUserService } from "@empowered/testing";
import { UserService } from "@empowered/user";
import { Action } from "@ngrx/store";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { PlanOptionsComponent } from "./plan-options.component";

export const initialState = {
    [AUTH_FEATURE_KEY]: {
        ...AuthState.initialState,
        user: {
            status: AsyncStatus.SUCCEEDED,
            value: { id: "111", type: "some type", adminId: 121, producerId: 543 } as unknown as unknown as Credential,
            error: null,
        },
    },
};

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any): string {
        return "replaced";
    }
}

@Directive({
    selector: "[empoweredFocusOnFirstInvalidField]",
})
class MockFocusOnFirstInvalidFieldDirective {
    @Input("empoweredFocusOnFirstInvalidField") queryString: string;
}
describe("PlanOptionsComponent", () => {
    let component: PlanOptionsComponent;
    let fixture: ComponentFixture<PlanOptionsComponent>;
    let ngrxStore: NGRXStore;
    let store: MockStore<State>;
    let ngxsStore: Store;
    const fb = new FormBuilder();
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlanOptionsComponent, MockReplaceTagPipe, MockFocusOnFirstInvalidFieldDirective],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule, ReactiveFormsModule],
            providers: [
                NGRXStore,
                provideMockStore({ initialState }),
                FormBuilder,
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanOptionsComponent);
        component = fixture.componentInstance;
        ngrxStore = TestBed.inject(NGRXStore);
        component.mpGroup = 12345;
        component.planObject = {
            currentSection: {
                title: "",
            },
            application: {
                appData: {
                    planId: 1,
                    sections: [
                        {
                            steps: [],
                            title: "",
                        },
                    ],
                },
                cartData: {
                    riders: [],
                    planOffering: {
                        plan: {
                            characteristics: ["SUPPLEMENTARY"],
                        },
                    },
                },
                baseRiderId: 7500,
            },
            steps: [
                {
                    id: 1,
                    type: "First",
                },
            ],
            basePlanId: 7500,
            rider: { riderIndex: 1 } as RiderIndex,
        } as StepData;
        store = TestBed.inject(MockStore);
        ngxsStore = TestBed.inject(Store);
        ngxsStore.reset({
            ...ngxsStore.snapshot(),
            dualPlanYear: {
                oeDualPlanYear: { id: 1 },
                isDualPlanYear: false,
            },
            enrollment: {
                payments: [],
                enrollments: [
                    {
                        plan: {
                            dependentPlanIds: [7500],
                        },
                        riders: [
                            {
                                plan: {
                                    id: 7500,
                                },
                                benefitAmount: 7000,
                            },
                        ],
                    },
                ],
                appResponseItems: [],
                applicationPanel: [
                    {
                        planId: 7500,
                        appData: {
                            planId: 1,
                            sections: [
                                {
                                    steps: [],
                                    title: "",
                                },
                            ],
                        },
                    },
                ],
            },
        });
        component.coverageLevelForm = fb.group({
            coverageLevel: [123],
            coveragePrice: [10.1],
        });
    });

    describe("PlanOptionsComponent", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });

        it("check assisting admin id is available", (done) => {
            expect.assertions(1);
            component.assistingAdminId$.subscribe((result) => {
                expect(result).toBeDefined();
                done();
            });
        });

        it("check coverage price exists", () => {
            expect(component.coverageLevelForm.controls.coverageLevel.value).toBeTruthy();
            expect(component.coverageLevelForm.controls.coveragePrice).toBeTruthy();
        });
    });

    // updateCartData to be added
    describe("dispatch()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should call store's dispatch", () => {
            const mockAction = { type: "fake" } as Action;
            const spy = jest.spyOn(store, "dispatch");
            ngrxStore.dispatch(mockAction);
            expect(spy).toBeCalledWith(mockAction);
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
