import { ComponentType } from "@angular/cdk/portal";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Component, Input, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Params } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { of, Subject } from "rxjs";
import { PendedApplicationsModalComponent } from "./pended-applications-modal.component";

const mockDialogRef = {
    close: () => {},
} as MatDialogRef<PendedApplicationsModalComponent>;

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {}

@Component({
    selector: "mat-tab-group",
    template: "",
})
class MockMonMatGroupComponent {
    @Input() selectedIndex!: number;
}

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}

@Component({
    selector: "mat-dialog-content",
    template: "",
})
class MockDialogContentComponent {}

@Component({
    selector: "mat-tab",
    template: "",
})
class MockMatTabComponent {
    @Input() label;
}

@Pipe({
    name: "phone",
})
class MockPhonePipe implements PipeTransform {
    transform(value: number, country: string): string {
        return "123-456-7890";
    }
}

@Pipe({
    name: "ssn",
})
class MockSsnPipe implements PipeTransform {
    transform(value: any): string {
        return "123-456-7890";
    }
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
    fetchPrimaryLanguageValue: (key: string) => key,
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const data = {
    applicationInfo: {
        appTypeIndicator: "c",
        applicationNumber: "123123",
    },
    businessType: "ALL",
};

describe("PendedApplicationsModalComponent", () => {
    let component: PendedApplicationsModalComponent;
    let fixture: ComponentFixture<PendedApplicationsModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                PendedApplicationsModalComponent,
                MockMonSpinnerComponent,
                MockMonIconComponent,
                MockDialogContentComponent,
                MockMonMatGroupComponent,
                MockMatTabComponent,
                MockDialogActionsComponent,
                MockPhonePipe,
                MockSsnPipe,
            ],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: data },
                FormBuilder,
                { provide: LanguageService, useValue: mockLanguageService },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
            ],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([])],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PendedApplicationsModalComponent);
        component = fixture.componentInstance;
    });

    describe("PendedApplicationsModalComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });
    });
    describe("onNext()", () => {
        it("should close the dialog ref", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.onCancelClick();
            expect(spy).toBeCalledTimes(1);
        });
    });
    describe("openResolveApplicationModal()", () => {
        it("should open resolve application model", () => {
            const spy = jest.spyOn(component["dialog"], "open");
            component.openResolveApplicationModal();
            expect(spy).toBeCalledTimes(1);
        });
    });
    describe("ngOnDestroy()", () => {
        it("should unsubscribe from applicationDetailSubscription subscription", () => {
            if (component.applicationDetailSubscription) {
                component.applicationDetailSubscription.unsubscribe();
            }
            const mockSubject = new Subject<Params>();
            component.applicationDetailSubscription = mockSubject.subscribe();
            const spy = jest.spyOn(component["applicationDetailSubscription"], "unsubscribe");
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalledTimes(1);
        });
        it("should unsubscribe from downlaodApplicationSubs subscription", () => {
            if (component.downlaodApplicationSubs) {
                component.downlaodApplicationSubs.unsubscribe();
            }
            const mockSubject = new Subject<Params>();
            component.downlaodApplicationSubs = mockSubject.subscribe();
            const spy = jest.spyOn(component["downlaodApplicationSubs"], "unsubscribe");
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });
});
