import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { mockLanguageService } from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ApplicationPdfDialogComponent } from "./application-pdf-dialog.component";

const data = {
    signedFileURL: "default",
    safeUrl: null,
    planName: "default",
};

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;

describe("ApplicationPdfDialogComponent", () => {
    let component: ApplicationPdfDialogComponent;
    let fixture: ComponentFixture<ApplicationPdfDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ApplicationPdfDialogComponent],
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
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ApplicationPdfDialogComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closeDialog()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closeDialog();
            expect(spy1).toBeCalled();
        });
    });
});
