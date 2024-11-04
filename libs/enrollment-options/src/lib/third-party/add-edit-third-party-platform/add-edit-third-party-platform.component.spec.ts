import { DatePipe } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Pipe, PipeTransform, TemplateRef, CUSTOM_ELEMENTS_SCHEMA, Directive, Input, Component, NO_ERRORS_SCHEMA } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { AccountService, BenefitsOfferingService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { of } from "rxjs";
import { UserService } from "@empowered/user";
import { AddEditThirdPartyPlatformComponent } from "./add-edit-third-party-platform.component";
import { ComponentType } from "@angular/cdk/portal";
import { parseISO } from "date-fns";
import { TPIRestrictionsForHQAccountsService, EmpoweredModalService } from "@empowered/common-services";
import { StaticUtilService } from "@empowered/ngxs-store";
import { MatDatepicker } from "@angular/material/datepicker";

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

const mockDialogData = {
    allThirdPartyPlatforms: [],
    accountWiseThirdPartyPlatforms: "",
    mpGroup: 12345,
    type: "hhh",
    isDataFound: false,
    importType: "AFLAC",
    id: 1,
};
const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as MatDialog;

const mockStore = {
    dispatch: () => {},
    selectSnapshot: () => of(""),
};

const mockUserService = {
    portal$: of("producer"),
} as UserService;

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
} as LanguageService;

@Pipe({
    name: "[DatePipe]",
})
class MockDatePipe implements PipeTransform {
    transform(value: any): string {
        return `${value}`;
    }
}
const mockDatePipe = new MockDatePipe();

const mockStaticUtil = {
    cacheConfigValue: () => of("some config string"),
};

const mockTPIRestrictionsForHQAccountsService = {
    canAccessTPIRestrictedModuleInHQAccount: () => of(false),
} as TPIRestrictionsForHQAccountsService;

const mockEmpoweredModalService = {
    openDialog: (componentOrTemplateRef: ComponentType<any> | TemplateRef<any>, config?: MatDialogConfig<any>, refocus?: HTMLElement) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as EmpoweredModalService;

const mockBenefitsOfferingService = {
    getPlanYears: (mpGroup: number, useUnapproved: boolean, inOpenEnrollment?: boolean) => of([]),
    getApprovalRequests: (mpGroup: number, includeNotSubmitted: boolean = false) => of([]),
} as BenefitsOfferingService;

@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}

@Component({
    selector: "mat-datepicker",
    template: "",
})
class MockMatDatepickerComponent {}

describe("AddEditThirdPartyPlatformComponent", () => {
    let component: AddEditThirdPartyPlatformComponent;
    let fixture: ComponentFixture<AddEditThirdPartyPlatformComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddEditThirdPartyPlatformComponent, MockMatDatepickerComponent, MockMatDatePickerDirective],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockDialogData,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                FormBuilder,
                { provide: DatePipe, useValue: mockDatePipe },
                { provide: StaticUtilService, useValue: mockStaticUtil },
                {
                    provide: TPIRestrictionsForHQAccountsService,
                    useValue: mockTPIRestrictionsForHQAccountsService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddEditThirdPartyPlatformComponent);
        component = fixture.componentInstance;
        component.data.allThirdPartyPlatforms = [
            {
                id: 2,
                name: "ABC Corp",
                aflacGroupEnrollmentAllowed: false,
            },
            {
                id: 14,
                name: "Aflac HR System",
                aflacGroupEnrollmentAllowed: false,
            },
            {
                id: 8,
                name: "AflacAtWork (Selerix)",
                aflacGroupEnrollmentAllowed: true,
            },
            {
                id: 11,
                name: "Ease",
                aflacGroupEnrollmentAllowed: false,
            },
            {
                id: 12,
                name: "Employee Navigator",
                aflacGroupEnrollmentAllowed: true,
            },
            {
                id: 15,
                name: "iEnrollsolutions",
                aflacGroupEnrollmentAllowed: false,
            },
            {
                id: 10,
                name: "Lab Integration Partner",
                aflacGroupEnrollmentAllowed: true,
            },
            {
                id: 3,
                name: "Visual Enrollments (Falcon)",
                aflacGroupEnrollmentAllowed: true,
            },
        ];
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("differenceBetweenDates()", () => {
        it("should give difference between two dates", () => {
            expect(component.differenceBetweenDates(parseISO("2022-04-15"), parseISO("2022-04-10"))).toBe(5);
        });
    });

    describe("compareDateForAdjacentOrOverlap()", () => {
        it("should compare dates to check if they overlap", () => {
            expect(component.compareDateForAdjacentOrOverlap(parseISO("2022-04-15"), parseISO("2022-04-10"))).toBe(5);
        });

        it("should compare dates to check if do not overlap", () => {
            expect(component.compareDateForAdjacentOrOverlap(parseISO("2022-04-15"), parseISO("2022-04-15"))).toBe(0);
        });

        it("should compare dates to check if overlap is the adjacent date", () => {
            expect(component.compareDateForAdjacentOrOverlap(parseISO("2022-04-15"), parseISO("2022-04-16"))).toBe(1);
        });
    });

    describe("getTPPName()", () => {
        it("should return TPP's name corresponding to input id if found", () => {
            expect(component.getTPPName(11)).toBe("Ease");
        });
        it("should return '' if TPP with input id is not found", () => {
            expect(component.getTPPName(111)).toBe("");
        });
    });

    describe("checkForAdjacentDates()", () => {
        beforeEach(() => {
            component.data.accountWiseThirdPartyPlatforms = [
                {
                    id: 19878,
                    validity: {
                        effectiveStarting: "2023-03-09",
                        expiresAfter: "2023-03-15",
                    },
                    thirdPartyPlatform: {
                        id: 8,
                        name: "AflacAtWork (Selerix)",
                        aflacGroupEnrollmentAllowed: true,
                    },
                },
            ];
        });

        it("should identify adjacent overlaps", () => {
            component.addThirdPartyPlatformForm.setValue({
                thirdPartyPlatform: component.data.allThirdPartyPlatforms[2].id,
                startDate: "2023-03-16",
                endDate: "2023-03-18",
            });
            component.checkForAdjacentDates(
                {
                    effectiveStarting: component.addThirdPartyPlatformForm.value.startDate,
                    expiresAfter: component.addThirdPartyPlatformForm.value.endDate,
                },
                null,
            );
            expect(component.data.isAdjacent).toBe(true);
        });

        it("should call checkIfOverlap if adjacent overlap is not found", () => {
            const spy = jest.spyOn(component, "checkIfOverlap");
            component.checkForAdjacentDates(
                {
                    effectiveStarting: "2023-03-20",
                },
                null,
            );
            expect(spy).toBeCalled();
        });
    });

    describe("convertDate()", () => {
        it("should return start and end dates in mm/dd/yyyy format", () => {
            expect(component.convertDate("2022-01-01", "2023-01-01", "duplicatePopup").startDate).toBe("01/01/2022");
            expect(component.convertDate("2022-01-01", "2023-01-01", "duplicatePopup").endDate).toBe("01/01/2023");
        });
    });
});
