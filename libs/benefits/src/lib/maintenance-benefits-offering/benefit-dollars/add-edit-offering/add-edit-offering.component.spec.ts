import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { AccountService, BenefitDollarData, BenefitDollars, ClassNames, Configuration, FlexDollar, RegionNames } from "@empowered/api";
import { FormGroup, FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { of, throwError } from "rxjs";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { AddEditOfferingComponent } from "./add-edit-offering.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { mockLanguageService, mockStaticUtilService } from "@empowered/testing";
import { ClientErrorResponseCode, ContributionType } from "@empowered/constants";
import { SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { ActivatedRoute } from "@angular/router";
import { ConfigEnabledDirective, MaterialModule } from "@empowered/ui";

const mockStore = {
    dispatch: () => of({}),
    select: () => of({}),
    selectSnapshot: () => of({}),
};

const mockMatDialogRef = { close: () => {} };

const flexDollar = {
    id: 1,
    name: "FlexDollarName",
    description: "FlexDollarDesc",
    amount: 4.5,
    contributionType: "FLAT_AMOUNT",
    // applicableProductId: 2,
    isApproved: true,
    // contributionType: "PERCENTAGE",
    // currentAmount: 100,
} as FlexDollar;

const mockDialogData = {
    currentOffering: null,
    allClasses: null,
    allRegions: null,
    allProducts: null,
    payFrequency: {
        id: 1,
        frequencyType: "Weekly",
        name: "Weekly",
        payrollsPerYear: 24,
    },
    payFrequencies: null,
} as BenefitDollarData;

const fg: FormGroup = new FormBuilder().group({
    amountControlValue: 2.5,
    contributionType: "FLAT_AMOUNT",
    name: "Test",
    description: "Test Description",
    products: 0,
    amount: null,
    percentageAmount: null,
});

const mockAccountService = {
    createFlexDollar: (flexDollarObject: FlexDollar, mpGroup: number) => of(flexDollar),
    updateFlexDollar: (flexDollarId: number, flexDollarObject: FlexDollar, mpGroup: number) => of(flexDollar),
};

describe("AddEditOfferingComponent", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let component: AddEditOfferingComponent;
    let fixture: ComponentFixture<AddEditOfferingComponent>;
    let accountService: AccountService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddEditOfferingComponent, ConfigEnabledDirective],
            providers: [
                FormBuilder,
                Configuration,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockDialogData,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        parent: {
                            snapshot: {
                                parent: {
                                    parent: {
                                        params: { mpGroupId: "2" },
                                    },
                                },
                            },
                        },
                    },
                },
            ],
            imports: [NgxsModule.forRoot([SharedState]), HttpClientTestingModule, ReactiveFormsModule, MaterialModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
        accountService = TestBed.inject(AccountService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddEditOfferingComponent);
        component = fixture.componentInstance;
        TestBed.inject(MatDialogRef);
        TestBed.inject(Store);
        jest.resetAllMocks();
        jest.resetModules();
        jest.clearAllMocks();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
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

    describe("setDefaultValues", () => {
        it("should set offering amount to '0.00' for the first time when contribution type is FLAT_AMOUNT", () => {
            component.offeringForm = fg;
            component.amountControlValue = "amountControlValue";
            component.setDefaultValues();
            expect(component.offeringForm.get("amountControlValue").value).toMatch("0.00");
        });

        it("should set offering amount to 0 for the first time when contribution type is not FLAT_AMOUNT", () => {
            component.offeringForm = new FormBuilder().group({
                amountControlValue: "0",
                contributionType: "OTHER",
            });
            component.amountControlValue = "amountControlValue";
            component.setDefaultValues();
            expect(component.offeringForm.get("amountControlValue").value).toEqual(0);
        });
    });

    describe("patchFormValues - currentOffering", () => {
        it("should patch default values if current offering is null", () => {
            component.offeringForm = new FormBuilder().group({
                amountControlValue: null,
                contributionType: null,
                amount: null,
            });
            component.patchFormValues();
            expect(component.offeringForm.get("contributionType").value).toBe(BenefitDollars.FLAT_AMOUNT);
            expect(component.amountTypeVal).toBe(BenefitDollars.FLAT_AMOUNT);
        });

        it("should patch values if current offering is not null and contribution type is FLAT_AMOUNT", () => {
            component.offeringForm = fg;
            component.currentOffering = flexDollar;
            component.patchFormValues();
            expect(component.offeringForm.get("contributionType").value).toBe(BenefitDollars.FLAT_AMOUNT);
            expect(component.offeringForm.get("name").value).toBe("FlexDollarName");
            expect(component.offeringForm.get("description").value).toBe("FlexDollarDesc");
            expect(component.offeringName).toBe("FlexDollarName");
            expect(component.isPercentage).toBeFalsy();
            expect(component.amountTypeVal).toBe(BenefitDollars.FLAT_AMOUNT);
            expect(component.amountControlValue).toBe("amount");
        });

        it("should patch values if current offering is not null and contribution type is not FLAT_AMOUNT", () => {
            component.offeringForm = fg;
            flexDollar.contributionType = ContributionType.PERCENTAGE;
            component.currentOffering = flexDollar;
            component.patchFormValues();
            expect(component.offeringForm.get("percentageAmount").value).toEqual(4.5);
            expect(component.isPercentage).toBeTruthy();
            expect(component.percentageAmount).toEqual(4.5);
            expect(component.amountControlValue).toBe("percentageAmount");
        });

        it("should patch values if current offering is not null and applicableProductId", () => {
            component.offeringForm = fg;
            flexDollar.applicableProductId = 456;
            component.currentOffering = flexDollar;
            component.allProducts = [
                { id: 123, name: "product1", code: "" },
                { id: 456, name: "product2", code: "" },
            ];
            component.patchFormValues();
            expect(component.offeringForm.get("products").value).toEqual(456);
            expect(component.selectedProduct.id).toEqual(456);
            expect(component.selectedProduct.name).toEqual("product2");
        });

        it("should patch values if current offering is not null and applicableProductId not found in product list", () => {
            component.offeringForm = fg;
            flexDollar.applicableProductId = 789;
            component.currentOffering = flexDollar;
            component.allProducts = [
                { id: 123, name: "product1", code: "" },
                { id: 456, name: "product2", code: "" },
            ];
            component.patchFormValues();
            expect(component.offeringForm.get("products").value).toBeUndefined();
        });
    });

    describe("selectProduct()", () => {
        it("should update the product description on selected id", () => {
            component.offeringForm = fg;
            component.languageStrings["primary.portal.dashboard.adminApprovalChecklist.benefitDollars.employerContribution"] =
                "Employer Contribution ";
            component.allProducts = [
                { id: 123, name: "product1", code: "" },
                { id: 456, name: "product2", code: "" },
            ];
            component.selectProduct(456);
            expect(component.offeringForm.controls.name.value).toEqual("Employer Contribution product2");
        });
    });

    describe("createFlexDollar", () => {
        it("should create FelxDollar record with the input provided", (done) => {
            expect.assertions(5);
            component.offeringForm = new FormBuilder().group({
                amountControlValue: 2.5,
                contributionType: "FLAT_AMOUNT",
                name: "Test",
                description: "Test Description",
            });
            component.amountControlValue = "amountControlValue";
            component.createFlexDollar(flexDollar, 5);
            expect(flexDollar.name).toBe("Test");
            expect(flexDollar.applicableProductId).toBe(5);
            expect(flexDollar.description).toBe("Test Description");
            expect(flexDollar.amount).toBe(2.5);
            expect(flexDollar.contributionType).toBe(ContributionType.FLAT_AMOUNT);
            done();
        });

        it("should execute cache block incase of any service error and return error response as '409 ERROR'", (done) => {
            expect.assertions(1);
            component.offeringForm = fg;
            component.languageStrings = {};
            component.languageStrings["primary.portal.benefitsOffering.product.validation"] = "409 ERROR";
            const error = { status: ClientErrorResponseCode.RESP_409 };
            jest.spyOn(accountService, "createFlexDollar").mockReturnValue(throwError(error));
            component.createFlexDollar(flexDollar, Math.random());
            expect(component.errorMessage).toBe("409 ERROR");
            done();
        });

        it("should execute cache block incase of any service error and return error response as '400 ERROR'", (done) => {
            expect.assertions(2);
            component.offeringForm = fg;
            component.languageStrings = {};
            component.languageStrings["primary.portal.qle.addNewQle.badParameter"] = "400 ERROR";
            const error = { status: ClientErrorResponseCode.RESP_400 };
            jest.spyOn(accountService, "createFlexDollar").mockReturnValue(throwError(error));
            component.createFlexDollar(flexDollar, Math.random());
            expect(component.isDuplicateFlexDollar).toBeTruthy();
            expect(component.errorMessage).toBe("400 ERROR");
            done();
        });
    });

    describe("updateOffering", () => {
        it("should update FlexDollar record with the input provided", () => {
            component.offeringForm = new FormBuilder().group({
                id: 7,
                amountControlValue: 3.5,
                contributionType: "FLAT_AMOUNT",
                name: "Updated Test",
                description: "Updated Test Description",
            });
            component.currentOffering = flexDollar;
            component.amountControlValue = "amountControlValue";
            component.updateOffering(flexDollar, 7);
            expect(flexDollar.name).toBe("Updated Test");
            expect(flexDollar.applicableProductId).toBe(7);
            expect(flexDollar.description).toBe("Updated Test Description");
            expect(flexDollar.amount).toBe(3.5);
            expect(flexDollar.contributionType).toBe(ContributionType.FLAT_AMOUNT);
        });

        it("should execute cache block incase of any updateOffering service error and return error response as '400 UPDATE ERROR'", () => {
            component.offeringForm = fg;
            component.languageStrings = {};
            component.languageStrings["primary.portal.qle.addNewQle.badParameter"] = "400 UPDATE ERROR";
            const error = { status: ClientErrorResponseCode.RESP_400 };
            component.currentOffering = flexDollar;
            jest.spyOn(accountService, "updateFlexDollar").mockReturnValue(throwError(error));
            component.updateOffering(flexDollar, Math.random());
            expect(component.isDuplicateFlexDollar).toBeTruthy();
            expect(component.errorMessage).toBe("400 UPDATE ERROR");
        });
    });
    describe("isClassSelected", () => {
        it("should return true if found and greater than or equal to 0", () => {
            const classObject = {
                id: 1,
                name: "name",
            } as ClassNames;
            component.selectedClassList = [{ id: 1, name: "name" }];
            const expected = component.isClassSelected(classObject);

            expect(expected).toBe(true);
        });
    });

    describe("isRegionSelected", () => {
        it("should return true if found and greater than or equal to 0", () => {
            const region = {
                id: 1,
                name: "name",
            } as RegionNames;
            component.selectedClassList = [{ id: 1, name: "name" }];
            const expected = component.isClassSelected(region);

            expect(expected).toBe(true);
        });
    });

    describe("errorHandlingMethod", () => {
        it("should return error message if there is a 409 error", () => {
            component.errorHandlingMethod(409);
            expect(component.isDuplicateFlexDollar).toEqual(true);
            expect(component.errorMessage).toEqual(component.languageStrings["primary.portal.benefitsOffering.product.validation"]);
        });
    });

    describe("removeAllClasses()", () => {
        it("should remove all classes", () => {
            component.selectedClassList = [];
            component.allClasses = [];
            component.removeAllClasses();
            expect(component.isClassChecked).toBeFalsy();
        });
    });

    describe("isClassSelected()", () => {
        it("should check if class is selected", () => {
            const classObject = {
                id: 1,
                name: "class1",
            };
            component.selectedClassList = [
                {
                    id: 2,
                    name: "class2",
                },
                {
                    id: 1,
                    name: "class1",
                },
            ];
            const actual = component.isClassSelected(classObject);
            expect(actual).toBeTruthy();
        });
    });

    describe("isRegionSelected()", () => {
        it("should set true if selected", () => {
            const region = {
                id: 1,
                name: "region1",
                description: "region 1",
                default: true,
                numberOfMembers: 2,
                isselected: true,
            };
            component.selectedRegionList = [
                {
                    id: 1,
                    name: "region1",
                    description: "region 1",
                    default: true,
                    numberOfMembers: 2,
                    isselected: true,
                },
                {
                    id: 2,
                    name: "region2",
                    description: "region 2",
                    default: false,
                    numberOfMembers: 3,
                    isselected: false,
                },
            ];
            const actual = component.isRegionSelected(region);
            expect(actual).toBeTruthy();
        });
    });

    describe("removeAllRegions()", () => {
        it("should remove all regions", () => {
            component.selectedRegionList = [];
            component.allRegions = [];
            component.removeAllRegions();
            expect(component.isRegionChecked).toBeFalsy();
        });
    });
});
