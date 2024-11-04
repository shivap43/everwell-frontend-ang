import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import {
    mockAccountService,
    mockAppFlowService,
    mockCoreService,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockMatDialogRef,
    mockMemberService,
    mockRouter,
    mockShoppingCartDisplayService,
    mockShoppingService,
    mockStaticUtilService,
    mockStore,
    mockTpiService,
    mockUserService,
} from "@empowered/testing";
import { FormBuilder } from "@angular/forms";
import { AccountService, Configuration, CoreService, MemberService, ShoppingCartDisplayService, ShoppingService } from "@empowered/api";
import { PlaninfoCompactComponent } from "./planinfo-compact.component";
import { NgxsModule, Store } from "@ngxs/store";
import { AppFlowService, StaticUtilService } from "@empowered/ngxs-store";
import { Router } from "@angular/router";
import { EmpoweredModalService, TpiServices } from "@empowered/common-services";
import { UserService } from "@empowered/user";
import { HttpClientTestingModule } from "@angular/common/http/testing";

const matDialogData = {
    mpGroup: "123",
    memberId: 1,
    email: "asd@gmail.com",
    ssn: 1231211234,
};

describe("PlaninfoCompactComponent", () => {
    let component: PlaninfoCompactComponent;
    let fixture: ComponentFixture<PlaninfoCompactComponent>;
    let matDialogRef: MatDialogRef<PlaninfoCompactComponent>;
    let memberService: MemberService;
    let shoppingService: ShoppingService;
    let store: Store;
    let appFlowService: AppFlowService;
    let matDialog: MatDialog;
    let coreService: CoreService;
    let accountService: AccountService;
    let staticUtilService: StaticUtilService;
    let router: Router;
    let empoweredModalService: EmpoweredModalService;
    let shoppingCartDisplayService: ShoppingCartDisplayService;
    let tpiService: TpiServices;
    let userService: UserService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlaninfoCompactComponent],
            providers: [
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: MAT_DIALOG_DATA, useValue: matDialogData },
                { provide: MatDialogRef, useValue: mockMatDialogRef },
                { provide: MemberService, useValue: mockMemberService },
                { provide: ShoppingService, useValue: mockShoppingService },
                { provide: Store, useValue: mockStore },
                { provide: AppFlowService, useValue: mockAppFlowService },
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: CoreService, useValue: mockCoreService },
                { provide: AccountService, useValue: mockAccountService },
                { provide: StaticUtilService, useValue: mockStaticUtilService },
                { provide: Router, useValue: mockRouter },
                { provide: EmpoweredModalService, useValue: mockEmpoweredModalService },
                { provide: ShoppingCartDisplayService, useValue: mockShoppingCartDisplayService },
                { provide: TpiServices, useValue: mockTpiService },
                { provide: UserService, useValue: mockUserService },
                { provide: ShoppingService, useValue: mockShoppingService },
                FormBuilder,
                Configuration,
            ],
            imports: [HttpClientTestingModule, NgxsModule.forRoot()],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        memberService = TestBed.inject(MemberService);
        shoppingService = TestBed.inject(ShoppingService);
        store = TestBed.inject(Store);
        appFlowService = TestBed.inject(AppFlowService);
        matDialogRef = TestBed.inject(MatDialogRef);
        matDialog = TestBed.inject(MatDialog);
        coreService = TestBed.inject(CoreService);
        accountService = TestBed.inject(AccountService);
        staticUtilService = TestBed.inject(StaticUtilService);
        router = TestBed.inject(Router);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        shoppingCartDisplayService = TestBed.inject(ShoppingCartDisplayService);
        tpiService = TestBed.inject(TpiServices);
        userService = TestBed.inject(UserService);
        fixture = TestBed.createComponent(PlaninfoCompactComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit", () => {
        it("virginia config", () => {
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled");
            component.ngOnInit();
            expect(spy1).toBeCalledWith("general.feature.enable.virginia_objection");
        });

        it("default spinner state", () => {
            fixture.destroy();
            expect(component.isSpinnerLoading).toBe(undefined);
        });

        it("getPlanOfferingDetails", () => {
            const spy1 = jest.spyOn(shoppingService, "getPlanOffering");
            component.application = { cartData: { id: 1, planOffering: { id: 10 } } };
            component.mpGroup = 12345;
            component.memberId = 12;
            component.ngOnInit();
            expect(spy1).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
