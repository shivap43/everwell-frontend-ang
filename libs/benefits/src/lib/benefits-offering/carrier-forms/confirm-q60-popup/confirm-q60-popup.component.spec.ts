import { Component, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { NgxsModule, Store } from "@ngxs/store";
import { of } from "rxjs";
import { HttpClientTestingModule } from "@angular/common/http/testing";

import { ConfirmQ60PopupComponent } from "./confirm-q60-popup.component";

const mockMatDialogRef = {} as MatDialogRef<ConfirmQ60PopupComponent>;

const mockStore = {
    selectSnapshot: () => of(""),
} as unknown as Store;

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {}

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}

@Component({
    selector: "empowered-modal",
    template: "",
})
class MockModalComponent {}

@Component({
    selector: "empowered-modal-header",
    template: "",
})
class MockModalHeaderComponent {}

@Component({
    selector: "empowered-modal-footer",
    template: "",
})
class MockModalFooterComponent {}

describe("ConfirmQ60PopupComponent", () => {
    let component: ConfirmQ60PopupComponent;
    let fixture: ComponentFixture<ConfirmQ60PopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ConfirmQ60PopupComponent,
                MockMonIconComponent,
                MockMonSpinnerComponent,
                MockModalComponent,
                MockModalHeaderComponent,
                MockModalFooterComponent,
            ],
            imports: [MatDialogModule, HttpClientTestingModule, NgxsModule.forRoot([])],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmQ60PopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
