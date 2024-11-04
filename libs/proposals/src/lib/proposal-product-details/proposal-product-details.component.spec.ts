import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterTestingModule } from "@angular/router/testing";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { Subscription } from "rxjs";
import { ProposalProductDetailsComponent } from "./proposal-product-details.component";
import { mockLanguageService, mockStaticUtilService, mockUtilService } from "@empowered/testing";
import { StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { MaterialModule } from "@empowered/ui";
import { of } from "rxjs";
import { AccountService } from "@empowered/api";
const mockProductSubscription = {
    unsubscribe: () => {},
} as Subscription;

const mockAccountService = {
    getGroupAttributesByName: (groupAttributeNames: string[], mpGroup?: number) =>
        of([
            {
                id: 989898,
                attribute: "some attribute",
                value: "",
            },
        ]),
} as AccountService;
const MOCK_NOTEXIST_TAX_DATA = [
    {
        id: 123,
        attribute: "tax_id",
        value: "",
    },
    {
        id: 456,
        attribute: "tax_id",
        value: "",
    },
];
const MOCK_EXIST_TAX_DATA = [
    {
        id: 123,
        attribute: "tax_id",
        value: "678923",
    },
    {
        id: 456,
        attribute: "tax_id",
        value: "678901",
    },
];
describe("ProposalProductDetailsComponent", () => {
    let component: ProposalProductDetailsComponent;
    let accountService: AccountService;
    let staticUtilService: StaticUtilService;
    let fixture: ComponentFixture<ProposalProductDetailsComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProposalProductDetailsComponent],
            providers: [
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Subscription,
                    useValue: mockProductSubscription,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule, RouterTestingModule, MaterialModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ProposalProductDetailsComponent);
        component = fixture.componentInstance;
        component.productSubscription = TestBed.inject(Subscription);
        accountService = TestBed.inject(AccountService);
        staticUtilService = TestBed.inject(StaticUtilService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onInvalidTraversal()", () => {
        it("should set isError to true", () => {
            expect(component.isError).toBeFalsy();
            component.onInvalidTraversal();
            expect(component.isError).toBeTruthy();
        });
    });

    describe("isDisabled()", () => {
        it("should return true if vas and disabled is true", () => {
            component.disabled = true;
            expect(component.isDisabled({ displayOrder: 1, valueAddedService: true })).toBe(true);
        });
        it("should return false if it does not satisfy the condition", () => {
            expect(component.isDisabled({ displayOrder: 1, valueAddedService: false })).toBe(false);
        });
    });

    describe("aloneVasGroup()", () => {
        it("should update VAS group eligible products", () => {
            component.productsView = [{ groupEligibility: true }, { groupEligibility: true }];
            component.aloneVasGroup();
            expect(component.vasGroupEligible).toBe(true);
        });
    });

    describe("checkEligibility()", () => {
        it("should return true as product choices related to that product exist", () => {
            component.productChoice = [
                { id: 1, individual: false },
                { id: 2, individual: true },
            ];
            expect(component.checkEligibility(2, "individual")).toBe(true);
        });

        it("should return false as product choices related to that product do not exist", () => {
            component.productChoice = [
                { id: 1, individual: false },
                { id: 2, individual: true },
            ];
            expect(component.checkEligibility(3, "individual")).toBe(false);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const spy = jest.spyOn(component.productSubscription, "unsubscribe");
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalled();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });

    describe("checkTaxIdAvailable()", () => {
        it("should return true if taxId not there in account", () => {
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
            const spy2 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of(MOCK_NOTEXIST_TAX_DATA));
            component.checkTaxIdAvailable();
            expect(component.isTaxIdAvailable).toBeTruthy();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
        it("should return false if taxId is there in account", () => {
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
            const spy2 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of(MOCK_EXIST_TAX_DATA));
            component.checkTaxIdAvailable();
            expect(component.isTaxIdAvailable).toBeFalsy();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
        it("should return isTaxIdFeatureEnabled false if feature flag is false", () => {
            component.isTaxIdFeatureEnabled = true;
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(false));
            const spy2 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of(MOCK_EXIST_TAX_DATA));
            component.checkTaxIdAvailable();
            expect(component.isTaxIdFeatureEnabled).toBeFalsy();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
        it("should return isTaxIdFeatureEnabled true if feature flag is true", () => {
            component.isTaxIdFeatureEnabled = false;
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
            const spy2 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of(MOCK_EXIST_TAX_DATA));
            component.checkTaxIdAvailable();
            expect(component.isTaxIdFeatureEnabled).toBeTruthy();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
    });
});
