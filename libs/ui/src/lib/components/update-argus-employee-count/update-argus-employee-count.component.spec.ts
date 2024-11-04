import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { BenefitsOfferingService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { mockBenefitsOfferingService, mockLanguageService, mockMatDialogData, mockMatDialogRef } from "@empowered/testing";
import { throwError } from "rxjs";
import { UpdateArgusEmployeeCountComponent } from "./update-argus-employee-count.component";
import { NgxsModule } from "@ngxs/store";

describe("UpdateArgusEmployeeCountComponent", () => {
    let component: UpdateArgusEmployeeCountComponent;
    let fixture: ComponentFixture<UpdateArgusEmployeeCountComponent>;
    let matdialogRef: MatDialogRef<UpdateArgusEmployeeCountComponent>;
    let benefitsOfferingService: BenefitsOfferingService;
    let formBuilder: FormBuilder;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UpdateArgusEmployeeCountComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot(), ReactiveFormsModule],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                FormBuilder,
                HttpClientTestingModule,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(UpdateArgusEmployeeCountComponent);
        component = fixture.componentInstance;
        benefitsOfferingService = TestBed.inject(BenefitsOfferingService);
        formBuilder = TestBed.inject(FormBuilder);
    });
    beforeEach(() => {
        matdialogRef = TestBed.inject(MatDialogRef);
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("ngOnInit()", () => {
        it("should call employeeADVCountChanged function", () => {
            const spy1 = jest.spyOn(component, "employeeADVCountChanged");
            component.ngOnInit();
            expect(spy1).toBeCalledTimes(1);
        });
    });

    describe("onUpdateClick()", () => {
        it("should call benefitsOfferingService.updateArgusTotalEligibleEmployees api", () => {
            component.updateEmployeeCountForm = formBuilder.group({
                eligibleADVEmp: [null],
            });
            const spy1 = jest.spyOn(benefitsOfferingService, "updateArgusTotalEligibleEmployees");
            const spy2 = jest.spyOn(matdialogRef, "close");
            component.onUpdateClick();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
        it("should display details.message on api error", () => {
            component.updateEmployeeCountForm = formBuilder.group({
                eligibleADVEmp: [null],
            });

            const error = {
                error: {
                    status: 503,
                    code: "code",
                    message: "503 error messsage",
                    details: [{ message: "field error" }],
                },
            };
            jest.spyOn(benefitsOfferingService, "updateArgusTotalEligibleEmployees").mockReturnValue(throwError(error));
            component.onUpdateClick();
            expect(component.errorMessage).toBe(error.error.details[0].message);
        });
        it("should return error.message of 503, 403 and 500 on api error", () => {
            component.updateEmployeeCountForm = formBuilder.group({
                eligibleADVEmp: [null],
            });

            const error = {
                error: {
                    status: 503,
                    code: "code",
                    message: "503 error messsage",
                },
            };
            jest.spyOn(benefitsOfferingService, "updateArgusTotalEligibleEmployees").mockReturnValue(throwError(error));
            component.onUpdateClick();
            expect(component.errorMessage).toBe(error.error.message);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
