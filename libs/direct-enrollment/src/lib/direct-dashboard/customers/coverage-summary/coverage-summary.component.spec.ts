import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CoverageSummaryComponent } from "./coverage-summary.component";
import { NgxsModule, Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { DatePipe } from "@angular/common";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import {
    MockHasPermissionDirective,
    MockPayrollFrequencyCalculatorPipe,
    mockAuthenticationService,
    mockMatDialog,
    mockMatDialogRef,
} from "@empowered/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { SharedState } from "@empowered/ngxs-store";
import { AuthenticationService } from "@empowered/api";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";

describe("CoverageSummaryComponent", () => {
    let component: CoverageSummaryComponent;
    let fixture: ComponentFixture<CoverageSummaryComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CoverageSummaryComponent, MockPayrollFrequencyCalculatorPipe, MockHasPermissionDirective],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                DatePipe,
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MatDialogRef, useValue: mockMatDialogRef },
                { provide: AuthenticationService, useValue: mockAuthenticationService },
                { provide: ActivatedRoute, useValue: { parent: { snapshot: { params: { mpGroupId: 12345 } } } } },
            ],
            imports: [NgxsModule.forRoot([SharedState]), HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CoverageSummaryComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                portal: "PRODUCER",
            },
        });
        fixture.detectChanges();
    });

    describe("CoverageSummaryComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("ngOnDestroy()", () => {
            it("should destroy all subscriptions", () => {
                const unsubscribeSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
                const nextSpy = jest.spyOn(component["unsubscribe$"], "next");
                const completeSpy = jest.spyOn(component["unsubscribe$"], "complete");

                component.subscriptions = [new Subscription()];
                component.ngOnDestroy();
                expect(unsubscribeSpy).toHaveBeenCalled();
                expect(nextSpy).toHaveBeenCalled();
                expect(completeSpy).toHaveBeenCalled();
            });
        });

        describe("getDateFormat()", () => {
            it("should return the Date object from the string", () => {
                const date = "05/01/2024";
                expect(component.getDateFormat(date)).toStrictEqual(new Date(new Date("05-01-2024").setHours(0, 0, 0, 0)));
            });

            it("should return null if undefined input is passed", () => {
                expect(component.getDateFormat(undefined)).toBe(null);
            });
        });
    });
});
