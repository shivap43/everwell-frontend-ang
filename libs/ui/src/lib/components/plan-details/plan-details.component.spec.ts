import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PlanDetailsComponent } from "./plan-details.component";
import { ReactiveFormsModule } from "@angular/forms";
import { CurrencyPipe } from "@angular/common";
import { mockMatDialog, mockMatDialogRef, mockRouter } from "@empowered/testing";
import { Router } from "@angular/router";

const data = {
    isCarrierOfADV: true,
    productId: 13,
};

@Pipe({
    name: "[currency]",
})
class MockCurrencyPipe implements PipeTransform {
    transform(value: any): string {
        return `$${value}`;
    }
}
const mockCurrencyPipe = new MockCurrencyPipe();

describe("PlanDetailsComponent", () => {
    let component: PlanDetailsComponent;
    let fixture: ComponentFixture<PlanDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlanDetailsComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: CurrencyPipe,
                    useValue: mockCurrencyPipe,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanDetailsComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("isDentalMatrixFormRequired()", () => {
        it("should display dental matrix document", () => {
            mockRouter.url = "/shop";
            component.isDentalMatrixFormRequired("CA");
        });

        it("should not display dental matrix document", () => {
            mockRouter.url = "coverage-summary";
            component.isDentalMatrixFormRequired("CA");
        });
    });
});
