import { BreakpointObserver } from "@angular/cdk/layout";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { ProducerService } from "@empowered/api";
import { StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { mockProducerService, mockStaticUtilService, mockStore, mockUserService, mockUtilService } from "@empowered/testing";
import { UserService } from "@empowered/user";
import { NgxsModule, Store } from "@ngxs/store";
import { of, Subscription } from "rxjs";
import { RouteInterceptorService } from "@empowered/common-services";
import { HeaderNavComponent } from "./header-nav.component";

const mockRouterInterceptorService = {
    currentRoute$: of(null),
};

describe.skip("HeaderNavComponent", () => {
    let component: HeaderNavComponent;
    let fixture: ComponentFixture<HeaderNavComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HeaderNavComponent],
            imports: [RouterTestingModule, NgxsModule.forRoot([])],
            providers: [
                {
                    provide: RouteInterceptorService,
                    useValue: mockRouterInterceptorService,
                },
                BreakpointObserver,
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: ProducerService,
                    useValue: mockProducerService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HeaderNavComponent);
        component = fixture.componentInstance;
        component.menuItems = component.navItems = [
            { name: "overview", lang: "primary.portal.primaryNav.overview", config: true, permission: true },
            {
                name: "payroll",
                lang: "primary.portal.primaryNav.payroll",
                config: true,
                permission: true,
                otherRoutes: ["member"],
            },
            { name: "direct", lang: "primary.portal.primaryNav.direct", config: true, permission: true },
            { name: "team", lang: "primary.portal.primaryNav.team", config: true, permission: true },
        ];
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("sortMenuItems", () => {
        it("should sort items in ascending order of name", () => {
            component.sortMenuItems();
            expect(component.menuItems[0].name).toBe("direct");
            expect(component.menuItems[3].name).toBe("team");
        });
    });

    describe("isMenuActive", () => {
        it("should return whether the current route matches one of the menu items", () => {
            component.currentRoute = "direct";
            expect(component.isMenuActive()).toBe(true);

            component.currentRoute = "quick-quotes";
            expect(component.isMenuActive()).toBe(false);
        });
    });

    describe("activeInOtherRoute", () => {
        it("should return false if matching menu item does not have other routes", () => {
            expect(component.activeInOtherRoute("direct")).toBe(false);
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [new Subscription()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });
});
