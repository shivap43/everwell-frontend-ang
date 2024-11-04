import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { ZeroPercentCommissionComponent } from "./zero-percent-commission.component";

@Component({
    selector: "empowered-modal",
    template: "",
})
class MockEmpoweredModalComponent {}
@Component({
    selector: "empowered-modal-header",
    template: "",
})
class MockEmpoweredModalHeaderComponent {}
@Component({
    selector: "empowered-modal-footer",
    template: "",
})
class MockEmpoweredModalFooterComponent {}

describe("ZeroPercentCommissionComponent", () => {
    let component: ZeroPercentCommissionComponent;
    let fixture: ComponentFixture<ZeroPercentCommissionComponent>;
    let matDialogRef: MatDialogRef<ZeroPercentCommissionComponent>;

    beforeEach(async () => {
        const mockMatDialogRef = { close: () => {} };

        await TestBed.configureTestingModule({
            declarations: [
                ZeroPercentCommissionComponent,
                MockEmpoweredModalComponent,
                MockEmpoweredModalHeaderComponent,
                MockEmpoweredModalFooterComponent,
            ],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ZeroPercentCommissionComponent);
        component = fixture.componentInstance;
        matDialogRef = TestBed.inject(MatDialogRef);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("saveCommission()", () => {
        it("should called when clicked on confirm spilt button with true", () => {
            const spy = jest.spyOn(matDialogRef, "close");
            component.saveCommission();
            expect(spy).toBeCalledWith(true);
        });
    });

    describe("cancelCommission()", () => {
        it("should called when clicked on update spilt button with false", () => {
            const spy = jest.spyOn(matDialogRef, "close");
            component.cancelCommission();
            expect(spy).toBeCalledWith(false);
        });
    });
});
