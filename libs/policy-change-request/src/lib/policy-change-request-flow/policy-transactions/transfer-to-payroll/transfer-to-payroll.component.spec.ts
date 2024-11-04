import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NgxsModule } from "@ngxs/store";
import { NgxMaskPipe } from "ngx-mask";
import { Subscription } from "rxjs";
import { TransferToPayrollComponent } from "./transfer-to-payroll.component";
import { mockMatDialog, mockDatePipe } from "@empowered/testing";
import { DatePipe } from "@angular/common";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}

@Component({
    template: "",
    selector: "empowered-pcr-file-upload",
})
class MockPcrFileUploadComponent {
    @Input() formId: number;
    @Input() mpGroup: number;
    @Input() memberId: number;
    @Input() cifNumber: string;
    @Input() isFileUploadFromTransaction: boolean;
    @Input() documentIds = [];
    @Input() newDocumentIds: Array<number>;
}

describe("TransferToPayrollComponent", () => {
    let component: TransferToPayrollComponent;
    let fixture: ComponentFixture<TransferToPayrollComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TransferToPayrollComponent, MockMonSpinnerComponent, MockPcrFileUploadComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MatDialogRef, useValue: {} },
                { provide: NgxMaskPipe, useValue: {} },
                { provide: DatePipe, useValue: mockDatePipe },
            ],
            imports: [ReactiveFormsModule, HttpClientTestingModule, NgxsModule.forRoot(), MatDatepickerModule, MatNativeDateModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TransferToPayrollComponent);
        component = fixture.componentInstance;
    });

    describe("TransferToPayrollComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("ngOnDestroy()", () => {
            it("should cleanup subscriptions", () => {
                const unsubscribeSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
                component.subscriptions = [new Subscription()];
                component.ngOnDestroy();
                expect(unsubscribeSpy).toHaveBeenCalled();
            });
        });
    });
});
