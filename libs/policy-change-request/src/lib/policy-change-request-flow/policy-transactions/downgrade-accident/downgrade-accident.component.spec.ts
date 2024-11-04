import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { AffectedPolicies } from "@empowered/api";
import { mockMatDialog } from "@empowered/testing";
import { PolicyChangeRequestCancelPopupComponent, PolicyChangeRequestConfirmationPopupComponent } from "@empowered/ui";
import { NgxsModule } from "@ngxs/store";
import { Subscription } from "rxjs";
import { DowngradeAccidentComponent } from "./downgrade-accident.component";

describe("DowngradeAccidentComponent", () => {
    let component: DowngradeAccidentComponent;
    let fixture: ComponentFixture<DowngradeAccidentComponent>;
    let mockDialog: MatDialog;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DowngradeAccidentComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MatDialogRef, useValue: {} },
            ],
            imports: [NgxsModule.forRoot(), ReactiveFormsModule, HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DowngradeAccidentComponent);
        component = fixture.componentInstance;
        mockDialog = TestBed.inject(MatDialog);
    });

    describe("DowngradeAccidentComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("populateRiderList()", () => {
            const sampleRiderPolicies: AffectedPolicies[] = [
                {
                    policyNumber: "123",
                    policyName: "string",
                    productId: 123,
                    accountNumber: "string",
                    billingName: { firstName: "Name", lastName: "Lastname" },
                    riderId: 123,
                },
            ];
            it("should populate riderPolicies", () => {
                component.populateRiderList(sampleRiderPolicies);
                expect(component.riderList).toStrictEqual([
                    { id: sampleRiderPolicies[0].riderId, name: sampleRiderPolicies[0].policyName },
                ]);
            });
        });

        describe("openConfirmationPopup()", () => {
            it("should open PolicyChangeRequestConfirmationPopupComponent popup", () => {
                const matDialogOpenSpy = jest.spyOn(mockDialog, "open");
                component.openConfirmationPopup();
                expect(matDialogOpenSpy).toHaveBeenCalledWith(PolicyChangeRequestConfirmationPopupComponent, expect.anything());
            });
        });

        describe("cancel()", () => {
            it("should open PolicyChangeRequestCancelPopupComponent popup", () => {
                const matDialogOpenSpy_2 = jest.spyOn(mockDialog, "open");
                component.cancel();
                expect(matDialogOpenSpy_2).toHaveBeenCalledWith(PolicyChangeRequestCancelPopupComponent, expect.anything());
            });
        });

        describe("ngOnDestroy()", () => {
            it("Should cleanup subscriptions", () => {
                const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
                component.subscriptions = [new Subscription()];
                fixture.destroy();
                expect(subscriptionSpy).toHaveBeenCalled();
            });
        });
    });
});
