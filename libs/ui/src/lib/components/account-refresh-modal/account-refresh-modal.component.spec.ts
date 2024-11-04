import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AccountRefreshModalComponent } from "./account-refresh-modal.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatMenuModule } from "@angular/material/menu";

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

const data = ["sicCode : A1234", "industryCode : A", "acctType: false"];

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;
describe.skip("AccountRefreshModalComponent", () => {
    let component: AccountRefreshModalComponent;
    let fixture: ComponentFixture<AccountRefreshModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                AccountRefreshModalComponent,
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
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule, MatMenuModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AccountRefreshModalComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closeModal()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closeModal();
            expect(spy1).toBeCalled();
        });
    });
});
