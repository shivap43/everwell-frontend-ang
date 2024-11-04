import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AccountService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { mockAccountService, mockLanguageService, mockMatDialogRef } from "@empowered/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CaseBuilderAddEditComponent } from "./case-builder-add-edit.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { DateService } from "@empowered/date";
import { throwError } from "rxjs/internal/observable/throwError";

const mockMatDialogData = {
    id: 1,
    type: "edit",
    mpGroup: 12345,
    allCaseBuilderAdmin: [{ id: 1, name: "EP6IX" }],
    selectedCaseBuilder: {
        id: 1,
        startDate: "2023-07-10",
        endDate: "2023-07-12",
    },
    caseBuilderList: [
        {
            id: 305,
            validity: {
                effectiveStarting: "2023-08-01",
                expiresAfter: "2023-08-30",
            },
            caseBuilder: {
                id: 1,
                name: "EP6IX",
                validity: {
                    effectiveStarting: "2023-06-12",
                },
            },
        },
        {
            id: 306,
            validity: {
                effectiveStarting: "2023-09-02",
                expiresAfter: "2023-09-30",
            },
            caseBuilder: {
                id: 1,
                name: "EP6IX",
                validity: {
                    effectiveStarting: "2023-06-12",
                },
            },
        },
    ],
};

