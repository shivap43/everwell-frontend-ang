import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ChangesReviewPopUpComponent } from "./changes-review-pop-up.component";
import { mockLanguageService, mockMatDialogData, mockMatDialogRef, mockProductsPlansQuasiService } from "@empowered/testing";
import { ProductsPlansQuasiService } from "../../products-plans-quasi";

describe("ChangesReviewPopUpComponent", () => {
    let component: ChangesReviewPopUpComponent;
    let fixture: ComponentFixture<ChangesReviewPopUpComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChangesReviewPopUpComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: ProductsPlansQuasiService,
                    useValue: mockProductsPlansQuasiService,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChangesReviewPopUpComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
