import { ComponentType } from "@angular/cdk/portal";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Component, CUSTOM_ELEMENTS_SCHEMA, forwardRef, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { AuthenticationService, CoreService } from "@empowered/api";
import { StaticUtilService } from "@empowered/ngxs-store";
import { NgxsModule } from "@ngxs/store";
import { of } from "rxjs";
import { ClasstypePopupComponent } from "./classtype-popup.component";
import { TextFieldModule } from "@angular/cdk/text-field";

const mockMatDialogRef = {} as MatDialogRef<ClasstypePopupComponent>;

const mockDialogData = {
    carrierId: 1,
};

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as MatDialog;

const mockAuthenticationService = {
    keepalive: () => of({}),
};

const mockStaticUtilService = {
    cacheConfigEnabled: (configName: string) => of(true),
} as StaticUtilService;

const mockRiskClass = {
    id: 1,
    name: "A",
    productId: 1,
    groupRatingCode: "DUAL",
};

const mockCoreService = {
    getRiskClasses: (CarrierId: number) => of([mockRiskClass]),
} as CoreService;

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {}

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}

@Component({
    selector: "mat-radio-button",
    template: "",
})
class MockMatRadioButtonComponent {
    @Input() checked!: boolean;
}

@Component({
    selector: "mat-step",
    template: "",
})
class MockMatStepComponent {
    @Input() stepControl!: FormGroup;
}

@Component({
    selector: "mat-dialog-actions",
    template: "",
})
class MockDialogActionsComponent {}

@Component({
    selector: "mat-horizontal-stepper",
    template: "",
})
class MockMatHorizontalComponent {}

@Component({
    selector: "mat-radio-group",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatRadioGroupComponent),
            multi: true,
        },
    ],
})
class MockMatRadioGroupComponent {
    @Input() value!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-checkbox",
    template: "",
})
class MockMatCheckboxComponent {
    @Input() checked!: boolean;
    @Input() disabled!: boolean;
}

describe("ClasstypePopupComponent", () => {
    let component: ClasstypePopupComponent;
    let fixture: ComponentFixture<ClasstypePopupComponent>;
    let staticUtilService: StaticUtilService;
    let coreService: CoreService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ClasstypePopupComponent,
                MockMonIconComponent,
                MockMonSpinnerComponent,
                MockMatRadioButtonComponent,
                MockDialogActionsComponent,
                MockMatStepComponent,
                MockMatHorizontalComponent,
                MockMatRadioGroupComponent,
                MockMatCheckboxComponent,
            ],
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
                { provide: AuthenticationService, useValue: mockAuthenticationService },
                { provide: StaticUtilService, useValue: mockStaticUtilService },
                { provide: CoreService, useValue: mockCoreService },
            ],
            imports: [ReactiveFormsModule, TextFieldModule, RouterTestingModule, HttpClientTestingModule, NgxsModule.forRoot([])],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(ClasstypePopupComponent);
        component = fixture.componentInstance;
        staticUtilService = TestBed.inject(StaticUtilService);
        coreService = TestBed.inject(CoreService);
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("checkPeoFeatureEnabled()", () => {
        it("should set peoFeatureEnabled value to true, when config value is true", () => {
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
            component.checkPeoFeatureEnabled();
            expect(spy1).toBeCalledTimes(1);
            expect(component["peoFeatureEnabled"]).toBe(true);
        });

        it("should set peoFeatureEnabled value to false, when config value is false", () => {
            jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(false));
            component.checkPeoFeatureEnabled();
            expect(component["peoFeatureEnabled"]).toBe(false);
        });
    });

    describe("getCarrierRiskClasses()", () => {
        it("should set riskClasses value to same as mocked value, industryCodesPeo as empty array, industryCodesStandard as empty array", () => {
            // When one risk class with groupRatingCode DUAL is present
            component.getCarrierRiskClasses();
            expect(component["riskClasses"]).toStrictEqual([mockRiskClass]);
            expect(component["industryCodesPeo"]).toStrictEqual([]);
            expect(component["industryCodesStandard"]).toStrictEqual([]);
        });

        it("should set riskClasses value to same as mocked value, industryCodesPeo as empty array, industryCodesStandard as empty array", () => {
            // When two risk classes one with groupRatingCode null and other with groupRatingCode DUAL is present
            const mockRiskClasses = [...[mockRiskClass], ...[{ ...mockRiskClass, groupRatingCode: null }]];
            jest.spyOn(coreService, "getRiskClasses").mockReturnValue(of(mockRiskClasses));
            component.getCarrierRiskClasses();
            expect(component["riskClasses"]).toStrictEqual(mockRiskClasses);
            expect(component["industryCodesPeo"]).toStrictEqual([{ ...mockRiskClass, groupRatingCode: null }]);
            expect(component["industryCodesStandard"]).toStrictEqual([]);
        });
    });
});