describe("CaseBuilderAddEditComponent", () => {
    let component: CaseBuilderAddEditComponent;
    let fixture: ComponentFixture<CaseBuilderAddEditComponent>;
    let accountService: AccountService;
    let dateService: DateService;
    let matDialogRef: MatDialogRef<CaseBuilderAddEditComponent>;
    const formBuilder: FormBuilder = new FormBuilder();

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CaseBuilderAddEditComponent],
            providers: [
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
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                FormBuilder,
                DateService,
            ],
            imports: [HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CaseBuilderAddEditComponent);
        component = fixture.componentInstance;
        component.caseBuilderAdminForm = formBuilder.group({
            caseBuilderAdminSelect: ["admin1"],
            startDate: [""],
            endDate: [""],
        });
        accountService = TestBed.inject(AccountService);
        dateService = TestBed.inject(DateService);
        matDialogRef = TestBed.inject(MatDialogRef);
        component.data.mpGroup = 12345;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should initialize data and should update form controls if startDate and endDate is present", () => {
            component.date = "2023-07-12";
            fixture.detectChanges();
            expect(component.date).toStrictEqual("2023-07-12");
            expect(component.caseBuilderAdminForm).toBeDefined();
            expect(component.isDisableCaseBuilderAdmin).toBe(true);
            expect(component.endDate).toStrictEqual("2023-07-12");
            expect(component.caseBuilderAdminForm.controls.startDate.value).toStrictEqual("2023-07-10");
            expect(component.caseBuilderAdminForm.controls.endDate.value).toStrictEqual("2023-07-12");
            expect(component.isDisableStartDate).toBe(true);
        });
    });

    describe("createUpdateCaseBuilderAdmin()", () => {
        it("should call updateAccountCaseBuilder() when type is edit", () => {
            const spy = jest.spyOn(accountService, "updateAccountCaseBuilder");
            component.createUpdateCaseBuilderAdmin();
            component.createUpdateCaseBuilderAdmin();
            expect(spy).toBeCalledTimes(2);
            expect(component.isDisableEditButton).toBeTruthy();
        });

        it("should enable Save button when updateAccountCaseBuilder() throws error and type is edit", () => {
            jest.spyOn(accountService, "updateAccountCaseBuilder").mockReturnValue(throwError({}));
            component.createUpdateCaseBuilderAdmin();
            expect(component.isDisableEditButton).toBeFalsy();
        });

        it("should call createCaseBuilder() when type is add", () => {
            component.data.type = "add";
            const spy = jest.spyOn(accountService, "createCaseBuilder");
            component.createUpdateCaseBuilderAdmin();
            expect(spy).toBeCalledTimes(1);
        });

        it("should enable Add button when createCaseBuilder() throws error and type is add", () => {
            component.data.type = "add";
            jest.spyOn(accountService, "createCaseBuilder").mockReturnValue(throwError({}));
            component.createUpdateCaseBuilderAdmin();
            expect(component.isDisableAddButton).toBeFalsy();
        });
    });
    describe("createCaseBuilderRequest()", () => {
        it("should return CaseBuilderRequest", () => {
            component.caseBuilderAdminForm.controls["caseBuilderAdminSelect"].setValue(1);
            component.caseBuilderAdminForm.controls["startDate"].setValue("2023-06-16");
            component.caseBuilderAdminForm.controls["endDate"].setValue("2023-10-16");
            const caseBuilderRequest = component.createCaseBuilderRequest();
            expect(caseBuilderRequest).toStrictEqual({
                validity: { effectiveStarting: "2023-06-16", expiresAfter: "2023-10-16" },
                caseBuilderId: 1,
            });
        });
    });

    describe("convertDate()", () => {
        it("should return converted date", () => {
            const convertedDate1 = component.convertDate("2021-12-12");
            expect(convertedDate1).toStrictEqual({ startDate: "2021-12-12" });
            const convertedDate2 = component.convertDate("2021-12-12", "2021-12-12");
            expect(convertedDate2).toStrictEqual({ startDate: "2021-12-12", endDate: "2021-12-12" });
        });
    });

    describe("validateInput()", () => {
        it("should call setValidationErrors and set isDisableAddButton and isDisableEditButton ", () => {
            component.validateInput();
            expect(component.isDisableAddButton).toBe(false);
            expect(component.isDisableEditButton).toBe(false);
        });
    });
    describe("setValidationErrors()", () => {
        beforeEach(() => {
            component.date = "2021-11-13";
        });

        it("should set endDate errors as null when start date is there and end date is empty", () => {
            component.caseBuilderAdminForm.controls.startDate.setValue("2023-07-12");
            component.caseBuilderAdminForm.controls.endDate.setValue("");
            component.setValidationErrors();
            expect(component.caseBuilderAdminForm.controls.endDate.value).toBeNull();
            expect(component.caseBuilderAdminForm.controls.endDate.errors).toBeNull();
        });

        describe("error messages when startDate or endDate is present after above validations fail", () => {
            it("should set error.fieldStartDate and error.fieldEndDate and errors as null for startDate and endDate", () => {
                component.caseBuilderAdminForm.controls.startDate.setValue("2023-07-11");
                component.caseBuilderAdminForm.controls.endDate.setValue("2023-07-12");
                component.error.fieldStartDate = component.error.fieldEndDate = "";
                component.setValidationErrors();
                expect(component.error.fieldStartDate).toStrictEqual("");
                expect(component.error.fieldEndDate).toStrictEqual("");
                expect(component.caseBuilderAdminForm.controls.startDate.errors).toBeNull();
                expect(component.caseBuilderAdminForm.controls.endDate.errors).toBeNull();
            });
            it("should set error when startDate or endDate is less than date", () => {
                jest.spyOn(dateService, "isBefore").mockReturnValue(true);
                component.caseBuilderAdminForm.controls.startDate.setValue("2021-11-10");
                component.caseBuilderAdminForm.controls.endDate.setValue("2021-11-12");
                component.setValidationErrors();
                expect(component.error.messageStartDate).toStrictEqual("primary.portal.caseBuilderAdmin.datePast");
                expect(component.error.messageEndDate).toStrictEqual("primary.portal.caseBuilderAdmin.datePast");
            });
            it("should set error sameDateORafterStartDate when startDate is greater than endDate and dateType is endDate", () => {
                component.caseBuilderAdminForm.controls.startDate.setValue("2023-07-12");
                component.caseBuilderAdminForm.controls.endDate.setValue("2023-07-11");
                component.dateType = "endDate";
                component.setValidationErrors();
                expect(component.error.messageEndDate).toStrictEqual("primary.portal.caseBuilderAdmin.sameDateORafterStartDate");
            });
            it("should set error sameDateORbeforeDate when startDate is greater than endDate and dateType is startDate", () => {
                component.caseBuilderAdminForm.controls.startDate.setValue("2023-07-12");
                component.caseBuilderAdminForm.controls.endDate.setValue("2023-07-11");
                component.dateType = "startDate";
                component.setValidationErrors();
                expect(component.error.messageStartDate).toStrictEqual("primary.portal.caseBuilderAdmin.sameDateORbeforeDate");
            });
        });
    });
    describe("showFormatValidationErrors()", () => {
        it("should set error for message and field when startDate", () => {
            component.showFormatValidationErrors("startDate", "errorMessage");
            expect(component.error.fieldStartDate).toStrictEqual("startDate");
            expect(component.error.messageStartDate).toStrictEqual("errorMessage");
            expect(component.caseBuilderAdminForm.controls.startDate.errors).toStrictEqual({ invalid: true });
        });

        it("should set error for message and field when endDate", () => {
            component.showFormatValidationErrors("endDate", "errorMessage");
            expect(component.error.fieldEndDate).toStrictEqual("endDate");
            expect(component.error.messageEndDate).toStrictEqual("errorMessage");
            expect(component.caseBuilderAdminForm.controls.endDate.errors).toStrictEqual({ invalid: true });
        });
    });

    describe("checkOverlap()", () => {
        beforeEach(() => {
            component.caseBuilderAdminForm.controls["caseBuilderAdminSelect"].setValue(1);
        });
        it("should not throw overlap error when provided startDate and endDate is before the existing startDate", () => {
            component.checkOverlap("2023-07-01", "2023-07-30");
            expect(component.error.fieldStartDate).toBeFalsy();
            expect(component.error.messageStartDate).toBeFalsy();
            expect(component.error.fieldEndDate).toBeFalsy();
            expect(component.error.messageEndDate).toBeFalsy();
        });

        it("should not throw overlap error when provided startDate and/or endDate is after the existing endDate", () => {
            component.checkOverlap("2023-10-01");
            expect(component.error.fieldStartDate).toBeFalsy();
            expect(component.error.messageStartDate).toBeFalsy();
            expect(component.error.fieldEndDate).toBeFalsy();
            expect(component.error.messageEndDate).toBeFalsy();
            component.checkOverlap("2023-10-01", "2023-10-30");
            expect(component.error.fieldStartDate).toBeFalsy();
            expect(component.error.messageStartDate).toBeFalsy();
            expect(component.error.fieldEndDate).toBeFalsy();
            expect(component.error.messageEndDate).toBeFalsy();
        });

        it("should throw overlap error when provided startDate and endDate is same as an existing item", () => {
            component.checkOverlap("2023-09-02", "2023-09-30");
            expect(component.error.fieldStartDate).toStrictEqual("startDate");
            expect(component.error.messageStartDate).toStrictEqual("primary.portal.caseBuilderAdmin.preventingOverlap");
            expect(component.error.fieldEndDate).toStrictEqual("endDate");
            expect(component.error.messageEndDate).toStrictEqual("primary.portal.caseBuilderAdmin.preventingOverlap");
        });

        it("should throw overlap error when provided startDate is prior to the existing startDate but provided endDate is between existing startDate and endDate", () => {
            component.checkOverlap("2023-07-01", "2023-09-15");
            expect(component.error.fieldStartDate).toStrictEqual("startDate");
            expect(component.error.messageStartDate).toStrictEqual("primary.portal.caseBuilderAdmin.preventingOverlap");
            expect(component.error.fieldEndDate).toStrictEqual("endDate");
            expect(component.error.messageEndDate).toStrictEqual("primary.portal.caseBuilderAdmin.preventingOverlap");
        });

        it("should throw overlap error when provided startDate is between the existing startDate and endDate and provided endDate is after existing endDate", () => {
            component.checkOverlap("2023-09-15", "2023-10-15");
            expect(component.error.fieldStartDate).toStrictEqual("startDate");
            expect(component.error.messageStartDate).toStrictEqual("primary.portal.caseBuilderAdmin.preventingOverlap");
            expect(component.error.fieldEndDate).toBeFalsy();
            expect(component.error.messageEndDate).toBeFalsy();
        });

        it("should throw overlap error when provided endDate is between the existing startDate and endDate and provided startDate is before existing startDate", () => {
            component.checkOverlap("2023-09-01", "2023-09-20");
            expect(component.error.fieldStartDate).toBeFalsy();
            expect(component.error.messageStartDate).toBeFalsy();
            expect(component.error.fieldEndDate).toStrictEqual("endDate");
            expect(component.error.messageEndDate).toStrictEqual("primary.portal.caseBuilderAdmin.preventingOverlap");
        });

        it("should throw overlap error when provided startDate is prior to the existing startDate and provided endDate is after existing endDate", () => {
            component.checkOverlap("2023-07-01", "2023-10-15");
            expect(component.error.fieldStartDate).toStrictEqual("startDate");
            expect(component.error.messageStartDate).toStrictEqual("primary.portal.caseBuilderAdmin.preventingOverlap");
            expect(component.error.fieldEndDate).toStrictEqual("endDate");
            expect(component.error.messageEndDate).toStrictEqual("primary.portal.caseBuilderAdmin.preventingOverlap");
        });

        it("should throw overlap error when provided startDate and endDate is between the existing startDate and endDate", () => {
            component.checkOverlap("2023-08-05", "2023-08-15");
            expect(component.error.fieldStartDate).toStrictEqual("startDate");
            expect(component.error.messageStartDate).toStrictEqual("primary.portal.caseBuilderAdmin.preventingOverlap");
            expect(component.error.fieldEndDate).toStrictEqual("endDate");
            expect(component.error.messageEndDate).toStrictEqual("primary.portal.caseBuilderAdmin.preventingOverlap");
        });

        it("should throw overlap error when provided startDate is between the existing startDate and endDate and no endDate provided", () => {
            component.checkOverlap("2023-08-05");
            expect(component.error.fieldStartDate).toStrictEqual("startDate");
            expect(component.error.messageStartDate).toStrictEqual("primary.portal.caseBuilderAdmin.preventingOverlap");
            expect(component.error.fieldEndDate).toBeFalsy();
            expect(component.error.messageEndDate).toBeFalsy();
        });

        it("should throw overlap error when provided startDate is before the existing startDate and no endDate provided and submit the form", () => {
            component.formSubmissionFlag = true;
            component.checkOverlap("2023-07-05");
            expect(component.error.fieldStartDate).toBeFalsy();
            expect(component.error.messageStartDate).toBeFalsy();
            expect(component.error.fieldEndDate).toStrictEqual("endDate");
            expect(component.error.messageEndDate).toStrictEqual("primary.portal.caseBuilderAdmin.preventingOverlap");
        });
    });

    describe("closePopup()", () => {
        it("should call close()", () => {
            const spy = jest.spyOn(matDialogRef, "close");
            component.closePopup(true);
            expect(spy).toBeCalledTimes(1);
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
