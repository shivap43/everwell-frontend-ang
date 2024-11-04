import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService, MemberService, StaticService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import {
    mockActivatedRoute,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockMemberService,
    mockSharedService,
    mockStaticUtilService,
    mockUserService,
} from "@empowered/testing";
import { UserService } from "@empowered/user";
import { NgxsModule, Store } from "@ngxs/store";
import { CustomerDashboardComponent } from "./customer-dashboard.component";
import { EnrollmentMethodState, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";

const mockRouter = {
    url: "some route",
};
describe("CustomerDashboardComponent", () => {
    let component: CustomerDashboardComponent;
    let fixture: ComponentFixture<CustomerDashboardComponent>;
    let memberService: MemberService;
    let staticService: StaticService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CustomerDashboardComponent],
            providers: [
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                Store,
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: AuthenticationService,
                    useValue: {},
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [NgxsModule.forRoot([SharedState, EnrollmentMethodState]), HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CustomerDashboardComponent);
        component = fixture.componentInstance;
        memberService = TestBed.inject(MemberService);
        staticService = TestBed.inject(StaticService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("checkPermissions()", () => {
        it("should checkPermissions", () => {
            const spy1 = jest.spyOn(component, "addNavigationOptionsAdmin");
            component.checkPermissions();
            expect(spy1).toBeCalledTimes(1);
        });
    });

    describe("fetchMemberDetails()", () => {
        it("should fetchMemberDetails", () => {
            const spy = jest.spyOn(memberService, "getMember");
            component.fetchMemberDetails();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("checkForUnpluggedFeature()", () => {
        it("should call getConfigurations()", () => {
            const spy = jest.spyOn(staticService, "getConfigurations");
            component.checkForUnpluggedFeature();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getScreenWidth()", () => {
        it("should get ScreenWidth$", () => {
            const spy = jest.spyOn(component["screenWidth$"], "next");
            component.getScreenWidth();
            expect(spy).toBeCalledTimes(0);
        });
    });
});
