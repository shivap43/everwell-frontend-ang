import { ComponentType } from "@angular/cdk/portal";
import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AccountService, AuthenticationService, Configuration } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { parseISO } from "date-fns";
import { of } from "rxjs";
import { EditPlanYearComponent } from "./edit-plan-year.component";
import { AccountsBusinessService } from "@empowered/common-services";
import { StaticUtilService } from "@empowered/ngxs-store";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MockReplaceTagPipe, mockDatePipe } from "@empowered/testing";
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
const mockMatDialogRef = { close: () => {} };
const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as MatDialog;

const mockStaticUtilService = {
    cacheConfigEnabled: (configName: string) => of(true),
    cacheConfigValue: (configName: string) => of("some-config-value"),
    hasPermission: (permission: string) => of(true),
} as StaticUtilService;

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

const data = {
    isActive: false,
    isQ60Selected: false,
    mpGroup: "111554",
    openMode: "edit",
    planYear: {
        approvalStatus: "APPROVED",
        enrollAndCoverageEditable: true,
        enrollmentEditable: false,
        pendingApprovalContent: "<b>Not ready for enrollment</b><br>Pending admin approval of plan year",
        planYearDetails: {
            activeEnrollments: false,
            coveragePeriod: {
                effectiveStarting: "2022-08-01",
                expiresAfter: "2023-07-31",
            },
            enrollmentPeriod: {
                effectiveStarting: "2022-07-28",
                expiresAfter: "2022-07-31",
            },
            id: 1,
            locked: false,
            name: "PY",
            type: "AFLAC_INDIVIDUAL",
        },
        planYearEditable: true,
        removablePlan: false,
    },
    plans: [
        {
            agentAssisted: true,
            continuous: false,
            expirationDate: "2023-07-31",
            id: 1,
            plan: {
                adminName: "Aflac Accident Indemnity Advantage | Option 1 | HCR",
                carrierId: 1,
                carrierNameOverride: "Aflac",
                characteristics: [],
                dependentPlanIds: [],
                description: "Aflac Accident Indemnity Advantage | 24-Hour Accident-Only Insurance | Option 1 | HCR",
                displayOrder: 100,
                enrollable: true,
                id: 1505,
                mutuallyExclusivePlanIds: [1068, 1069, 1070, 1071, 1072, 1073, 1227, 1228, 1229, 1230, 7070],
                name: "Aflac Plus Rider",
                policyOwnershipType: "INDIVIDUAL",
                policySeries: "CIRIDER",
                pricingEditable: false,
                pricingModel: "UNIVERSAL",
                productId: 1,
                rider: true,
            },
            planYearId: 1,
            taxStatus: "PRETAX",
        },
    ],
};
@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}
describe("EditPlanYearComponent", () => {
    let component: EditPlanYearComponent;
    let fixture: ComponentFixture<EditPlanYearComponent>;
    let accountService: AccountService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EditPlanYearComponent, MockReplaceTagPipe, MockRichTooltipDirective],
            imports: [
                NgxsModule.forRoot(),
                HttpClientTestingModule,
                ReactiveFormsModule,
                MatDatepickerModule,
                MatNativeDateModule,
                StoreModule.forRoot({}),
            ],
            providers: [
                FormBuilder,
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                AccountsBusinessService,
                AuthenticationService,
                Configuration,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditPlanYearComponent);
        accountService = TestBed.inject(AccountService);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getCafeteriaPlanDates()", () => {
        it("should get cafeteria plan dates", () => {
            const spy = jest.spyOn(accountService, "getGroupAttributesByName");
            component.getCafeteriaPlanDates();
            expect(spy).toBeCalledTimes(2);
        });
    });

    describe("checkForEnrollmentDates()", () => {
        it("should check for the enrollment dates and check if enrollment end date is valid", () => {
            const endDate = parseISO("1985-04-13");
            const startDate = parseISO("1985-04-12");
            component.checkForEnrollmentDates(startDate, endDate, true);
            expect(component.editPlanYearForm.get("enrollmentEndDate").errors).toBe(null);
        });

        it("should check for the enrollment dates and check if enrollment start date is valid", () => {
            const endDate = parseISO("1985-04-13");
            const startDate = parseISO("1985-04-12");
            component.checkForEnrollmentDates(startDate, endDate, false);
            expect(component.editPlanYearForm.get("enrollmentStartDate").errors).toBe(null);
        });
    });

    describe("populateCoverageEndDateForEditPlan()", () => {
        it("should check for the enrollment dates and disable coverage end date", () => {
            component.editPlanYearForm.get("coverageEndDate").enable();
            expect(component.editPlanYearForm.get("coverageEndDate").disabled).toBe(false);
            component.formLoaded = true;
            component.isRole20User = false;
            component.populateCoverageEndDateForEditPlan(true);
            expect(component.editPlanYearForm.get("coverageEndDate").disabled).toBe(true);
        });

        it("should check for the enrollment dates and enable coverage end date", () => {
            component.formLoaded = true;
            component.isRole20User = true;
            component.populateCoverageEndDateForEditPlan(true);
            expect(component.editPlanYearForm.get("coverageEndDate").enabled).toBe(true);
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
});
