import { of } from "rxjs";
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { AflacService, ENROLLMENT_FILTER_CONSTANTS } from "@empowered/api";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HttpClientTestingModule } from "@angular/common/http/testing";
import { EnrollmentsFiltersComponent } from "./enrollments-filters.component";
import { DatePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { NgxMaskPipe } from "ngx-mask";
import { Component, CUSTOM_ELEMENTS_SCHEMA, forwardRef, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { DateFormats } from "@empowered/constants";
import { MaterialModule } from "@empowered/ui";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

@Component({
    template: "",
    selector: "mat-label",
})
export class MockMatLabelComponent {}

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
class MockMatRadioGroupComponent implements ControlValueAccessor {
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-radio-button",
    template: "",
})
class MockMatRadioButtonComponent {
    @Input() value!: string;
    @Input() checked: boolean;
}

@Component({
    selector: "mat-select",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatSelectComponent),
            multi: true,
        },
    ],
})
class MockMatSelectComponent implements ControlValueAccessor {
    @Input() placeholder!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    template: "",
    selector: "mat-select-trigger",
})
export class MockMatSelectTriggerComponent {}

@Component({
    selector: "mat-option",
    template: "",
})
class MockMatOptionComponent {
    @Input() value!: string;
}

@Component({
    template: "",
    selector: "empowered-enrollments-filters",
})
export class MockEmpoweredEnrollmentsFiltersComponent {
    @Input() form!: FormGroup;
}

const mockAflacService = {
    getCommissionSplits: (mpGroup: string) => {
        of([
            {
                archived: false,
                assignments: [{ producer: { producerId: 122267, name: "Adarsh S" }, sitCodeId: 1701704, percent: 100 }],
                conversion: false,
                createdById: 122624,
                defaultFor: { producerId: 122267, name: "Adarsh S" },
                id: 92783,
                name: "Adarsh S default US split(non-NY)",
                orphaned: false,
                repairRequired: false,
                rules: [{ type: "WRITING_PRODUCER", id: 94701, producerId: 122267, name: "Adarsh S" }],
                status: "ACTIVE",
            },
        ]);
    },
} as AflacService;

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchPrimaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockDatePipe = {
    transform: (date: string) => "12/12/2021",
} as DatePipe;

const mockStore = {
    selectSnapshot: () => of(""),
} as unknown as Store;

const mockMaskPipe = {
    transform: (value: string, mask: string) => "09/09/2000",
} as NgxMaskPipe;

describe("EnrollmentsFiltersComponent", () => {
    let component: EnrollmentsFiltersComponent;
    let fixture: ComponentFixture<EnrollmentsFiltersComponent>;
    let aflacService: AflacService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EnrollmentsFiltersComponent, MockEmpoweredEnrollmentsFiltersComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), ReactiveFormsModule, MaterialModule, NoopAnimationsModule],
            providers: [
                FormBuilder,
                { provide: AflacService, useValue: mockAflacService },
                { provide: Store, useValue: mockStore },
                { provide: DatePipe, useValue: mockDatePipe },
                { provide: NgxMaskPipe, useValue: mockMaskPipe },
                { provide: LanguageService, useValue: mockLanguageService },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();

        aflacService = TestBed.inject(AflacService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EnrollmentsFiltersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getDefaultSentDateFilter()", () => {
        it("should set the default sent date filter", () => {
            const sentDate = component.getDefaultSentDateFilter(30);
            expect(sentDate).toStrictEqual(ENROLLMENT_FILTER_CONSTANTS.LAST_30_DAYS);
        });

        it("Should return undefined if no of days are different than 30, 60 or 90 ", () => {
            const sentDate = component.getDefaultSentDateFilter(40);
            expect(sentDate).toBeUndefined();
        });
    });

    describe("minusDays()", () => {
        it("Should get the difference between current date and no of days passed", () => {
            const days = 10;
            const date = new Date();
            date.setDate(date.getDate() - days);
            expect(component.minusDays(days)).toStrictEqual(mockDatePipe.transform(date, DateFormats.YEAR_MONTH_DAY));
        });
    });

    describe("matSelectOpenHandler()", () => {
        it("should set a boolean value for filterOpen variable if filter select tab is opened or closed", () => {
            component.matSelectOpenHandler(true);
            expect(component.filterOpen).toStrictEqual(true);
        });
    });
});
