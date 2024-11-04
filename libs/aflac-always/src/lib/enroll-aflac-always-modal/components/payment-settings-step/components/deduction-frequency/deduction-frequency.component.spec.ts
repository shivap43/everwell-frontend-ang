import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DeductionFrequencyComponent } from "./deduction-frequency.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { provideMockStore } from "@ngrx/store/testing";
import { of } from "rxjs";
import { Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { FormControl, Validators } from "@angular/forms";
import { AflacAlwaysStoreService } from "../../../../services/aflac-always-store.service";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { mockDatePipe, mockRouter } from "@empowered/testing";
import { Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";

@Pipe({
    name: "titlecase",
})
class MockTitleCasePipe implements PipeTransform {
    transform(value: string) {
        return "";
    }
}

describe("DeductionFrequencyComponent", () => {
    let component: DeductionFrequencyComponent;
    let fixture: ComponentFixture<DeductionFrequencyComponent>;
    let mockStoreService: AflacAlwaysStoreService;

    const mockStore = {
        select: () => of([]),
        selectSnapshot: () => "",
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DeductionFrequencyComponent, MockTitleCasePipe],
            imports: [HttpClientTestingModule, RouterTestingModule],
            providers: [
                { provide: Store, useValue: mockStore },
                { provide: TitleCasePipe, useValue: MockTitleCasePipe },
                { provide: DatePipe, useValue: mockDatePipe },
                { provide: Router, useValue: mockRouter },
                provideMockStore({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DeductionFrequencyComponent);
        component = fixture.componentInstance;
        mockStoreService = TestBed.inject(AflacAlwaysStoreService);
        component.registerOnTouched(() => {});
        component.registerOnValidatorChange(() => {});
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("validate()", () => {
        it("should return validation errors", () => {
            component.control = new FormControl("", [Validators.required]);
            component.control.setValue("");
            const result1 = component.validate();
            expect(result1).toStrictEqual({ deductionFrequency: true });
            component.control.setValue("Monthly - $10");
            const result2 = component.validate();
            expect(result2).toBeNull();
        });
    });

    describe("onChange()", () => {
        it("should emit entered value", () => {
            const spy = jest.spyOn(component.inputChange, "emit");
            component.onChange("Monthly");
            expect(spy).toBeCalledWith("Monthly");
        });
    });

    describe("writeValue()", () => {
        it("should set value", () => {
            component.writeValue("Monthly");
            expect(component.value).toBeTruthy();
        });
    });

    describe("buildOptions()", () => {
        it("should emit touched value", (done) => {
            jest.spyOn(mockStoreService, "fetchMonthlyCost").mockReturnValue(of(10));
            component.buildOptions().subscribe((options) => {
                expect(options.length).toBe(2);
            });
            done();
        });
    });
});
