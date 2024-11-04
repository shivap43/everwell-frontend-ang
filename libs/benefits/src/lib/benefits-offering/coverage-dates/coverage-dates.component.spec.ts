import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { AccountService, AuthenticationService, BenefitsOfferingService, Configuration } from "@empowered/api";
import { BenefitOfferingHelperService } from "@empowered/benefits";
import { AccountsBusinessService, EmpoweredModalService, SharedService } from "@empowered/common-services";
import { DateService } from "@empowered/date";
import { LanguageService } from "@empowered/language";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { ExceptionBusinessService, SideNavService, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import {
    MockReplaceTagPipe,
    mockAccountService,
    mockBenefitOfferingHelperService,
    mockBenefitsOfferingService,
    mockDatePipe,
    mockDateService,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockSharedService,
    mockSideNavService,
    mockStaticUtilService,
    mockUtilService,
} from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { CoverageDatesComponent } from "./coverage-dates.component";
import { PlanYear, PlanYearType } from "@empowered/constants";
import { of } from "rxjs";
import { StoreModule } from "@ngrx/store";

@Directive({
    selector: "[empoweredFocusOnFirstInvalidField]",
})
class MockFocusOnFirstInvalidFieldDirective {
    @Input("empoweredFocusOnFirstInvalidField") queryString: string;
}

@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("CoverageDatesComponent", () => {
    let component: CoverageDatesComponent;
    let fixture: ComponentFixture<CoverageDatesComponent>;
    let benefitsOfferingService: BenefitsOfferingService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CoverageDatesComponent, MockFocusOnFirstInvalidFieldDirective, MockRichTooltipDirective, MockReplaceTagPipe],
            providers: [
                FormBuilder,
                AccountsBusinessService,
                AuthenticationService,
                Configuration,
                ExceptionBusinessService,
                {
                    provide: SideNavService,
                    useValue: mockSideNavService,
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: BenefitOfferingHelperService,
                    useValue: mockBenefitOfferingHelperService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: DateService,
                    useValue: mockDateService,
                },
            ],
            imports: [HttpClientTestingModule, ReactiveFormsModule, NgxsModule.forRoot([]),StoreModule.forRoot({})],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CoverageDatesComponent);
        component = fixture.componentInstance;
        benefitsOfferingService = TestBed.inject(BenefitsOfferingService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getPlanYears", () => {
        it("should call benefitsOfferingService getPlanYears api when getPlanYears method is called", () => {
            const spy1 = jest.spyOn(benefitsOfferingService, "getPlanYears");
            component.getPlanYears();
            expect(spy1).toBeCalledTimes(1);
        });

        it("should not set plan year id when samePlanYearflag is false and getPlanYears method is called", () => {
            const spy1 = jest.spyOn(benefitsOfferingService, "getPlanYears").mockReturnValue(
                of([
                    {
                        id: 1,
                        name: "PY1",
                    } as PlanYear,
                ]),
            );
            component.samePlanYearflag = false;
            component.getPlanYears();
            expect(component.planYearId).toBe(undefined);
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
