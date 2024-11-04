import { Component, Input, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EmployerContributionsComponent } from "./employer-contributions.component";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/portal";
import { of } from "rxjs";
import { LanguageService, ReplaceTagPipe } from "@empowered/language";
import { MemberFlexDollar } from "@empowered/constants";

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

@Component({
    selector: "mat-dialog-actions",
    template: "",
})
class MockDialogActionsComponent {}

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as MatDialog;

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockDialogData = {
    accountName: "some account name",
    employeeName: "some employee name",
    selectedMemberFlexDollars: [{ amount: 311 } as MemberFlexDollar],
};

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any) {
        return "replaced";
    }
}

describe("EmployerContributionsComponent", () => {
    let component: EmployerContributionsComponent;
    let fixture: ComponentFixture<EmployerContributionsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EmployerContributionsComponent, MockMonIconComponent, MockDialogActionsComponent, MockReplaceTagPipe],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockDialogData,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EmployerContributionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
