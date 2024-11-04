import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AccountList, ExceptionsService } from "@empowered/api";
import { AlertType, ExceptionType } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { mockExceptionsService, mockLanguageService, mockMatDialogRef, mockStore } from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { ExceptionFormComponent } from "./exception-form.component";
import { throwError } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatInputModule } from "@angular/material/input";
import { DateService } from "@empowered/date";

describe("ExceptionFormComponent", () => {
    let component: ExceptionFormComponent;
    let fixture: ComponentFixture<ExceptionFormComponent>;
    let exceptionsService: ExceptionsService;
    let languageService: LanguageService;
    let dateService: DateService;
    const error = { status: 401, error: { code: "badRequest" } };
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule, MatDatepickerModule, MatInputModule],
            declarations: [ExceptionFormComponent],
            providers: [
                FormBuilder,
                DatePipe,
                DateService,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: ExceptionsService,
                    useValue: mockExceptionsService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        exceptionTypes: [],
                        action: "EDIT",
                        inputData: {
                            id: 1,
                            validity: { effectiveStarting: "2023-01-01" },
                            type: "ALLOW_WITHDRAWN_PLAN",
                        },
                    },
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ExceptionFormComponent);
        component = fixture.componentInstance;
        exceptionsService = TestBed.inject(ExceptionsService);
        languageService = TestBed.inject(LanguageService);
        dateService = TestBed.inject(DateService);
        component.exceptionForm = new FormBuilder().group({
            type: ExceptionType.ALLOWED_ENROLLMENT_EXCEPTIONS,
        });
        component.active8x8CallCenter = {
            callCenterId: 11,
            tollFreeNumber: "11232393733",
            validity: { effectiveStarting: "2023-01-01" },
        };
        component.getSecondaryLanguageKeys();
        jest.restoreAllMocks();
        jest.resetModules();
        jest.clearAllMocks();
        component.getSecondaryLanguageKeys();
        jest.restoreAllMocks();
        jest.resetModules();
        jest.clearAllMocks();
    });

    describe("ExceptionFormComponent", () => {
        it("should get created", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("getDefaultExceptionType", () => {
        it("should select the option that was chosen while adding the exception in edit mode", () => {
            expect(component.getDefaultExceptionType("EDIT")).toEqual("ALLOW_WITHDRAWN_PLAN");
        });

        it("should select disability PIN signature if an 8x8 call center has been approved", () => {
            component.data.exceptionTypes = ["ALLOWED_DISABILITY_ENROLLMENT"];
            expect(component.getDefaultExceptionType("ADD")).toEqual("ALLOWED_DISABILITY_ENROLLMENT");
        });

        it("should select PIN signature if an approved 8x8 call center does not exist", () => {
            component.active8x8CallCenter = {
                callCenterId: 11,
                validity: { effectiveStarting: "2023-01-01" },
            };
            component.data.exceptionTypes = ["ALLOWED_DISABILITY_ENROLLMENT"];
            expect(component.getDefaultExceptionType("ADD")).toEqual("ALLOWED_ENROLLMENT_EXCEPTIONS");
        });
    });

    describe("getAlerts", () => {
        it("should get created", () => {
            expect(
                component
                    .getAlerts(ExceptionType.ALLOWED_ENROLLMENT_EXCEPTIONS, { onlyIndividualPlans: true, onlyGroupPlans: false }, {
                        state: "GA",
                    } as unknown as AccountList)
                    .some((alert) => alert.alertType === AlertType.INFO),
            ).toBeTruthy();
        });

        it("should get created danger type alert for state NY when groupPlan is enabled", () => {
            expect(
                component
                    .getAlerts(ExceptionType.ALLOWED_ENROLLMENT_EXCEPTIONS, { onlyIndividualPlans: false, onlyGroupPlans: true }, {
                        state: "NY",
                    } as unknown as AccountList)
                    .some(
                        (alert) =>
                            alert.alertType === AlertType.DANGER &&
                            alert.content === "primary.portal.enrollmentOptions.pinSignature.notAllowedForGroupPlansInNYState",
                    ),
            ).toBeTruthy();
        });

        it("should get created alert for state NY when group plan and individual plan is disabled", () => {
            expect(
                component
                    .getAlerts(ExceptionType.ALLOWED_ENROLLMENT_EXCEPTIONS, { onlyIndividualPlans: false, onlyGroupPlans: false }, {
                        state: "NY",
                    } as unknown as AccountList)
                    .some(
                        (alert) =>
                            alert.alertType === AlertType.INFO &&
                            alert.content === "primary.portal.enrollmentOptions.pinSignature.allowedForIndividualPlanInNYState",
                    ),
            ).toBeTruthy();
        });
    });

    describe("onSubmit()", () => {
        it("should block the form submit on error", () => {
            component.exceptionForm.setErrors({ invalid: true });
            expect(component.onSubmit()).toBe(undefined);
        });

        it("should invoke editException service when action is ExceptionFormType.EDIT and close the model on success", () => {
            jest.spyOn(component, "getExceptionToBeSaved").mockReturnValue(null);
            const spy1 = jest.spyOn(component["matDialogRef"], "close");
            component.onSubmit();
            expect(spy1).toBeCalledWith("EDIT");
        });

        it("should invoke editException service when action is ExceptionFormType.EDIT and should show error on service failure", () => {
            jest.spyOn(component, "getExceptionToBeSaved").mockReturnValue(null);
            jest.spyOn(exceptionsService, "updateException").mockReturnValue(throwError(error as HttpErrorResponse));
            jest.spyOn(languageService, "fetchSecondaryLanguageValue").mockReturnValue("secondary.api.400.badRequest");
            component.onSubmit();
            expect(component.showError).toBeTruthy();
            expect(component.errorMessage).toStrictEqual("secondary.api.400.badRequest");
        });

        it("should invoke addException service when action is ExceptionFormType.ADD and close the model on success", () => {
            component.data.action = "ADD";
            jest.spyOn(component, "getExceptionToBeSaved").mockReturnValue(null);
            const spy1 = jest.spyOn(component["matDialogRef"], "close");
            component.onSubmit();
            expect(component.showError).toBeFalsy();
            expect(spy1).toBeCalledWith("ADD");
        });

        it("should invoke addException service when action is ExceptionFormType.ADD and should show error on service failure", () => {
            component.data.action = "ADD";
            jest.spyOn(component, "getExceptionToBeSaved").mockReturnValue(null);
            jest.spyOn(exceptionsService, "addException").mockReturnValue(throwError(error as HttpErrorResponse));
            jest.spyOn(languageService, "fetchSecondaryLanguageValue").mockReturnValue("secondary.api.400.badRequest");
            component.onSubmit();
            expect(component.showError).toBeTruthy();
            expect(component.errorMessage).toStrictEqual("secondary.api.400.badRequest");
        });

        it("should invoke deleteException service when action is ExceptionFormType.REMOVE and close the model", () => {
            component.data.action = "REMOVE";
            jest.spyOn(component, "getExceptionToBeSaved").mockReturnValue(null);
            const spy1 = jest.spyOn(component["matDialogRef"], "close");
            component.onSubmit();
            expect(spy1).toBeCalledWith("REMOVE");
        });
    });

    describe("showErrorMessage()", () => {
        it("should return duplicate error when HTTP response status is 409 and error code is duplicate", () => {
            const errorResponse = { status: 409, error: { code: "duplicate" } } as HttpErrorResponse;
            component.showErrorMessage(errorResponse);
            expect(component.errorMessage).toStrictEqual("secondary.portal.pinSignature.addException.409.duplicate");
        });

        it("should return locked error when HTTP response status is 409 and error code is locked", () => {
            const errorResponse = { status: 409, error: { code: "locked" } } as HttpErrorResponse;
            component.showErrorMessage(errorResponse);
            expect(component.errorMessage).toStrictEqual("secondary.portal.pinSignature.addException.409.locked");
        });

        it("should return defined error when HTTP response status is 400", () => {
            const errorResponse = {
                status: 400,
                error: { status: 400, code: "badRequest", ["details"]: [{ code: "400", field: "startDate" }] },
            } as HttpErrorResponse;
            component.showErrorMessage(errorResponse);
            expect(component.errorMessage).toStrictEqual("secondary.portal.pinSignature.addException.400.400.startDate");
        });

        it("should catch and throw generic error for other than 409 and 400 error codes", () => {
            const errorResponse = {
                status: 403,
                error: { status: 403, code: "badRequest", ["details"]: [{ code: "403", field: "startDate" }] },
            } as HttpErrorResponse;
            component.showErrorMessage(errorResponse);
            expect(component.errorMessage).toStrictEqual("secondary.api.403.badRequest");
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

    describe("getOverlapError()", () => {
        it("should throw enrollment exception when PIN signature added before its vcc end date", () => {
            expect(component.getOverlapError()).toStrictEqual(
                "secondary.portal.enrollmentOptions.activeVCC.exceptionStartDate.overlapping",
            );
        });

        it("should throw enrollment exception when PIN signature added after vcc start date and no end date", () => {
            jest.spyOn(dateService, "isBeforeOrIsEqual").mockReturnValue(false);
            expect(component.getOverlapError()).toStrictEqual("secondary.portal.enrollmentOptions.cannotOverlapActiveVCC");
        });

        it("should throw overlap exception when date is in between start date and end date", () => {
            jest.spyOn(dateService, "isBeforeOrIsEqual").mockReturnValue(false);
            component.active8x8CallCenter.validity.expiresAfter = "2023-08-25";
            expect(component.getOverlapError()).toStrictEqual("secondary.portal.enrollmentOptions.exceptionStartDate.overlapping");
        });

        it("should throw error when disability pin added before start date and no end date", () => {
            component.exceptionForm.controls.type.setValue(ExceptionType.ALLOWED_DISABILITY_ENROLLMENT);
            expect(component.getOverlapError()).toStrictEqual("secondary.portal.enrollmentOptions.errors.overlap.disabilityPIN.noEndDate");
        });

        it("should throw error when disability pin is not added between start date and end date", () => {
            component.exceptionForm.controls.type.setValue(ExceptionType.ALLOWED_DISABILITY_ENROLLMENT);
            component.active8x8CallCenter.validity.expiresAfter = "2023-08-25";
            expect(component.getOverlapError()).toStrictEqual("secondary.portal.enrollmentOptions.errors.overlap.disabilityPIN.endDate");
        });
    });

    describe("init8x8CallCenterInfo()", () => {
        it("should pinSignatureExceptionOverlapInfo return cannotOverlapVCCDates.noEndDate when no end date is provided", () => {
            component.init8x8CallCenterInfo(component.active8x8CallCenter);
            expect(component.pinSignatureExceptionOverlapInfo).toStrictEqual(
                "primary.portal.enrollmentOptions.pinSignature.cannotOverlapVCCDates.noEndDate",
            );
        });

        it("should pinSignatureExceptionOverlapInfo return cannotOverlapVCCDates when end date is provided", () => {
            component.active8x8CallCenter.validity.expiresAfter = "2023-08-25";
            component.init8x8CallCenterInfo(component.active8x8CallCenter);
            expect(component.pinSignatureExceptionOverlapInfo).toStrictEqual(
                "primary.portal.enrollmentOptions.pinSignature.cannotOverlapVCCDates",
            );
        });
    });
});
