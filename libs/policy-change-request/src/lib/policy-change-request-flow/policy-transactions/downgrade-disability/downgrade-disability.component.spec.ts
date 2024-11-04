import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NgxsModule } from "@ngxs/store";
import { of, Subscription } from "rxjs";
import { DowngradeDisabilityComponent } from "./downgrade-disability.component";
import { mockMatDialog, mockStaticUtilService } from "@empowered/testing";
import { StaticUtilService } from "@empowered/ngxs-store";
import { PolicyChangeRequestCancelPopupComponent, PolicyChangeRequestConfirmationPopupComponent } from "@empowered/ui";

const customMockStaticUtilService = {
    ...mockStaticUtilService,
    cacheConfigValue: (configName: string) => of("sample,config,value"),
};

describe("DowngradeDisabilityComponent", () => {
    let component: DowngradeDisabilityComponent;
    let fixture: ComponentFixture<DowngradeDisabilityComponent>;
    let mockDialog: MatDialog;
    let mockStaticUtil: StaticUtilService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DowngradeDisabilityComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MatDialogRef, useValue: {} },
                { provide: StaticUtilService, useValue: customMockStaticUtilService },
            ],
            imports: [NgxsModule.forRoot(), ReactiveFormsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DowngradeDisabilityComponent);
        component = fixture.componentInstance;
        mockDialog = TestBed.inject(MatDialog);
        mockStaticUtil = TestBed.inject(StaticUtilService);
    });

    describe("DowngradeDisabilityComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("cancel()", () => {
            it("should open PolicyChangeRequestCancelPopupComponent on clicking cancel", () => {
                const openSpy = jest.spyOn(mockDialog, "open");
                component.cancel();
                expect(openSpy).toHaveBeenCalledWith(PolicyChangeRequestCancelPopupComponent, expect.anything());
            });
        });

        describe("openConfirmationPopup()", () => {
            it("should open PolicyChangeRequestConfirmationPopupComponent on clicking submit when downgradeForm is not dirty", () => {
                const openSpy = jest.spyOn(mockDialog, "open");
                component.openConfirmationPopup();
                expect(openSpy).toHaveBeenCalledWith(PolicyChangeRequestConfirmationPopupComponent, expect.anything());
            });
        });

        describe("getDowngradeOptions()", () => {
            it("should fetch respective config for 3 month benefitPeriod", () => {
                component.benefitPeriod = 3;
                const staticUtilSpy = jest.spyOn(mockStaticUtil, "cacheConfigValue");
                component.getDowngradeOptions();
                expect(staticUtilSpy).toHaveBeenCalledWith("general.pcr.downgrade.benefit_period.three_months");
                expect(component.fromEliminationPeriodOptions).toStrictEqual(["sample", "config", "value"]);
            });
        });

        describe("ngOnDestroy()", () => {
            it("should cleanup subscriptions", () => {
                const unsubscribeSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
                component.subscriptions = [new Subscription()];
                component.ngOnDestroy();
                expect(unsubscribeSpy).toHaveBeenCalled();
            });
        });
    });
});
