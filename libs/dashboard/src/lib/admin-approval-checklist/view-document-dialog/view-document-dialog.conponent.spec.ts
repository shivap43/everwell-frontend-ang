import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AflacService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { of } from "rxjs";
import { ViewDocumentDialogComponent } from "./view-document-dialog.component";

const mockMatDialogRef = { close: () => {} };
const matDialogData = {
    mpGroup: 111,
    carrier: {
        id: 222,
    },
    isVas: false,
    planName: "Accident",
    signatureRequired: false,
    viewOnly: false,
    signingAdmin: "sign",
    isQ60: true,
};

const mockAflacService = {
    processMasterAppApprovals: (mpGroup: string) => of("saved"),
} as AflacService;

describe("ViewDocumentDialogComponent", () => {
    let component: ViewDocumentDialogComponent;
    let fixture: ComponentFixture<ViewDocumentDialogComponent>;
    let aflacService: AflacService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ViewDocumentDialogComponent],
            providers: [
                LanguageService,
                DatePipe,
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: matDialogData,
                },
                { provide: AflacService, useValue: mockAflacService },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(ViewDocumentDialogComponent);
        component = fixture.componentInstance;
        aflacService = TestBed.inject(AflacService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("submit()", () => {
        it("should set signature value and close dialog when it is not Q60", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.submit("close");
            expect(spy1).toBeCalledWith({ action: "close", signature: "sign" });
        });
        it("should set signature value and  when it Q60", () => {
            const spy1 = jest.spyOn(aflacService, "processMasterAppApprovals").mockReturnValue(of("APPROVED"));
            const spy2 = jest.spyOn(component["dialogRef"], "close");
            component.submit("save");
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalledWith({ action: "save", signature: "sign", status: "APPROVED" });
        });
    });

    describe("close()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.close();
            expect(spy1).toBeCalled();
        });
    });
    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
