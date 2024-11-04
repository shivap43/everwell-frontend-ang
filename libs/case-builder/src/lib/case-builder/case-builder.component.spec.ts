import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import {
    mockAccountService,
    mockDateService,
    mockLanguageService,
    mockMatDialog,
    mockAuthenticationService,
    mockSharedService,
    mockStaticUtilService,
} from "@empowered/testing";
import { CaseBuilderComponent } from "./case-builder.component";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatMenuModule} from "@angular/material/menu";
import { AccountService, AuthenticationService } from "@empowered/api";
import { MatDialog } from "@angular/material/dialog";
import { CaseBuilderTableData } from "./case-builder.model";
import { Subscription, throwError } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { DateService } from "@empowered/date";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { AccountListState, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { SharedService } from "@empowered/common-services";
import { of } from "rxjs";

const error = {};
error["error"] = {
    status: "ERROR",
    code: 404,
    ["details"]: [
        { code: "", message: "Mock 404 error" },
        { code: "", message: "Reached Maximum length" },
    ],
};

const mockSubscription = [
    {
        unsubscribe: () => {},
    },
] as Subscription[];

describe("CaseBuilderComponent", () => {
    let component: CaseBuilderComponent;
    let fixture: ComponentFixture<CaseBuilderComponent>;
    let languageService: LanguageService;
    let store: Store;
    let sharedService: SharedService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CaseBuilderComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: DateService,
                    useValue: mockDateService,
                },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                {
                    provide: SharedService,
                    useVaue: mockSharedService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
            ],
            imports: [
                ReactiveFormsModule,
                NgxsModule.forRoot([AccountListState, SharedState]),
                HttpClientTestingModule,
                MatTableModule,
                MatMenuModule,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CaseBuilderComponent);
        component = fixture.componentInstance;
        languageService = TestBed.inject(LanguageService);
        component.dataSource = {
            data: [
                {
                    id: 1,
                    name: "EP6IX",
                    startDate: "05/21/2023",
                    endDate: "Ongoing",
                },
            ],
        } as MatTableDataSource<any>;
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                isEnroller: true,
            },
            accounts: {
                selectedGroup: {
                    id: 12345,
                },
            },
        });
        sharedService = TestBed.inject(SharedService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe.skip("isLoggedInProducerEnroller()", () => {
        it("should initialize data and call getPrivacyConfigforEnroller", () => {
            const spy = jest.spyOn(sharedService, "getPrivacyConfigforEnroller").mockReturnValue(true);
            component.isLoggedInProducerEnroller();
            expect(spy).toBeCalled();
            expect(component.isEnroller).toBe(true);
            expect(component.isPrivacyOnForEnroller).toBe(true);
        });
    });

    describe("showCaseBuilderAdmins()", () => {
        it.skip("should call getAccountCaseBuilder API once when showCaseBuilderAdmins is called", () => {
            const spy = jest.spyOn(mockAccountService, "getAccountCaseBuilders");
            component.showCaseBuilderAdmins();
            expect(spy).toBeCalledTimes(1);
        });

        it("should call getAccountCaseBuilder API once and set dataSource when showCaseBuilderAdmins is called", () => {
            jest.spyOn(mockAccountService, "getAccountCaseBuilders");
            component.showCaseBuilderAdmins();
            expect(component.dataSource.data[0].name).toBe("EP6");
        });

        it("should set isDataFound to be true when there is case builder added to the group", () => {
            component.showCaseBuilderAdmins();
            expect(component.isDataFound).toBe(true);
        });

        it("should set hasBBName to be false when there is case builder added to the group does not have Brick Builder name", () => {
            component.showCaseBuilderAdmins();
            expect(component.hasBBName).toBe(false);
        });
    });

    describe("showErrorAlertMessage()", () => {
        it("should set isDataFound false when getAccountCaseBuilders API fails", () => {
            jest.spyOn(mockAccountService, "getAccountCaseBuilders").mockReturnValue(throwError(error));
            component.showErrorAlertMessage(error as HttpErrorResponse);
            expect(component.isDataFound).toBe(false);
        });

        it("should update errorMessage with badRequest language string if error status is 400 and error code is badRequest", () => {
            jest.spyOn(languageService, "fetchSecondaryLanguageValue").mockReturnValue("secondary.api.400.badRequest");
            component.showErrorAlertMessage({ status: 400, error: { code: "badRequest" } } as unknown as HttpErrorResponse);
            expect(component.apiError).toStrictEqual("secondary.api.400.badRequest");
        });
    });
    describe.skip("checkUserPermissions()", () => {
        it("should call hasPermission and set flags", () => {
            const spy = jest.spyOn(mockStaticUtilService, "hasPermission").mockReturnValue(of(true));
            component.checkUserPermissions();
            expect(spy).toBeCalledTimes(3);
            expect(component.hasCreatePermission).toBe(true);
            expect(component.hasUpdatePermission).toBe(true);
            expect(component.hasDeletePermission).toBe(true);
            expect(component.hasManagePermission).toBe(true);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe from all subscriptions when ngOnDestory is called", () => {
            component.subscriptions = mockSubscription;
            const spy = jest.spyOn(mockSubscription[0], "unsubscribe");
            component.ngOnDestroy();
            expect(spy).toBeCalled();
        });
    });

    describe.skip("onRemoveAlertConfirm()", () => {
        it("should call deleteAccountCaseBuilder API when remove button is clicked", () => {
            const spy = jest.spyOn(mockAccountService, "deleteAccountCaseBuilder");
            component.onRemoveAlertConfirm(true, 1);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("openRemoveAlert()", () => {
        it("should open the dialog when remove button is clicked and openRemoveAlert is invoked", () => {
            const spy1 = jest.spyOn(component["dialog"], "open");
            component.openRemoveAlert(1, "EP6IX");
            expect(spy1).toBeCalled();
        });
    });
});
