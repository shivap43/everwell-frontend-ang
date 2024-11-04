import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, Input } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { DeactivateReactivatePopupComponent } from "./deactivate-reactivate-popup.component";
import { UserService, UserState } from "@empowered/user";
import { HighestLevel } from "@empowered/constants";

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

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

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
    value: false,
};

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;

describe("DeactivateReactivatePopupComponent", () => {
    let component: DeactivateReactivatePopupComponent;
    let fixture: ComponentFixture<DeactivateReactivatePopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                DeactivateReactivatePopupComponent,
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
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                UserService,
            ],
            imports: [NgxsModule.forRoot([UserState]), HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DeactivateReactivatePopupComponent);
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
