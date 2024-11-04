import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { AgImportFormComponent } from "./ag-import-form.component";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import {
    mockAccountService,
    mockLanguageService,
    mockMatDialog,
    mockMatDialogData,
    mockMatDialogRef,
    mockRouter,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Accounts, CompanyCode, Permission } from "@empowered/constants";
import { AccountService, AflacService, Configuration } from "@empowered/api";
import { RouterTestingModule } from "@angular/router/testing";
import { of, throwError } from "rxjs";
import { AddGroup, SharedState } from "@empowered/ngxs-store";
import { HttpErrorResponse, HttpHeaders, HttpResponse } from "@angular/common/http";
import { UserService } from "@empowered/user";

describe("AgImportFormComponent", () => {
    let component: AgImportFormComponent;
    let fixture: ComponentFixture<AgImportFormComponent>;
    let store: Store;
    let router: Router;
    let fb: FormBuilder;
    let aflac: AflacService;
    let userService: UserService;
    let accountService: AccountService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AgImportFormComponent],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                Configuration,
                FormBuilder,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([SharedState]), RouterTestingModule, ReactiveFormsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        store = TestBed.inject(Store);
        fb = TestBed.inject(FormBuilder);
        aflac = TestBed.inject(AflacService);
        userService = TestBed.inject(UserService);
        accountService = TestBed.inject(AccountService);
        fixture = TestBed.createComponent(AgImportFormComponent);
        component = fixture.componentInstance;
        store.reset({
            ...store.snapshot(),
            core: {
                permissions: [Permission.SHARED_CASE_CREATE_ACCOUNT],
            },
        });
        router = TestBed.inject(Router);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("checkUserRole()", () => {
        it("should make isRole93 as true if SHARED_CASE_CREATE_ACCOUNT permission is present and AFLAC_ACCOUNT_CREATE is not present", () => {
            component.stepOneForm = fb.group({
                aflacGroupNumber: [null, Validators.required],
            });
            component.checkUserRole();
            expect(component.isRole93).toBe(true);
        });
        it("should make isRole93 as false if both SHARED_CASE_CREATE_ACCOUNT and AFLAC_ACCOUNT_CREATE permissions are present", () => {
            store.reset({
                ...store.snapshot(),
                core: {
                    permissions: [Permission.SHARED_CASE_CREATE_ACCOUNT, Permission.AFLAC_ACCOUNT_CREATE],
                },
            });
            component.checkUserRole();
            expect(component.isRole93).toBe(false);
        });
    });

    describe("getAccountNumber()", () => {
        it("should not call aflac.getAflacAccount if stepOneForm is invalid", () => {
            component.stepOneForm = fb.group({
                accountNumber: [null, Validators.required],
            });
            const spy1 = jest.spyOn(aflac, "getAflacAccount");
            component.getAccountNumber();
            expect(spy1).toBeCalledTimes(0);
        });
        it("should call aflac.getAflacAccount if stepOneForm is valid", () => {
            component.stepOneForm = fb.group({
                accountNumber: ["12345", Validators.required],
            });
            const spy2 = jest.spyOn(aflac, "getAflacAccount").mockReturnValue(of({ body: {} } as HttpResponse<Accounts>));
            component.getAccountNumber();
            expect(spy2).toBeCalledWith("12345");
        });
        it("should call commonErrorHandler if aflac.getAflacAccount returns an error", () => {
            component.stepOneForm = fb.group({
                accountNumber: ["12345", Validators.required],
            });
            const error = {
                message: "api error message",
                status: 400,
            };
            jest.spyOn(aflac, "getAflacAccount").mockReturnValue(throwError(error));
            const spy3 = jest.spyOn(component, "commonErrorHandler");
            component.getAccountNumber();
            expect(spy3).toBeCalledTimes(1);
        });
    });

    describe("getCompanyCode()", () => {
        it("should return as CompanyCode.NY when account company code is NY", () => {
            const retValue = component.getCompanyCode({ companyCode: "NY" } as Accounts);
            expect(retValue).toBe(CompanyCode.NY);
        });
        it("should return as CompanyCode.US when account company code is other than", () => {
            const retValue = component.getCompanyCode({ companyCode: "GA" } as Accounts);
            expect(retValue).toBe(CompanyCode.US);
        });
    });

    describe("getNewHireReqAGOnly()", () => {
        it("should return NewHiredetails", () => {
            const retValue = component.getNewHireReqAGOnly();
            expect(retValue).toStrictEqual({
                coverageStart: "FIRST_OF_THE_MONTH_AFTER_EVENT",
                daysBeforeCoverageStart: 0,
                daysToEnroll: 90,
            });
        });
    });

    describe("navigateToAccount()", () => {
        it("should add group in store and navigate to account dashboard", () => {
            component.importedAccount = { employeeCount: null, productsCount: null } as Accounts;
            const spy1 = jest.spyOn(store, "dispatch");
            const spy2 = jest.spyOn(router, "navigate");
            component.navigateToAccount();
            expect(spy1).toBeCalledWith(new AddGroup({ employeeCount: 0, productsCount: 0 } as Accounts));
            expect(spy2).toBeCalledTimes(1);
        });
    });

    describe("onImport()", () => {
        it("should call validateStep if form is invalid", () => {
            component.stepOneForm = {} as FormGroup;
            const spy1 = jest.spyOn(component, "validateStep");
            jest.spyOn(component, "validateStep").mockReturnValue();
            const stepForm = { invalid: true } as FormGroup;
            component.onImport(stepForm);
            expect(spy1).toBeCalledWith(stepForm);
        });
        it("should call importAiWithAg if form has both groupNumber & accountNumber", () => {
            component.stepOneForm = { value: { groupNumber: "AG12345", accountNumber: 12345 } } as FormGroup;
            const spy1 = jest.spyOn(component, "importAiWithAg");
            jest.spyOn(component, "importAiWithAg").mockReturnValue();
            component.onImport({} as FormGroup);
            expect(spy1).toBeCalledTimes(1);
        });
        it("should call importAiOnly if form has only accountNumber", () => {
            component.stepOneForm = { value: { accountNumber: 12345 } } as FormGroup;
            const spy1 = jest.spyOn(component, "importAiOnly");
            jest.spyOn(component, "importAiOnly").mockReturnValue();
            component.onImport({} as FormGroup);
            expect(spy1).toBeCalledTimes(1);
        });
        it("should call importAgOnly if form has only groupNumber", () => {
            component.stepOneForm = { value: { groupNumber: "AG12345" } } as FormGroup;
            const spy1 = jest.spyOn(component, "importAgOnly");
            jest.spyOn(component, "importAgOnly").mockReturnValue();
            component.onImport({} as FormGroup);
            expect(spy1).toBeCalledTimes(1);
        });
    });

    describe("compareSitus()", () => {
        it("should return false if aflacAccount and aflacGroupNo have same situs state", () => {
            component.aflacAccount = { accountNumber: "12345", situs: { state: { abbreviation: "GA", name: "Georgia" } } } as Accounts;
            component.aflacGroupNo = { accountNumber: "56789", situs: { state: { abbreviation: "GA", name: "Georgia" } } } as Accounts;
            const returnValue = component.compareSitus();
            expect(returnValue).toBe(false);
        });
        it("should return true if aflacAccount and aflacGroupNo have different situs state", () => {
            component.aflacAccount = { accountNumber: "12345", situs: { state: { abbreviation: "AL", name: "Alabama" } } } as Accounts;
            component.aflacGroupNo = { accountNumber: "56789", situs: { state: { abbreviation: "GA", name: "Georgia" } } } as Accounts;
            const returnValue = component.compareSitus();
            expect(returnValue).toBe(true);
        });
    });
    describe("commonErrorHandler()", () => {
        beforeEach(() => {
            component.stepOneForm = fb.group({
                accountNumber: [null, Validators.required],
            });
            jest.clearAllMocks();
        });
        describe("should set error message when error response code is forbidden", () => {
            it("should assign forbiddenError with primary.portal.importAccount.billModeForbiddenError when groupName is sent", () => {
                const error = {
                    error: { status: "invalid", code: "forbidden", message: "error message for forbidden code" },
                } as HttpErrorResponse;
                component.commonErrorHandler(error, "accountName", "message", "commonError", "accountNumber", "12345");
                expect(component.forbiddenError).toStrictEqual("primary.portal.importAccount.billModeForbiddenError");
            });
            it("should assign forbiddenError with primary.portals.accounts.importAccount.errors.getAflacAccount.403.forbidden when groupName is not sent", () => {
                const error = {
                    error: { status: "invalid", code: "forbidden", message: "error message for forbidden code" },
                } as HttpErrorResponse;
                component.commonErrorHandler(error, "accountName", "message", "commonError", "accountNumber");
                expect(component.forbiddenError).toStrictEqual(
                    "primary.portals.accounts.importAccount.errors.getAflacAccount.403.forbidden",
                );
            });
        });
        it("should set message for badData error code", () => {
            const error = {
                error: { status: 400, code: "badData" },
            } as HttpErrorResponse;
            component.commonErrorHandler(error, "accountName", "aiBadDataMessage", "commonError", "accountNumber");
            expect(component.aiBadDataMessage).toStrictEqual("secondary.api.importAccount.400.badData");
        });
        it("should call getAccount for selfDuplicate error code", () => {
            const error = {
                error: { status: 401, code: "selfDuplicate" },
                headers: new HttpHeaders({ location: "location/location?location" }),
            } as HttpErrorResponse;
            const spy = jest.spyOn(accountService, "getAccount").mockReturnValue(of({} as Accounts));
            component.commonErrorHandler(error, "accountName", "aiBadDataMessage", "commonError", "accountNumber");
            expect(spy).toBeCalledTimes(1);
        });
        it("should set isAiAlreadyExist or isAgAlreadyExist based on formCtrlName for duplicate error code", () => {
            const error = {
                error: { status: 401, code: "duplicate" },
                headers: new HttpHeaders({ location: "location/location?location" }),
            } as HttpErrorResponse;
            const spy = jest.spyOn(accountService, "getAccount").mockReturnValue(of({} as Accounts));
            component.commonErrorHandler(error, "accountName", "aiBadDataMessage", "commonError", "accountNumber");
            expect(component.isAiAlreadyExist).toBe(true);
            component.commonErrorHandler(error, "accountName", "aiBadDataMessage", "commonError", "groupNumber");
            expect(component.isAgAlreadyExist).toBe(true);
            expect(spy).toBeCalledTimes(2);
        });
        it("should set missingZip or isPartialSetup based on error details field for invalidState error code", () => {
            const error1 = {
                error: { status: 402, code: "invalidState", details: [{ field: "ZipCode" }] },
            } as HttpErrorResponse;
            component.commonErrorHandler(error1, "accountName", "aiBadDataMessage", "commonError", "accountNumber");
            expect(component.missingZip).toBe(true);
            const error2 = {
                error: { status: 401, code: "invalidState", details: [{ field: "Others" }] },
            } as HttpErrorResponse;
            component.commonErrorHandler(error2, "accountName", "aiBadDataMessage", "commonError", "accountNumber");
            expect(component.isPartialSetup).toBe(true);
        });
        it("should set invalidZipError for invalidZip error code", () => {
            const error = {
                error: { status: 402, code: "invalidZip" },
            } as HttpErrorResponse;
            component.commonErrorHandler(error, "accountName", "aiBadDataMessage", "commonError", "accountNumber");
            expect(component.invalidZipError).toBe(true);
        });
        it("should set invalidApplicationState to form control for invalidApplicationState error code", () => {
            const error = {
                error: { status: 403, code: "invalidApplicationState" },
            } as HttpErrorResponse;
            component.commonErrorHandler(error, "accountName", "aiBadDataMessage", "commonError", "accountNumber");
            expect(component.stepOneForm.controls?.accountNumber.errors).toStrictEqual({ invalidApplicationState: true });
        });
        it("should set commonError to form control for error code other than above cases", () => {
            const error = {
                error: { status: 403, code: "commonError" },
            } as HttpErrorResponse;
            component.commonErrorHandler(error, "accountName", "aiBadDataMessage", "commonError", "accountNumber");
            expect(component.stepOneForm.controls?.accountNumber.errors).toStrictEqual({ commonError: true });
        });
    });
    describe("closePopup()", () => {
        it("should close aflac group import popup", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closePopup();
            expect(spy1).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
