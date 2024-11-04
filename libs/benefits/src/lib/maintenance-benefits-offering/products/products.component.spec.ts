import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { ProductsComponent } from "./products.component";
import { MatDialog } from "@angular/material/dialog";
import { mockMatDialog, mockMatBottomSheet } from "@empowered/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { ActivatedRoute } from "@angular/router";
import { ProductsPlansQuasiService } from "../products-plans-quasi";
import { MatSelect } from "@angular/material/select";
import { EmpoweredSheetService } from "@empowered/common-services";
import { PlanYearType, TaxStatus } from "@empowered/constants";
import { TextFieldModule } from "@angular/cdk/text-field";
import { MatTableModule } from "@angular/material/table";
import { MatMenuModule } from "@angular/material/menu";
import { StoreModule } from "@ngrx/store";

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Directive({
    selector: "[hasAnyPermission]",
})
class MockHasAnyPermissionDirective {
    @Input("hasAnyPermission") permission: string;
}
@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}
@Directive({
    selector: "[isRestricted]",
})
class MockIsRestrictedDirective {
    @Input() isRestricted;
}

describe("ProductsComponent", () => {
    let component: ProductsComponent;
    let fixture: ComponentFixture<ProductsComponent>;
    const availabilityFilterRef = {
        close: () => {},
    } as MatSelect;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ProductsComponent,
                MockHasPermissionDirective,
                MockHasAnyPermissionDirective,
                MockRichTooltipDirective,
                MockIsRestrictedDirective,
            ],
            providers: [
                LanguageService,
                DatePipe,
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MatBottomSheet,
                    useValue: mockMatBottomSheet,
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
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [
                NgxsModule.forRoot(),
                TextFieldModule,
                MatTableModule,
                MatMenuModule,
                HttpClientTestingModule,
                RouterTestingModule,
                ReactiveFormsModule,
                StoreModule.forRoot({})
            ],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(ProductsComponent);
        component = fixture.componentInstance;
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("resetPanelProducts()", () => {
        it("should call resetQuasiObservableValues() from quasi service", () => {
            const spy = jest.spyOn(ProductsPlansQuasiService.prototype, "resetQuasiObservableValues");
            component.resetPanelProducts();
            expect(spy).toBeCalledTimes(1);
        });
        it("should call resetQuasiStoreValues() from quasi service", () => {
            const spy = jest.spyOn(ProductsPlansQuasiService.prototype, "resetQuasiStoreValues");
            component.resetPanelProducts();
            expect(spy).toBeCalledTimes(1);
        });
        it("should call reinitiateServiceCalls()", () => {
            const spy = jest.spyOn(ProductsComponent.prototype, "reinitiateServiceCalls");
            component.resetPanelProducts();
            expect(spy).toBeCalledTimes(1);
        });
    });
    describe("getCredential()", () => {
        it("should assign the display columns if user is admin", () => {
            component.isAdmin = true;
            const productDisplayedColumns = ["plan", "states", "preTax", "agentAssistance", "EnrollmentDetails", "pricing"];
            component.getCredential();
            expect(component.productDisplayedColumns).toEqual(productDisplayedColumns);
        });
        it("should assign the display columns if user is not admin", () => {
            component.isAdmin = false;
            const productDisplayedColumns = [
                "plan",
                "states",
                "preTax",
                "agentAssistance",
                "EnrollmentDetails",
                "pricing",
                "status",
                "manage",
            ];
            component.getCredential();
            expect(component.productDisplayedColumns).toEqual(productDisplayedColumns);
        });
    });
    describe("closeFilters()", () => {
        it("should check for availability filter and close", () => {
            component.availabilityFilterRef = availabilityFilterRef;
            const spy = jest.spyOn(availabilityFilterRef, "close");
            component.closeFilters();
            expect(spy).toHaveBeenCalled();
        });
        it("should check for status filter and close", () => {
            component.availabilityFilterRef = undefined;
            component.statusFilterRef = availabilityFilterRef;
            const spy = jest.spyOn(availabilityFilterRef, "close");
            component.closeFilters();
            expect(spy).toHaveBeenCalled();
        });
    });
    describe("viewAGPrices", () => {
        it("should open view ag prices quasi model", () => {
            const spy = jest.spyOn(EmpoweredSheetService.prototype, "openSheet");
            const planChoice = {
                id: 20,
                planId: 30,
                taxStatus: TaxStatus.PRETAX,
                agentAssisted: true,
            };
            const planYear = {
                type: PlanYearType.AFLAC_GROUP,
                name: "Sample name",
                coveragePeriod: {
                    effectiveStarting: "Sample string",
                },
                enrollmentPeriod: {
                    effectiveStarting: "Sample String",
                },
            };
            component.viewAGPrices(planChoice, planYear);
            expect(spy).toHaveBeenCalled();
        });
    });
    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
