import { Component, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CloseSepPopupComponent } from "./close-sep-popup.component";
import { NgxsModule, Store } from "@ngxs/store";
import { mockDatePipe, mockMatDialog, mockRouter, mockStore } from "@empowered/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ReactiveFormsModule } from "@angular/forms";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { StatusType } from "@empowered/constants";

const data = {
    qle: {},
    memberInfo: { memberId: 0 },
};

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

describe("CloseSepPopupComponent", () => {
    let component: CloseSepPopupComponent;
    let fixture: ComponentFixture<CloseSepPopupComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CloseSepPopupComponent, MockModalComponent, MockModalHeaderComponent, MockModalFooterComponent],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule],
            providers: [
                { provide: Store, useValue: mockStore },
                { provide: MatDialogRef, useValue: mockMatDialog },
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: DatePipe, useValue: mockDatePipe },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CloseSepPopupComponent);
        store = TestBed.inject(Store);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closeSEP()", () => {
        it("should set changedQLE status to approved", () => {
            expect.assertions(1);
            component.qleToCloseSEP = {
                createdBy: "",
                type: {
                    id: 0,
                    code: "",
                    description: "",
                    daysToReport: 0
                },
                typeId: 0,
                eventDate: "",
                createDate: "",
                enrollmentValidity: null,
                memberComment: "",
                adminComment: "",
                coverageStartDates: null,
                status: null,
                requestedCoverageEndDate: null,
                documents: [{
                    id: 0,
                    fileName: "",
                    description: "",
                    type: "CENSUS",
                    reportType: "DEMOGRAPHICS",
                    uploadDate: "",
                    uploadAdminId: 0,
                    status: "PROCESSING"
                }],
            };
            component.closeSEP();
            expect(component.changedQLE.status).toStrictEqual(StatusType.APPROVED);
        });

        it("should set changedQLE documentIds to an empty array with no documents", () => {
            expect.assertions(1);
            component.qleToCloseSEP = {
                createdBy: "",
                type: {
                    id: 0,
                    code: "",
                    description: "",
                    daysToReport: 0
                },
                typeId: 0,
                eventDate: "",
                createDate: "",
                enrollmentValidity: null,
                memberComment: "",
                adminComment: "",
                coverageStartDates: null,
                status: null,
                requestedCoverageEndDate: null,
                documents: [],
            };
            component.closeSEP();
            expect(component.changedQLE.documentIds).toStrictEqual([]);
        });
    });
});
