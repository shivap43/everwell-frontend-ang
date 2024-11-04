import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { SkipNonAgPopupComponent } from "./skip-non-ag-popup.component";
import {
    MockMatButtonDirective,
    mockAgRefreshService,
    mockBenefitsOfferingService,
    mockMatDialogRef,
    mockSideNavService,
} from "@empowered/testing";
import { DatePipe } from "@angular/common";
import { BenefitsOfferingService } from "@empowered/api";
import { SideNavService } from "@empowered/ngxs-store";
import { AgRefreshService } from "@empowered/ui";
import { MatMenuModule } from "@angular/material/menu";
import { HttpErrorResponse } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { MatNativeDateModule } from "@angular/material/core";

const data = { mpGroup: 1234, route: {} as ActivatedRoute };
describe("SkipNonAgPopupComponent", () => {
    let component: SkipNonAgPopupComponent;
    let fixture: ComponentFixture<SkipNonAgPopupComponent>;
    let agRefreshService: AgRefreshService;
    let benefitsOfferingService: BenefitsOfferingService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SkipNonAgPopupComponent, MockMatButtonDirective],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                {
                    provide: SideNavService,
                    useValue: mockSideNavService,
                },
                {
                    provide: AgRefreshService,
                    useValue: mockAgRefreshService,
                },
                LanguageService,
                DatePipe,
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, MatMenuModule, MatNativeDateModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SkipNonAgPopupComponent);
        component = fixture.componentInstance;
        agRefreshService = TestBed.inject(AgRefreshService);
        benefitsOfferingService = TestBed.inject(BenefitsOfferingService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should call getPlanChoices and getPlanYear methods with correct parameters", () => {
            const spy1 = jest.spyOn(benefitsOfferingService, "getPlanChoices").mockReturnValue(of([]));
            const spy2 = jest.spyOn(benefitsOfferingService, "getPlanYears").mockReturnValue(of([]));
            component.ngOnInit();
            expect(spy1).toHaveBeenCalledWith(true, false, 1234);
            expect(spy2).toHaveBeenCalledWith(1234, true);
        });
    });

    describe("saveAGOffering()", () => {
        it("should save aflac group offering", () => {
            const spy = jest.spyOn(benefitsOfferingService, "createApprovalRequest");
            component.saveAGOffering();
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(1234);
        });
    });

    describe("displayDefaultError()", () => {
        it("should set spinner loading to false and set error message if error is provided", () => {
            const errorResponse = new HttpErrorResponse({ error: "Test Error", status: 500 });
            const spy = jest.spyOn(agRefreshService, "getDefaultErrorMessageForAg").mockReturnValue("Default error message");
            component.displayDefaultError(errorResponse);
            expect(component.isSpinnerLoading).toBe(false);
            expect(component.errorMessage).toBe("Default error message");
            expect(spy).toHaveBeenCalledWith(errorResponse);
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
