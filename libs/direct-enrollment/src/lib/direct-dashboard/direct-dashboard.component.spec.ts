import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { of } from "rxjs";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { ComponentType } from "@angular/cdk/portal";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DirectDashboardComponent } from "./direct-dashboard.component";
import { ActivatedRoute, Router } from "@angular/router";
import { MonSideNavList } from "@empowered/api";
import { RouterTestingModule } from "@angular/router/testing";

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
} as LanguageService;

const mockRouter = {
    url: "some route",
    navigate: (url: string) => {},
};
@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}
const mockStore = {
    selectSnapshot: () => of(""),
    select: () => of(""),
    dispatch: () => of(""),
} as unknown as Store;

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () =>
                of({
                    mpGroup: 98654,
                }),
        } as MatDialogRef<any>),
} as MatDialog;

@Component({
    selector: "empowered-generic-sidenav",
    template: "",
})
class MockEmpoweredGenericSidenavComponent {
    @Input() navigationOptions!: MonSideNavList[];
    @Input() enableBackToPreviousListing!: boolean;
    @Input() previousListName!: string;
}

@Component({
    selector: "router-outlet",
    template: "",
})
class MockRouterOutletComponent {}

describe("DirectDashboardComponent", () => {
    let component: DirectDashboardComponent;
    let fixture: ComponentFixture<DirectDashboardComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
            declarations: [
                DirectDashboardComponent,
                MockEmpoweredGenericSidenavComponent,
                MockRouterOutletComponent,
                MockMonSpinnerComponent,
            ],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },

                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            queryParams: {
                                producerId: "15478",
                            },
                        },
                    },
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();

        router = TestBed.inject(Router);
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(DirectDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        jest.clearAllMocks();
    });

    describe("DirectDashboardComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("goToScheduleSend()", () => {
        it("should navigate to schedule-send page", () => {
            const navigateSpy = jest.spyOn(router, "navigate");
            component.goToScheduleSend();
            expect(navigateSpy).toBeCalledTimes(1);
        });
    });
    describe("goToReports()", () => {
        it("should navigate to reports page", () => {
            const navigateSpy = jest.spyOn(router, "navigate");
            component.goToReports();
            expect(navigateSpy).toBeCalledTimes(1);
        });
    });
    describe("goToCommissions()", () => {
        it("should navigate to commissions page", () => {
            const navigateSpy = jest.spyOn(router, "navigate");
            component.goToCommissions();
            expect(navigateSpy).toBeCalledTimes(1);
        });
    });
    describe("goToPendingEnrollments()", () => {
        it("should navigate to pending enrollments page on click of sidenav option 'Pending Enrollments'", () => {
            const navigateSpy = jest.spyOn(router, "navigate");
            component.goToPendingEnrollments();
            expect(navigateSpy).toBeCalledTimes(1);
        });
    });
    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
