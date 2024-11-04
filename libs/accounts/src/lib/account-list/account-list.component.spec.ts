import { ComponentType, Overlay, OverlayModule } from "@angular/cdk/overlay";
import { RouterTestingModule } from "@angular/router/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { of } from "rxjs";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { AccountListComponent } from "./account-list.component";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { AccountListService, AuthenticationService, Configuration, SearchProducer } from "@empowered/api";
import { MatHeaderRowDef, MatRowDef } from "@angular/material/table";
import { StaticUtilService } from "@empowered/ngxs-store";
import { MatMenuModule } from "@angular/material/menu";
import { CdkTableModule } from "@angular/cdk/table";
import {
    MockConfigEnableDirective,
    MockHasAnyPermissionDirective,
    MockHasPermissionDirective,
    MockIsRestrictedDirective,
    MockReplaceTagPipe,
    MockRichTooltipDirective,
    mockDatePipe,
    mockStore,
} from "@empowered/testing";
import { StoreModule } from "@ngrx/store";

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of({ type: "Remove" }),
        } as MatDialogRef<any>),
} as MatDialog;

describe("AccountListComponent", () => {
    let component: AccountListComponent;
    let fixture: ComponentFixture<AccountListComponent>;
    let authService: AuthenticationService;
    let staticUtilService: StaticUtilService;
    let accountListService: AccountListService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                AccountListComponent,
                MockHasPermissionDirective,
                MockIsRestrictedDirective,
                MockReplaceTagPipe,
                MockRichTooltipDirective,
                MockHasAnyPermissionDirective,
                MockConfigEnableDirective,
                MatHeaderRowDef,
                MatRowDef,
            ],
            imports: [
                HttpClientTestingModule,
                NgxsModule.forRoot([]),
                ReactiveFormsModule,
                RouterTestingModule,
                MatMenuModule,
                OverlayModule,
                CdkTableModule,
                StoreModule.forRoot({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                FormBuilder,
                Overlay,
                Configuration,
                TitleCasePipe,
                { provide: Store, useValue: mockStore },
                { provide: DatePipe, useValue: mockDatePipe },
                { provide: MatDialog, useValue: mockMatDialog },
            ],
        }).compileComponents();

        authService = TestBed.inject(AuthenticationService);
        staticUtilService = TestBed.inject(StaticUtilService);
        accountListService = TestBed.inject(AccountListService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AccountListComponent);
        component = fixture.componentInstance;
        component.isAdmin = true;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getNotificationEnableConfig()", () => {
        it("should get notification enable config value", () => {
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(false));
            component.getNotificationEnableConfig();
            expect(spy1).toBeCalledWith("general.feature.notifications.enable");
        });
    });

    describe("checkHQSupport()", () => {
        it("should return value of otherProducerData.hqSupport if otherProducerData is defined", () => {
            component.otherProducerData = {
                hqSupport: true,
            } as unknown as SearchProducer;
            expect(component.checkHQSupport()).toStrictEqual(true);
        });

        it("should return value of hasPermission or isRole93 if otherProducerData is not defined", () => {
            component.otherProducerData = undefined;
            const permission = component.hasPermission || component.isRole93;
            expect(component.checkHQSupport()).toStrictEqual(permission);
        });
    });

    describe("setTotalAccounts()", () => {
        it("should set total number of accounts for the admin", () => {
            const spy1 = jest.spyOn(accountListService, "getTotalAccounts").mockReturnValue(of(10));
            component.setTotalAccounts(21563);
            expect(component.totalAccounts).toStrictEqual(10);
            expect(spy1).toBeCalledWith("CLIENT", true, 21563);
        });
    });
});
