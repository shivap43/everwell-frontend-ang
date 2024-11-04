import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { NGRXStore } from "@empowered/ngrx-store";
import { mockMatDialogRef, MockReplaceTagPipe } from "@empowered/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { PaperCopyModalComponent } from "./paper-copy-modal.component";
import { of } from "rxjs";

const mockMatDialogData = {
    preliminaryFormPaths: [],
    memberId$: of(7),
    mpGroupId: 1234,
    cartIds: [],
};

describe("PaperCopyModalComponent", () => {
    let component: PaperCopyModalComponent;
    let fixture: ComponentFixture<PaperCopyModalComponent>;
    let mockDialogRef: MatDialogRef<PaperCopyModalComponent, any>;
    let mockNgrxStore: NGRXStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PaperCopyModalComponent, MockReplaceTagPipe],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                NGRXStore,
                provideMockStore({}),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PaperCopyModalComponent);
        component = fixture.componentInstance;
        mockDialogRef = TestBed.inject(MatDialogRef);
        mockNgrxStore = TestBed.inject(NGRXStore);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should call downloadPreliminaryForm method", () => {
            const spy = jest.spyOn(component, "downloadPreliminaryForm");
            component.ngOnInit();
            expect(spy).toBeCalled();
        });
    });

    describe("downloadPreliminaryForm()", () => {
        it("should make downloadPreliminaryForm api call", () => {
            const spy = jest.spyOn(mockNgrxStore, "dispatch");
            component.downloadPreliminaryForm();
            expect(component.isSpinnerLoading).toBe(true);
            expect(spy).toBeCalled();
        });
    });

    describe("onPrint()", () => {
        it("should open the preliminary form pdf in new window", () => {
            component.unsignedFileURL = "resources/aflac/preliminaryForm.pdf";
            const spy = jest.spyOn(window, "open");
            component.onPrint();
            expect(spy).toBeCalledWith(component.unsignedFileURL);
        });
    });

    describe("onNext()", () => {
        it("should show the next preliminary form in line", () => {
            component.preliminaryStatementAcknowledgement.setValue(true);
            component.formIndex = 0;
            const spy = jest.spyOn(component, "downloadPreliminaryForm");
            component.onNext();
            expect(component.preliminaryStatementAcknowledgement.value).toStrictEqual(null);
            expect(component.formIndex).toStrictEqual(1);
            expect(spy).toBeCalledTimes(1);
        });

        it("should set required error on preliminaryStatementAcknowledgement form control", () => {
            component.preliminaryStatementAcknowledgement.setValue(false);
            component.onNext();
            expect(component.preliminaryStatementAcknowledgement.errors.required).toBe(true);
            expect(component.preliminaryStatementAcknowledgement.touched).toBe(true);
        });
    });

    describe("onBack()", () => {
        it("should show the previous preliminary form that was open", () => {
            component.formIndex = 1;
            component.unsignedFileURLs = ["resources/aflac/preliminaryForm.pdf"];
            component.onBack();
            expect(component.preliminaryStatementAcknowledgement.value).toBe(true);
            expect(component.formIndex).toStrictEqual(0);
            expect(component.unsignedFileURL).toStrictEqual("resources/aflac/preliminaryForm.pdf");
        });
    });

    describe("onContinue()", () => {
        it("should close the paper copy modal and redirect to application flow step", () => {
            component.preliminaryStatementAcknowledgement.setValue(true);
            const spy = jest.spyOn(mockDialogRef, "close");
            component.onContinue();
            expect(spy).toBeCalledWith({ routeToAppFlow: true });
        });

        it("should set required error on preliminaryStatementAcknowledgement form control", () => {
            component.preliminaryStatementAcknowledgement.setValue(false);
            component.onContinue();
            expect(component.preliminaryStatementAcknowledgement.errors.required).toBe(true);
            expect(component.preliminaryStatementAcknowledgement.touched).toBe(true);
        });
    });

    describe("onDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
