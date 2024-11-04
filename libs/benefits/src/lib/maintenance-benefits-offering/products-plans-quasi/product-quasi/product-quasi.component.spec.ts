import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { LanguageService } from "@empowered/language";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProductQuasiComponent } from "./product-quasi.component";
import { of } from "rxjs";
import { ComponentType } from "@angular/cdk/portal";
import { DatePipe } from "@angular/common";
import { CarrierId, Exceptions, PlanChoice, PolicyOwnershipType } from "@empowered/constants";
import { BenefitsOfferingState, SharedState } from "@empowered/ngxs-store";
import { UserState } from "@empowered/user";
import { Configuration, ExceptionsService } from "@empowered/api";
import { MockReplaceTagPipe } from "@empowered/testing";
import { MatTableModule } from "@angular/material/table";
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

const mockMatDialogData = {
    name: "test",
    opensFrom: "",
};

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as MatDialog;

const planChoices = [
    { id: 1, planYearId: 1, continuous: false, plan: { productId: 12, policyOwnershipType: PolicyOwnershipType.GROUP } },
    { id: 2, planYearId: 2, continuous: false, plan: { productId: 12, policyOwnershipType: PolicyOwnershipType.GROUP } },
    { id: 3, planYearId: 1, continuous: false, plan: { productId: 13, policyOwnershipType: PolicyOwnershipType.GROUP } },
] as PlanChoice[];

