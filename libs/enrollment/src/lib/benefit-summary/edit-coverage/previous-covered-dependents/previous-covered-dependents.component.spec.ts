import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, Input } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { PreviousCoveredDependentsComponent } from "./previous-covered-dependents.component";
import { MatTableModule } from "@angular/material/table";

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

const data = {
    dependentId: 1,
    name: "name",
    validity: {
        effectiveStarting: "08/08/2022",
        expiresAfter: "09/08/2022",
    },
};

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;
describe("PreviousCoveredDependentsComponent", () => {
    let component: PreviousCoveredDependentsComponent;
    let fixture: ComponentFixture<PreviousCoveredDependentsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                PreviousCoveredDependentsComponent,
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
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                LanguageService,
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, MatTableModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PreviousCoveredDependentsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closeForm()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closeForm();
            expect(spy1).toBeCalledWith();
        });
    });
});
