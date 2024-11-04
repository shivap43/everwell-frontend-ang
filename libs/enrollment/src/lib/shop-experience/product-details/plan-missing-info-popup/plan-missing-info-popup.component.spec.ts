import { ComponentType } from "@angular/cdk/portal";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { StaticService } from "@empowered/api";
import { CountryState } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { of, Subscription } from "rxjs";
import { PlanMissingInfoPopupComponent } from "./plan-missing-info-popup.component";

const mockDialogRef = {
    close: () => {},
} as MatDialogRef<PlanMissingInfoPopupComponent>;

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as MatDialog;

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any) {
        return "sample_repaced_value";
    }
}

const STATES: CountryState[] = [
    { abbreviation: "GA", name: "Georgia" },
    { abbreviation: "NY", name: "New York" },
];

const mockStaticService = {
    getStates: () => of(STATES),
} as StaticService;

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
} as LanguageService;

describe("PlanMissingInfoPopupComponent", () => {
    let component: PlanMissingInfoPopupComponent;
    let fixture: ComponentFixture<PlanMissingInfoPopupComponent>;
    let mockDialog: MatDialogRef<PlanMissingInfoPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            declarations: [PlanMissingInfoPopupComponent, MockReplaceTagPipe],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                FormBuilder,
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: StaticService, useValue: mockStaticService },
            ],
            imports: [HttpClientTestingModule, ReactiveFormsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanMissingInfoPopupComponent);
        component = fixture.componentInstance;
        mockDialog = TestBed.inject(MatDialogRef);
    });

    describe("PlanMissingInfoPopupComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("ngOnDestroy()", () => {
            let subscriptionSpy;
            beforeAll(() => {
                subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            });
            it("should unsubscribe from all subscriptions", () => {
                component.ngOnDestroy();
                expect(subscriptionSpy).toHaveBeenCalled();
            });
        });

        describe("closePopup()", () => {
            it("should close the popup", () => {
                const matDialogCloseSpy = jest.spyOn(mockDialog, "close");
                component.closePopup(false);
                expect(matDialogCloseSpy).toHaveBeenCalledWith({ data: { isUpdated: false } });
            });
        });

        describe("onCancelClick()", () => {
            it("should close the popup", () => {
                const matDialogCloseSpy = jest.spyOn(mockDialog, "close");
                component.onCancelClick();
                expect(matDialogCloseSpy).toHaveBeenCalled();
            });
        });

        describe("getEmployeeState()", () => {
            it("should populate employeStates", () => {
                component.getEmployeeState();
                expect(component.employeeStates).toEqual(STATES);
            });
        });
    });
});
