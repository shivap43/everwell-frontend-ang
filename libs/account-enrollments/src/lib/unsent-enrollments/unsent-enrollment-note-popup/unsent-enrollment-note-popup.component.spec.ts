import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { UnsentEnrollmentNotePopupComponent } from "./unsent-enrollment-note-popup.component";
import { ReactiveFormsModule } from "@angular/forms";
import { mockMatDialog } from "@empowered/testing";

const data = {
    title: "title",
    editRowData: {
        enrollmentComment: "comment",
    },
    maxLength: 1,
};

describe("UnsentEnrollmentNotePopupComponent", () => {
    let component: UnsentEnrollmentNotePopupComponent;
    let fixture: ComponentFixture<UnsentEnrollmentNotePopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UnsentEnrollmentNotePopupComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                LanguageService,
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(UnsentEnrollmentNotePopupComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("initializeWorkForm()", () => {
        it("should initialize formControl with the comment if it is present", () => {
            component.data.editRowData.enrollmentComment = "comment";
            component.initializeWorkForm();
            const formGroup = component.notePopUpForm.controls.noteData;
            const formValues = { enrollmentComment: "comment" };
            expect(formGroup.value).toEqual(formValues);
        });

        it("should initialize formControl with null if comment is not present", () => {
            component.data.editRowData.enrollmentComment = null;
            component.initializeWorkForm();
            const formGroup = component.notePopUpForm.controls.noteData;
            expect(formGroup.value).toEqual({ enrollmentComment: "" });
        });
    });

    describe("onCancelClick()", () => {
        it("should close the dialog on click of cancel", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCancelClick();
            expect(spy1).toBeCalled();
        });
    });

    describe("onAddNote()", () => {
        it("should close the dialog after adding note with given comment", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.data.editRowData.enrollmentComment = "comment";
            component.initializeWorkForm();
            const formGroup = component.notePopUpForm;
            component.onAddNote(formGroup.value, true);
            expect(spy1).toBeCalledWith({ data: { enrollmentComment: "comment" } });
        });
    });
});