describe("ProductQuasiComponent", () => {
    let component: ProductQuasiComponent;
    let fixture: ComponentFixture<ProductQuasiComponent>;
    let store: Store;
    let exceptionService: ExceptionsService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProductQuasiComponent, MockReplaceTagPipe],
            providers: [
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
                DatePipe,
                Configuration,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [NgxsModule.forRoot([BenefitsOfferingState, UserState, SharedState]), MatTableModule, HttpClientTestingModule, StoreModule.forRoot({})],
        }).compileComponents();
    });

    beforeEach(() => {
        exceptionService = TestBed.inject(ExceptionsService);
        store = TestBed.inject(Store);
        const stateData = {
            ...store.snapshot(),
            productOffering: {
                mpGroup: 111,
                panelProducts: [
                    {
                        productChoice: {
                            id: 1,
                        },
                        product: {
                            valueAddedService: false,
                        },
                        carrier: [],
                    },
                ],
                planChoices: planChoices,
            },
            user: {
                agentLevel: 1,
            },
        };
        store.reset(stateData);
        fixture = TestBed.createComponent(ProductQuasiComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("checkVasException()", () => {
        it("should make isVasException as true if response has exception of type VAS_YEAR_ONE_PRODUCT_ADD", () => {
            const spy1 = jest.spyOn(exceptionService, "getExceptions").mockReturnValue(
                of([
                    {
                        id: 1,
                        type: "VAS_YEAR_ONE_PRODUCT_ADD",
                    } as Exceptions,
                ]),
            );
            component.checkVasException();
            expect(spy1).toBeCalledWith("111");
        });
    });

    describe("getVasPermission()", () => {
        it("should make isVASPermission as true if user has permission aflac.benefitOffering.view.vas.product", () => {
            store.reset({
                ...store.snapshot(),
                core: {
                    permissions: ["aflac.benefitOffering.view.vas.product"],
                },
            });
            component.getVasPermission();
            expect(component.isVASPermission).toBe(true);
        });
        it("should make isVASPermission as false if user doesn't has permission aflac.benefitOffering.view.vas.product", () => {
            store.reset({
                ...store.snapshot(),
                core: {
                    permissions: ["aflac.benefitOffering.other.permissions"],
                },
            });
            component.getVasPermission();
            expect(component.isVASPermission).toBe(false);
        });
    });

    describe("getPlanYearRelatedProduct()", () => {
        it("should get return product ids of the products related to plan year", () => {
            const returnValue = component.getPlanYearRelatedProduct(planChoices, 1);
            expect(returnValue).toStrictEqual([12, 13]);
        });
    });

    describe("getPlanYearRelatedChoices()", () => {
        it("should set unique product ids of group plans of the plan year", () => {
            store.reset({
                ...store.snapshot(),
                productOffering: {
                    planChoices: planChoices,
                },
            });
            component.uniqueProductIds = [];
            component.planYearId = 1;
            component.getPlanYearRelatedChoices();
            expect(component.uniqueProductIds).toStrictEqual([12, 13]);
        });
    });

    describe("getPlanYearRelatedIndividualChoices()", () => {
        it("should set empty array of unique product ids when there are no individual plans for the plan year", () => {
            store.reset({
                ...store.snapshot(),
                productOffering: {
                    planChoices: planChoices,
                },
            });
            component.uniqueIndividualProductIds = [1];
            component.planYearId = 1;
            component.getPlanYearRelatedIndividualChoices();
            expect(component.uniqueIndividualProductIds).toStrictEqual([]);
        });
        it("should set unique product ids of individual plans of the plan year", () => {
            const indvPlanChoices = [
                ...planChoices,
                { id: 4, planYearId: 1, continuous: false, plan: { productId: 13, policyOwnershipType: PolicyOwnershipType.INDIVIDUAL } },
            ];
            store.reset({
                ...store.snapshot(),
                productOffering: {
                    planChoices: indvPlanChoices,
                },
            });
            component.uniqueIndividualProductIds = [];
            component.planYearId = 1;
            component.getPlanYearRelatedIndividualChoices();
            expect(component.uniqueIndividualProductIds).toStrictEqual([13]);
        });
    });
    describe("getPlanYearRelatedADVChoices()", () => {
        it("should set unique product ids of ADV plans of the plan year", () => {
            const advPlanChoices = [
                ...planChoices,
                {
                    id: 4,
                    planYearId: 1,
                    continuous: false,
                    plan: { productId: 13, policyOwnershipType: PolicyOwnershipType.GROUP, carrierId: CarrierId.ADV },
                },
            ];
            store.reset({
                ...store.snapshot(),
                productOffering: {
                    planChoices: advPlanChoices,
                },
            });
            component.uniqueADVProductIds = [];
            component.planYearId = 1;
            component.getPlanYearRelatedADVChoices();
            expect(component.uniqueADVProductIds).toStrictEqual([13]);
        });
    });

    describe("getGroupCarrierName()", () => {
        it("should return unique group carrier names", () => {
            const plans = [
                { plan: { policyOwnershipType: PolicyOwnershipType.GROUP, carrierId: 1 } },
                { plan: { policyOwnershipType: PolicyOwnershipType.GROUP, carrierId: 2 } },
                { plan: { policyOwnershipType: PolicyOwnershipType.INDIVIDUAL, carrierId: 3 } },
            ];
            const carriers = [
                { id: 1, name: "One" },
                { id: 2, name: "Two" },
                { id: 3, name: "Three" },
            ];
            const returnValue = component.getGroupCarrierName(plans, carriers);
            expect(returnValue).toStrictEqual(["One", "Two"]);
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
    describe("getTaxId()", () => {
        it("should return true if a tax id is present", () => {
            const taxId = [
                {
                    attribute: "tax_id",
                    id: 123,
                    value: "54321",
                },
            ];
            const rxjs = jest.requireActual("rxjs");
            jest.spyOn(rxjs, "combineLatest").mockReturnValue(of([true, taxId]));
            component.getTaxId();
            expect(component.isTaxId).toBeTruthy();
        });

        it("should return false if no tax id is present", () => {
            const taxId = [
                {
                    attribute: "tax_id",
                    id: 123,
                    value: "",
                },
            ];
            const rxjs = jest.requireActual("rxjs");
            jest.spyOn(rxjs, "combineLatest").mockReturnValue(of([true, taxId]));
            component.getTaxId();
            expect(component.isTaxId).toBeFalsy();
        });
    });

    describe("isDisabled()", () => {
        it("should disable ABS checkbox if there is no tax id", () => {
            const row = {
                carrier: ["Aflac"],
                carrierId: [1, 70, 70],
                disabled: [false, true, true],
                displayOrder: 28,
                group: false,
                groupEligibility: true,
                id: 10,
                individual: undefined,
                individualEligibility: false,
                name: "Dental",
                valueAddedService: false,
            };
            component.isTaxIdFeatureEnabled = true;
            expect(component.isDisabled(row, "group")).toBeTruthy();
        });

        it("should not disable ABS checkbox if there is a tax id", () => {
            const row = {
                carrier: ["Aflac"],
                carrierId: [1, 70, 70],
                disabled: [false, false, false],
                displayOrder: 28,
                group: false,
                groupEligibility: true,
                id: 10,
                individual: undefined,
                individualEligibility: false,
                name: "Dental",
                valueAddedService: false,
            };
            component.isTaxIdFeatureEnabled = true;
            expect(component.isDisabled(row, "group")).toBeFalsy();
        });
    });
});
