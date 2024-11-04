import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Input, Directive } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { DualPlanYearSettings, MemberQualifyingEvent } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { EnrollmentState, DualPlanYearState } from "@empowered/ngxs-store";
import { mockLanguageService, MockReplaceTagPipe } from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { ReinstateDialogComponent } from "./reinstate-dialog.component";
import { provideMockStore } from "@ngrx/store/testing";

const mockMatDialogRef = { close: () => {} };
const matDialogData = {
    planId: 22,
    fromAppFlow: true,
    policyData: {
        enrollments: [{ planOfferingId: 22, riderOfEnrollmentId: 11 }, { planOfferingId: 22 }],
        riders: [{ planOfferingId: 33 }],
    },
};
@Directive({
    selector: "[scrollSpy]",
})
class MockSpiedTagsDirective {
    @Input() spiedTags: string[];
}

describe("ReinstateDialogComponent", () => {
    let component: ReinstateDialogComponent;
    let fixture: ComponentFixture<ReinstateDialogComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ReinstateDialogComponent, MockReplaceTagPipe, MockSpiedTagsDirective],
            imports: [NgxsModule.forRoot([EnrollmentState, DualPlanYearState]), HttpClientTestingModule, RouterTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                DatePipe,

                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: matDialogData,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                provideMockStore({}),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ReinstateDialogComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            enrollment: {
                currentQLE: {} as MemberQualifyingEvent,
            },
            dualPlanYear: {
                selectedShop: DualPlanYearSettings.OE_SHOP,
                oeDualPlanYear: { id: 1 },
                isDualPlanYear: false,
            },
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("discardReinstateDialog()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.discardReinstateDialog();
            expect(spy1).toBeCalledWith();
        });
    });

    describe("checkforReinstateConstraint()", () => {
        it("should return true if reinstatement is required", () => {
            const constraints = [{ type: "REINSTATEMENT_IS_REQUIRED" }];
            const result = component.checkforReinstateConstraint(constraints);
            expect(result).toBe(true);
        });
        it("should return false if reinstatement is not required", () => {
            const constraints = [{ type: "NO_REINSTATEMENT" }];
            const result = component.checkforReinstateConstraint(constraints);
            expect(result).toBe(false);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
