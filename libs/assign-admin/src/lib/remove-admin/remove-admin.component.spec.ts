import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, Input } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { UserService, UserState } from "@empowered/user";
import { AdminService } from "@empowered/api";
import { HighestLevel, Admin } from "@empowered/constants";
import { RemoveAdminComponent } from "./remove-admin.component";

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
    dataSourceLength: 0,
    selectedAdmin: {
        id: 0,
        name: {
            firstName: "firstName",
            lastName: "lastName",
        },
        highestLevel: HighestLevel,
    },
    mpgroup: 1,
};

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;

describe("RemoveAdminComponent", () => {
    let component: RemoveAdminComponent;
    let fixture: ComponentFixture<RemoveAdminComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                RemoveAdminComponent,
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
                UserService,
                AdminService,
            ],
            imports: [NgxsModule.forRoot([UserState]), HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RemoveAdminComponent);
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

    describe("remove()", () => {
        it("should remove the admin", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.remove();
            expect(spy1).toBeCalled();
        });
    });
});
