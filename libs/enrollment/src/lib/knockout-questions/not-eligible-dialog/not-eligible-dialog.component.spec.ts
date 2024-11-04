import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { NotEligibleDialogComponent } from "./not-eligible-dialog.component";
import { KnockoutType } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { mockMatDialog, mockMatDialogRef } from "@empowered/testing";

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}

@Component({
    template: "",
    selector: "empowered-modal",
})
class MockModalComponent {
    @Input() showCancel: boolean;
}

@Component({
    template: "",
    selector: "empowered-modal-header",
})
class MockModalHeaderComponent {}

@Component({
    template: "",
    selector: "empowered-modal-footer",
})
class MockModalFooterComponent {}

@Component({
    selector: "mat-dialog-actions",
    template: "",
})
class MockDialogActionsComponent {}

@Component({
    selector: "mat-dialog-content",
    template: "",
})
class MockDialogContentComponent {}

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

let knockoutOptions: KnockoutType;
const data = {
    knockout: {
        text: "knockoutText",
        type: knockoutOptions,
    },
    isProducer: true,
};

describe("NotEligibleDialogComponent", () => {
    let component: NotEligibleDialogComponent;
    let fixture: ComponentFixture<NotEligibleDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                NotEligibleDialogComponent,
                MockMonSpinnerComponent,
                MockModalComponent,
                MockModalHeaderComponent,
                MockModalFooterComponent,
                MockDialogActionsComponent,
                MockDialogContentComponent,
                MockMonIconComponent,
            ],
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
                    useValue: data,
                },
                LanguageService,
            ],
            schemas: [NO_ERRORS_SCHEMA],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(NotEligibleDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onClose()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onClose();
            expect(spy1).toBeCalledWith({ action: "ok" });
        });
    });

    describe("onEdit()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onEdit();
            expect(spy1).toBeCalledWith({ action: "edit" });
        });
    });

    describe("onOK()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onOK();
            let knockoutType: KnockoutType;
            expect(spy1).toBeCalledWith({ action: "eligibilityCheck", knockoutType: knockoutType });
        });
    });
});
