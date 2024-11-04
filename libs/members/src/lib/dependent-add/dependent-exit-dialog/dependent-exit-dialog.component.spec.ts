import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { UserService, UserState } from "@empowered/user";
import { Store } from "@ngrx/store";
import { DependentExitDialogComponent } from "@empowered/ui";
import { mockMatDialogRef } from "@empowered/testing";
import { ComponentType } from "@angular/cdk/portal";
import { of } from "rxjs";

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
    fetchPrimaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const data = {
    title: "",
    content: "",
    primaryButton: {
        buttonTitle: "save",
        buttonAction: jest.fn(() => {}),
    },
    secondaryButton: {
        buttonTitle: "do not save",
        buttonAction: jest.fn(() => {}),
    },
    profileChangesData: [],
};

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as MatDialog;

describe("DependentExitDialogComponent", () => {
    let component: DependentExitDialogComponent;
    let fixture: ComponentFixture<DependentExitDialogComponent>;
    let matdialogRef: MatDialogRef<any>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                DependentExitDialogComponent,
                MockMonSpinnerComponent,
                MockModalComponent,
                MockDialogActionsComponent,
                MockDialogContentComponent,
                MockMonIconComponent,
            ],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                UserService,
                Store,
            ],
            imports: [NgxsModule.forRoot([UserState]), HttpClientTestingModule, MatDialogModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DependentExitDialogComponent);
        component = fixture.componentInstance;
        matdialogRef = TestBed.inject(MatDialogRef);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closePopup()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(matdialogRef, "close");
            component.closePopup();
            expect(spy1).toBeCalledWith();
        });
    });

    describe("primaryButtonClick()", () => {
        it("should close the dialog", () => {
            const spy = jest.spyOn(matdialogRef, "close");
            component.primaryButtonClick();
            expect(spy).toBeCalled();
        });
    });

    describe("secondaryButtonClick()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(matdialogRef, "close");
            component.secondaryButtonClick();
            expect(spy1).toBeCalled();
        });
    });
});
