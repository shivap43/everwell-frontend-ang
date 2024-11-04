import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { NgxsModule } from "@ngxs/store";
import {
    mockDatePipe,
    mockMatDialog,
    mockMatDialogData,
    mockMatDialogRef,
    MockReplaceTagPipe,
    MockUnsafeHTMLPipe,
} from "@empowered/testing";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AdminApprovalChecklistComponent } from "./admin-approval-checklist.component";
import { CarrierId, ProductId } from "@empowered/constants";
import { AccountList } from "@empowered/api";
import { HttpErrorResponse } from "@angular/common/http";
import { StoreModule } from "@ngrx/store";
describe("AdminApprovalChecklistComponent", () => {
    let component: AdminApprovalChecklistComponent;
    let fixture: ComponentFixture<AdminApprovalChecklistComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdminApprovalChecklistComponent, MockReplaceTagPipe, MockUnsafeHTMLPipe],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule, StoreModule.forRoot({})],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdminApprovalChecklistComponent);
        component = fixture.componentInstance;
    });

    describe("AdminApprovalChecklistComponent", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });
    });
    describe("isDentalLobFromADV()", () => {
        it("should return true if LOB is dental with carrier Id as ADV", () => {
            expect(component.isDentalLobFromADV(CarrierId.ADV, ProductId.DENTAL)).toBe(true);
        });
    });
    describe("setEmployeeCount()", () => {
        it("set the employee count from AccountList", () => {
            const currentAccount = [{ employeeCount: 10 }] as unknown as AccountList;
            component.setEmployeeCount(currentAccount);
            expect(component.employeeCount).toBe(currentAccount.employeeCount);
        });
    });
    describe("displaySubmitError()", () => {
        it("should display submit error status and error code defined error message", () => {
            const error = {
                message: "api error message",
                status: 409,
            } as HttpErrorResponse;
            component.languageStrings = {};
            component.languageStrings["primary.portal.dashboard.adminApprovalChecklist.cancelledRequest"] = "409 Error";
            component.displaySubmitError(error);
            expect(component.hasSubmitApiError).toBe(true);
            expect(component.errorMessage).toBe(
                component.languageStrings["primary.portal.dashboard.adminApprovalChecklist.cancelledRequest"],
            );
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
