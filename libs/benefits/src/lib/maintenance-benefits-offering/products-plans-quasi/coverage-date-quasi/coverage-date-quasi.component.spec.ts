import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { CoverageDateQuasiComponent } from "./coverage-date-quasi.component";
import { DatePipe } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AuthenticationService, BenefitsOfferingService, Configuration } from "@empowered/api";
import { of, Subscription } from "rxjs";
import { AccountsBusinessService } from "@empowered/common-services";
import { mockBenefitsOfferingService, MockReplaceTagPipe } from "@empowered/testing";
import { MatDatepickerModule } from "@angular/material/datepicker";
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

describe("CoverageDateQuasiComponent", () => {
    let component: CoverageDateQuasiComponent;
    let fixture: ComponentFixture<CoverageDateQuasiComponent>;
    let benefitsOfferingService: BenefitsOfferingService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CoverageDateQuasiComponent, MockFocusOnFirstInvalidFieldDirective, MockReplaceTagPipe, MockRichTooltipDirective],
            providers: [
                LanguageService,
                DatePipe,
                {
                    provide: MatDialog,
                    useValue: {},
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                AccountsBusinessService,
                AuthenticationService,
                Configuration,
                BenefitsOfferingService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [
                NgxsModule.forRoot(),
                HttpClientTestingModule,
                RouterTestingModule,
                ReactiveFormsModule,
                MatDatepickerModule,
                StoreModule.forRoot({}),
            ],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(CoverageDateQuasiComponent);
        component = fixture.componentInstance;
        benefitsOfferingService = TestBed.inject(BenefitsOfferingService);
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("firstDateFilter()", () => {
        it("should return true if date equals to 1", () => {
            expect(component.firstDateFilter(new Date("1-1-2023"))).toBe(true);
        });
        it("should return false if date does not equal to 1", () => {
            expect(component.firstDateFilter(new Date("5-2-2023"))).toBe(false);
        });
    });
    describe("ngOnDestroy()", () => {
        it("should call setCoverageContiguousDates() of benefitsOfferingService", () => {
            const spy = jest.spyOn(benefitsOfferingService, "setCoverageContiguousDates");
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalledWith(null);
        });
        it("should cleanup subscriptions", () => {
            const spy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [of(null).subscribe()];
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalled();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
