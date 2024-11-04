import { PlanOfferingRedirect } from "@empowered/api";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { provideMockStore } from "@ngrx/store/testing";

import { RedirectConfirmationModalComponent } from "./redirect-confirmation-modal.component";
import { Component, Input } from "@angular/core";

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

@Component({
    selector: "mat-dialog-content",
    template: "",
})
class MockDialogContentComponent {}

@Component({
    selector: "mat-dialog-actions",
    template: "",
})
class MockDialogActionsComponent {}

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
    carrierId: 1,
    link: "link",
    linkText: "link text",
} as PlanOfferingRedirect;

describe("RedirectConfirmationModalComponent", () => {
    let component: RedirectConfirmationModalComponent;
    let fixture: ComponentFixture<RedirectConfirmationModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                RedirectConfirmationModalComponent,
                MockMonIconComponent,
                MockDialogContentComponent,
                MockDialogActionsComponent,
            ],
            providers: [
                NGRXStore,
                provideMockStore({}),
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RedirectConfirmationModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
