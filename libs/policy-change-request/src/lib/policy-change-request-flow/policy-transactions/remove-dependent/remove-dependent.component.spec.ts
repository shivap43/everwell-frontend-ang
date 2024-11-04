import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NgxsModule } from "@ngxs/store";
import { NgxMaskPipe } from "ngx-mask";
import { Subscription } from "rxjs";
import { RemoveDependentComponent } from "./remove-dependent.component";
import { mockMatDialog, mockDatePipe } from "@empowered/testing";
import { PolicyChangeRequestCancelPopupComponent } from "@empowered/ui";
import { DatePipe } from "@angular/common";
import { MatDatepicker } from "@angular/material/datepicker";

@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
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

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}
describe("RemoveDependentComponent", () => {
    let component: RemoveDependentComponent;
    let fixture: ComponentFixture<RemoveDependentComponent>;
    let mockDialog: MatDialog;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                RemoveDependentComponent,
                MockRichTooltipDirective,
                MockPcrFileUploadComponent,
                MockMatDatePickerDirective,
                MockMonSpinnerComponent,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MatDialogRef, useValue: {} },
                { provide: NgxMaskPipe, useValue: {} },
                { provide: DatePipe, useValue: mockDatePipe },
            ],
            imports: [ReactiveFormsModule, HttpClientTestingModule, NgxsModule.forRoot()],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RemoveDependentComponent);
        component = fixture.componentInstance;
        mockDialog = TestBed.inject(MatDialog);
    });

    describe("RemoveDependentComponent", () => {
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

        describe("cancel()", () => {
            it("should open PolicyChangeRequestCancelPopupComponent on clicking cancel", () => {
                const openSpy = jest.spyOn(mockDialog, "open");
                component.cancel();
                expect(openSpy).toHaveBeenCalledWith(PolicyChangeRequestCancelPopupComponent, expect.anything());
            });
        });

        describe("reasonForRemovalSelection()", () => {
            beforeAll(() => {
                component.minDate = null;
                component.maxDate = null;
            });

            it("should set minDate as today if event is not death", () => {
                component.reasonForRemovalSelection("Request");
                expect(mockDatePipe.transform(component.minDate)).toStrictEqual(mockDatePipe.transform(new Date()));
                expect(component.maxDate).toBe(null);
            });
            it("should set maxDate if event is death", () => {
                component.reasonForRemovalSelection("Death");
                expect(component.minDate).toBe(null);
                expect(mockDatePipe.transform(component.maxDate)).toStrictEqual(mockDatePipe.transform(new Date()));
            });
        });
    });
});
