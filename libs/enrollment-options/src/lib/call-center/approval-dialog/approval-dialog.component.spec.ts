import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ApprovalDialogComponent } from "./approval-dialog.component";
import { DatePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { mockDatePipe, mockLanguageService } from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

const data = {
    action: "action",
};

const mockMatDialog = {
    close: ({ dialogResult = true }) => null,
} as MatDialogRef<any>;

describe("ApprovalDialogComponent", () => {
    let component: ApprovalDialogComponent;
    let fixture: ComponentFixture<ApprovalDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ApprovalDialogComponent],
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
                    provide: DatePipe,
                    useValue: mockDatePipe,
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
        fixture = TestBed.createComponent(ApprovalDialogComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onCancelApprove()", () => {
        it("should close the dialog on approve", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCancelApprove();
            expect(spy1).toBeCalledWith({ action: "closeApprove" });
        });
    });

    describe("onCancelRemove()", () => {
        it("should close the dialog on remove", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCancelRemove();
            expect(spy1).toBeCalledWith({ action: "closeRemove" });
        });
    });

    describe("onCancelSameCallCenterOverlap()", () => {
        it("should close the dialog if same call center overlap", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCancelSameCallCenterOverlap();
            expect(spy1).toBeCalledWith({ action: "closeSameCallCenterOverlap" });
        });
    });

    describe("onCancelSameCallCenterAdjacent()", () => {
        it("should close the dialog if same call center are adjacent", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCancelSameCallCenterAdjacent();
            expect(spy1).toBeCalledWith({ action: "closeSameCallCenterAdjacent" });
        });
    });

    describe("onCancel()", () => {
        it("should close the dialog on cancel", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCancel();
            expect(spy1).toBeCalledWith({ action: "close" });
        });
    });
});
