import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EnrollmentService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { mockLanguageService, mockEnrollmentsService, mockMatDialog, mockMatDialogData } from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CoverageChangingComponent } from "./coverage-changing.component";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { of, Subscription } from "rxjs";

describe("CoverageChangingComponent", () => {
    let component: CoverageChangingComponent;
    let fixture: ComponentFixture<CoverageChangingComponent>;
    let enrollmentService: EnrollmentService;
    let mockDialogRef: MatDialogRef<CoverageChangingComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CoverageChangingComponent],
            imports: [HttpClientTestingModule, ReactiveFormsModule],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: EnrollmentService,
                    useValue: mockEnrollmentsService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CoverageChangingComponent);
        component = fixture.componentInstance;
        enrollmentService = TestBed.inject(EnrollmentService);
        const formBuilder: FormBuilder = new FormBuilder();
        component.coverageChangeForm = formBuilder.group({
            description: [""],
            changeReasons: [""],
        });
        mockDialogRef = TestBed.inject(MatDialogRef);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("checkSelectedOption()", () => {
        it("should make the field optional if reason is not 'other'", () => {
            component.checkSelectedOption("Other");
            expect(component.isOptional).toBeFalsy();
        });
        it("should make the field mandatory if reason is 'other'", () => {
            component.checkSelectedOption("Declined");
            expect(component.isOptional).toBeTruthy();
        });
    });
    describe("getCoverageChangingReasons()", () => {
        it("should make the coverageChangingReasons to be empty with reasons having 'By Request'", () => {
            jest.spyOn(enrollmentService, "getCoverageChangeReasons").mockReturnValueOnce(of(["By Request"]));
            component.getCoverageChangingReasons();
            expect(component.coverageChangingReasons).toStrictEqual([]);
            expect(component.showSpinner).toBeFalsy();
        });
        it("should make the coverageChangingReasons to be 'Other'", () => {
            jest.spyOn(enrollmentService, "getCoverageChangeReasons").mockReturnValueOnce(of(["By Request", "Other"]));
            component.getCoverageChangingReasons();
            expect(component.coverageChangingReasons).toStrictEqual(["Other"]);
        });
    });

    describe("closeChangePopup", () => {
        it("should close the mat dialog", () => {
            const spy = jest.spyOn(mockDialogRef, "close");
            component.closeChangePopup();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("convertToCamelCase", () => {
        it("should convert the string to camel case", () => {
            expect(component.convertToCamelCase("abcd")).toBe("Abcd");
        });
    });
    describe("ngOnDestroy", () => {
        it("should unsubscribe from all subscriptions", () => {
            const spy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [of(null).subscribe()];
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalled();
        });
    });
});
