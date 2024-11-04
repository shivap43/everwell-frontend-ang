import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EnrollmentMethodSelectComponent } from "./enrollment-method-select.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { provideMockStore } from "@ngrx/store/testing";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { mockMatDialog, mockMatDialogData, mockMatDialogRef, mockShoppingService, mockStore } from "@empowered/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { Router } from "@angular/router";
import { EnrollmentMethodDetail, ShoppingService } from "@empowered/api";
import { EnrollmentMethod } from "@empowered/constants";
import { of } from "rxjs";

const MOCK_ENROLLMENT_METHOD_DATA: EnrollmentMethodDetail[] = [{ "name":"FACE_TO_FACE","description":"Assisted Enrollment - F2F","enrollmentStates":[{"state":{"abbreviation":"GA","name":"Georgia"},"crossBorderAllowed":false}]},
{"name":"SELF_SERVICE","description":"Self Service","enrollmentStates":[{"state":{"abbreviation":"GA","name":"Georgia"},"crossBorderAllowed":false}]},
{"name":"HEADSET","description":"Assisted Phone Call Enrollment","enrollmentStates":[{"state":{"abbreviation":"GA","name":"Georgia"},"crossBorderAllowed":false}]},
{"name":"VIRTUAL_FACE_TO_FACE","description":"Virtual Face to Face Enrollment","enrollmentStates":[{"state":{"abbreviation":"GA","name":"Georgia"},"crossBorderAllowed":false}]}];

describe("EnrollmentMethodSelectComponent", () => {
    let component: EnrollmentMethodSelectComponent;
    let fixture: ComponentFixture<EnrollmentMethodSelectComponent>;
    let router: Router;
    let shoppingService: ShoppingService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EnrollmentMethodSelectComponent],
            imports: [HttpClientTestingModule, RouterTestingModule],
            providers: [
                { provide: Store, useValue: mockStore },
                { provide: MatDialog, useValue: mockMatDialog },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                { provide: MAT_DIALOG_DATA, useValue: mockMatDialogData },
                {
                    provide: ShoppingService,
                    useValue: mockShoppingService,
                },
                provideMockStore({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EnrollmentMethodSelectComponent);
        router = TestBed.inject(Router);
        component = fixture.componentInstance;
        fixture.detectChanges();
        shoppingService = TestBed.inject(ShoppingService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("initializeEnrollmentMethodDetails", () => {
        it("should initialize to FACE_TO_FACE", () => {
            component.initializeEnrollmentMethodDetails();
            expect(component.value).toBe(EnrollmentMethod.FACE_TO_FACE);
        });
        it("should initialize to HEADSET", () => {
            component.currentEnrollment = "HEADSET";
            jest.spyOn(shoppingService, "getEnrollmentMethods").mockReturnValue(of(MOCK_ENROLLMENT_METHOD_DATA));
            component.initializeEnrollmentMethodDetails();
            expect(component.value).toBe(EnrollmentMethod.HEADSET);
        });
    });

    describe("updateEnrollmentMethod", () => {
        it("should update store with provided enrolment method", () => {
            const spy1 = jest.spyOn(component["ngrxStore"], "dispatch");
            component.updateEnrollmentMethod(EnrollmentMethod.FACE_TO_FACE);
            expect(spy1).toBeCalledTimes(1);
        });
    });

    describe("inEnrollmentFlow()", () => {
        it("should not set enrollment method when user is not in the enrollment flow", () => {
            jest.spyOn(router, "url", "get").mockReturnValue("/member/3/enrollment/benefit-summary/coverage-summary");
            component.inEnrollmentFlow();
            expect(component.currentEnrollment).toBeUndefined();
        });
    });

    describe("onChange()", () => {
        it("should update value when selection is changed", () => {
            component.onChange("FACE_TO_FACE" as EnrollmentMethod);
            expect(component.value).toBe("FACE_TO_FACE");
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
