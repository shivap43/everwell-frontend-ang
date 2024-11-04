import { DualPlanYearState, SharedState } from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Configuration, StaticService } from "@empowered/api";
import { EmpoweredModalService } from "@empowered/common-services";
import { mockDatePipe, mockMatDialog, mockRouter, MockPayrollFrequencyCalculatorPipe } from "@empowered/testing";
import { MaterialModule, PayrollFrequencyCalculatorPipe } from "@empowered/ui";
import { NgxsModule, Store } from "@ngxs/store";
import { CoverageTabComponent } from "./coverage-tab.component";

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Pipe({
    name: "aflacLegalName",
})
class MockAflacLegalNamePipe implements PipeTransform {
    transform(value: string): string {
        return "legal name";
    }
}

describe("CoverageTabComponent", () => {
    let component: CoverageTabComponent;
    let fixture: ComponentFixture<CoverageTabComponent>;
    let store: Store;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CoverageTabComponent, MockHasPermissionDirective, MockAflacLegalNamePipe, MockPayrollFrequencyCalculatorPipe],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([DualPlanYearState, SharedState]), MaterialModule],
            providers: [
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                { provide: PayrollFrequencyCalculatorPipe, useValue: MockPayrollFrequencyCalculatorPipe },
                EmpoweredModalService,
                StaticService,
                Configuration,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CoverageTabComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            dualPlanYear: {
                oeDualPlanYear: { id: 1 },
                isDualPlanYear: false,
                planYearsData: [],
            },
        });
    });

    describe("CoverageTabComponent", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("showPlanDetailsPopup()", () => {
        it("should open plan detail component popup", () => {
            component.userData = {
                contact: {
                    address: {
                        state: "CA",
                    },
                },
            };
            const plan = {
                id: 1,
                name: "Dental matrix",
                policyOwnershipType: null,
            };
            component.showPlanDetailsPopup(plan);
        });
    });
});
