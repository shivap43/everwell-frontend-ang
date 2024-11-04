import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Component, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { NgxsModule } from "@ngxs/store";
import { ImportPeoModalComponent } from "./import-peo-modal.component";

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

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;
describe("ImportPeoModalComponent", () => {
    let component: ImportPeoModalComponent;
    let fixture: ComponentFixture<ImportPeoModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ImportPeoModalComponent,
                MockMonSpinnerComponent,
                MockModalComponent,
                MockModalHeaderComponent,
                MockModalFooterComponent,
            ],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ImportPeoModalComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closeModal()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closeModal();
            expect(spy1).toBeCalledTimes(1);
        });
    });
});
