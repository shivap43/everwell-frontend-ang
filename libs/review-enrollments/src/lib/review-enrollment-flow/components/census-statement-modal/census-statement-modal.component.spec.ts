import { ComponentFixture, TestBed } from "@angular/core/testing";
import { mockLanguageService } from "@empowered/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterTestingModule } from "@angular/router/testing";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { CensusStatementModalComponent } from "./census-statement-modal.component";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[mat-dialog-close]",
})
class MockMatDialogCloseDirective {
    @Input("mat-dialog-close") queryString: string;
}

describe("CensusStatementModalComponent", () => {
    let component: CensusStatementModalComponent;
    let fixture: ComponentFixture<CensusStatementModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CensusStatementModalComponent, MockMatDialogCloseDirective],
            imports: [HttpClientTestingModule, ReactiveFormsModule, NgxsModule.forRoot([]), RouterTestingModule],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CensusStatementModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});


