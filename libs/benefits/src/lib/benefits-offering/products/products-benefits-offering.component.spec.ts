import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterTestingModule } from "@angular/router/testing";
import { NgxsModule } from "@ngxs/store";
import { of, Subject } from "rxjs";
import { AccountService, BenefitsOfferingService, Configuration } from "@empowered/api";
import { ProductsComponent } from "./products.component";
import { mockStaticUtilService } from "@empowered/testing";
import { StaticUtilService, SideNavService, UtilService, ExceptionBusinessService, SharedState } from "@empowered/ngxs-store";
import { MaterialModule } from "@empowered/ui";
import { mockSideNavService, mockUtilService, mockDatePipe, MockReplaceTagPipe } from "@empowered/testing";
import { DatePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";

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
const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;
@Directive({
    selector: "[language]",
})
class MockLanguageDirective {
    @Input() language!: string;

    transform(value: any): string {
        return value;
    }
}
describe("ProductsComponent", () => {
    let component: ProductsComponent;
    let exceptionBusinessService: ExceptionBusinessService;
    let accountService: AccountService;
    let staticUtilService: StaticUtilService;
    let fixture: ComponentFixture<ProductsComponent>;
    let unsubscribe$: Subject<void>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProductsComponent, MockReplaceTagPipe, MockLanguageDirective],
            providers: [
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: SideNavService,
                    useValue: mockSideNavService,
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
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                BenefitsOfferingService,
                Configuration,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [NgxsModule.forRoot([SharedState]), HttpClientTestingModule, ReactiveFormsModule, RouterTestingModule, MaterialModule],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(ProductsComponent);
        component = fixture.componentInstance;
        exceptionBusinessService = TestBed.inject(ExceptionBusinessService);
        accountService = TestBed.inject(AccountService);
        staticUtilService = TestBed.inject(StaticUtilService);
    });
    it("should create", () => {
        expect(component).toBeTruthy();
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
        it("should call handleMissingTaxId", () => {
            component.disabled = true;
            component.isTaxIdFeatureEnabled = true;
            jest.spyOn(component, "handleMissingTaxId").mockReturnValue(true);
        });
    });
    describe("checkTaxIdAvailable()", () => {
        it("should return true if taxId not there in account", () => {
            const rxjs = jest.requireActual("rxjs");
            jest.spyOn(rxjs, "combineLatest").mockReturnValue(of([true, MOCK_NOTEXIST_TAX_DATA]));
            component.checkTaxIdAvailable();
            expect(component.isTaxIdAvailable).toBeTruthy();
        });
        it("should return false if taxId is there in account", () => {
            const rxjs = jest.requireActual("rxjs");
            jest.spyOn(rxjs, "combineLatest").mockReturnValue(of([true, MOCK_EXIST_TAX_DATA]));
            component.checkTaxIdAvailable();
            expect(component.isTaxIdAvailable).toBeFalsy();
        });
        it("should return isTaxIdFeatureEnabled true if feature flag is true", () => {
            component.isTaxIdFeatureEnabled = false;
            const rxjs = jest.requireActual("rxjs");
            jest.spyOn(rxjs, "combineLatest").mockReturnValue(of([true, MOCK_EXIST_TAX_DATA]));
            component.checkTaxIdAvailable();
            expect(component.isTaxIdFeatureEnabled).toBeTruthy();
        });
        it("should return isTaxIdFeatureEnabled false if feature flag is false", () => {
            component.isTaxIdFeatureEnabled = true;
            const rxjs = jest.requireActual("rxjs");
            jest.spyOn(rxjs, "combineLatest").mockReturnValue(of([false, MOCK_EXIST_TAX_DATA]));
            component.checkTaxIdAvailable();
            expect(component.isTaxIdFeatureEnabled).toBeFalsy();
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
    describe("handleMissingTaxId()", () => {
        it("should return true if ABS Dental plan and account has no tax id", () => {
            component.isTaxIdFeatureEnabled = true;
            const row = {
                carrier: ["Aflac"],
                carrierId: [70, 70, 1, 1],
                disabled: [true, true, false, false],
                displayOrder: 28,
                group: false,
                groupEligibility: true,
                id: 13,
                individual: undefined,
                individualEligibility: false,
                name: "Dental",
                valueAddedService: false,
            };
            expect(component.handleMissingTaxId(row, "group")).toBeTruthy();
        });
        it("should return false if not ABS dental vision plan", () => {
            component.isTaxIdFeatureEnabled = true;
            const row = {
                carrier: ["Aflac"],
                carrierId: [1, 1, 1, 1],
                disabled: [false, false, false, false],
                displayOrder: 28,
                group: false,
                groupEligibility: true,
                id: 10,
                individual: undefined,
                individualEligibility: false,
                name: "Hospital",
                valueAddedService: false,
            };
            expect(component.handleMissingTaxId(row, "group")).toBeFalsy();
        });
        it("should return false if feature flag not enabled and value added service true", () => {
            component.isTaxIdFeatureEnabled = false;
            const row = {
                valueAddedService: false,
            };
            expect(component.handleMissingTaxId(row, "group")).toBeFalsy();
        });
    });
});
