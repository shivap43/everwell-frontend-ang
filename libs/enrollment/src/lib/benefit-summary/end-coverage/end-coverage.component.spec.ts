import { Component, Pipe, PipeTransform, Input, Directive, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";

import { AppFlowService, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { ComponentType } from "@angular/cdk/portal";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { of, Subscription } from "rxjs";
import { EndCoverageComponent } from "./end-coverage.component";
import { DatePipe } from "@angular/common";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Configuration, EndCoverageSummary, EnrollmentService } from "@empowered/api";
import { MatDatepicker } from "@angular/material/datepicker";
import { LanguageService } from "@empowered/language";
import { PortalType } from "@empowered/constants";

const mockMatDialogRef = { close: () => {} };

const mockCancelEnrollmentService = {
    cancelCoverage: (memberId: number, enrollmentId: number, endCoverageSummary: EndCoverageSummary, mpGroup?: number) => of([]),
} as unknown as EnrollmentService;

const mockDialogData = {
    memberId: 1,
    mpGroup: 123,
    enrollmentId: 1,
    enrollmentTaxStatus: "PRETAX",
    planName: "Accident option A",
    employeeName: "Jack Hunt",
    expiresAfter: "01-01-2023",
    isShop: false,
    isCoverageSummary: true,
    agEndDate: "01-01-2023",
};
const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as MatDialog;

const mockStaticUtilService = {
    cacheConfigEnabled: (configName: string) => of(true),
} as StaticUtilService;

const mockAppFlowService = {
    exitStatus: (exitStatus: boolean) => {},
} as AppFlowService;

@Pipe({
    name: "[DatePipe]",
})
class MockDatePipe implements PipeTransform {
    transform(value: any): string {
        return `${value}`;
    }
}
const mockDatePipe = new MockDatePipe();

@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}

@Component({
    selector: "mat-datepicker",
    template: "",
})
class MockMonMatDatePickerComponent {}

describe("EndCoverageComponent", () => {
    let component: EndCoverageComponent;
    let fixture: ComponentFixture<EndCoverageComponent>;
    let matDialogRef: MatDialogRef<EndCoverageComponent>;
    let languageService: LanguageService;
    let fb: FormBuilder;
    let store: Store;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EndCoverageComponent, MockMonMatDatePickerComponent, MockMatDatePickerDirective],
            providers: [
                FormBuilder,

                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockDialogData,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                { provide: DatePipe, useValue: mockDatePipe },
                { provide: StaticUtilService, useValue: mockStaticUtilService },
                { provide: AppFlowService, useValue: mockAppFlowService },
                { provide: EnrollmentService, useValue: mockCancelEnrollmentService },
                Configuration,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [
                RouterTestingModule,
                HttpClientTestingModule,
                NgxsModule.forRoot([SharedState]),
                FormsModule,
                ReactiveFormsModule,
                BrowserAnimationsModule,
            ],
        }).compileComponents();
    });
    beforeEach(() => {
        store = TestBed.inject(Store);
        fb = TestBed.inject(FormBuilder);
        fixture = TestBed.createComponent(EndCoverageComponent);
        component = fixture.componentInstance;
        matDialogRef = TestBed.inject(MatDialogRef);
        languageService = TestBed.inject(LanguageService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date("2020-01-01"));
        });
        it("should set todayDate as AG end date, when agEndDate is present in dialog data", () => {
            component.ngOnInit();
            expect(component.todayDate).toStrictEqual("01-01-2023");
        });
        it("should set todayDate as present date if not AG or ADV", () => {
            component.data.agEndDate = null;
            component.todayDate = new Date();
            component.ngOnInit();
            expect(component.todayDate).toStrictEqual(new Date("2020-01-01"));
        });
        it("should set isProducer flag to true if portal type is Producer", () => {
            store.reset({
                ...store.snapshot(),
                core: {
                    portal: PortalType.PRODUCER,
                },
            });
            component.ngOnInit();
            expect(component.isProducer).toBe(true);
        });
        afterAll(() => {
            jest.useRealTimers();
        });
    });

    describe("directToCoverageSummary()", () => {
        it("should close the dialog box", () => {
            const spy = jest.spyOn(matDialogRef, "close");
            component.directToCoverageSummary();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onBack()", () => {
        it("should decrement the stepper index by 1", () => {
            component.stepperIndex = 2;
            component.onBack();
            expect(component.stepperIndex).toBe(1);
            expect(component.onNextClicked).toBe(false);
        });
    });

    describe("onNext()", () => {
        it("should set onNext flag to true", () => {
            component.cancelCoverageForm = fb.group({
                coverageEndDate: [null, Validators.required],
                description: [""],
            });
            component.onNext();
            expect(component.onNextClicked).toBe(true);
        });
    });

    describe("onConfirm()", () => {
        it("should call directToCoverageSummary method", () => {
            const spy = jest.spyOn(component, "directToCoverageSummary");
            component.onConfirm();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getSecondaryLanguageStrings", () => {
        it("should get secondary language strings", () => {
            const spy = jest.spyOn(languageService, "fetchSecondaryLanguageValues");
            component.getSecondaryLanguageStrings();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy", () => {
        it("should unsubscribe from all subscriptions", () => {
            const spy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [of(null).subscribe()];
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalled();
        });
    });
});
