import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { mockLanguageService } from "@empowered/testing";
import { Store } from "@ngxs/store";
import { of } from "rxjs";
import { ConfirmationDialogComponent } from "./confirmation-dialog.component";
import { ConfirmationDialogData } from "./confirmation-dialog.model";

const mockStore = {
    dispatch: () => of({}),
    select: () => of({}),
    selectSnapshot: () => of({}),
};

const mockConfirmationDialogData: Partial<ConfirmationDialogData> = {
    primaryButton: { buttonAction: jest.fn(() => {}) },
    secondaryButton: { buttonAction: jest.fn(() => {}) },
};

class MockMatDialogRef {
    close(value = "") {}
}

describe("ConfirmationDialogComponent", () => {
    let component: ConfirmationDialogComponent;
    let fixture: ComponentFixture<ConfirmationDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmationDialogComponent],
            providers: [
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: MatDialogRef, useClass: MockMatDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: mockConfirmationDialogData },
                { provide: Store, useValue: mockStore },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmationDialogComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("primaryButtonClick()", () => {
        it("should run primary button action and close dialog with save", () => {
            const dialogRefSpy = jest.spyOn(component["dialogRef"], "close");
            component.primaryButtonClick();
            expect(mockConfirmationDialogData.primaryButton.buttonAction).toHaveBeenCalled();
            expect(dialogRefSpy).toHaveBeenCalledWith("Save");
        });
    });

    describe("secondaryButtonClick()", () => {
        it("should run secondary button action and close dialog with don't save", () => {
            const dialogRefSpy = jest.spyOn(component["dialogRef"], "close");
            component.secondaryButtonClick();
            expect(mockConfirmationDialogData.secondaryButton.buttonAction).toHaveBeenCalled();
            expect(dialogRefSpy).toHaveBeenCalledWith("Don't Save");
        });
    });

    describe("closePopup()", () => {
        it("should close dialog", () => {
            const dialogRefSpy = jest.spyOn(component["dialogRef"], "close");
            component.closePopup();
            expect(dialogRefSpy).toHaveBeenCalled();
        });
    });
});
