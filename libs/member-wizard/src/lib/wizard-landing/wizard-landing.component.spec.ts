import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WizardLandingComponent } from "./wizard-landing.component";
import { ShoppingService } from "@empowered/api";
import { mockDatePipe, mockLanguageService, mockMatDialog, mockRouter, mockShoppingService } from "@empowered/testing";
import { MatDialog } from "@angular/material/dialog";
import { NgxsModule } from "@ngxs/store";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule} from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MaterialModule } from "@empowered/ui";

describe("WizardLandingComponent", () => {
    let component: WizardLandingComponent;
    let fixture: ComponentFixture<WizardLandingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WizardLandingComponent],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: DatePipe, useValue: mockDatePipe },
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: ShoppingService, useValue: mockShoppingService },
                { provide: LanguageService, useValue: mockLanguageService },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, RouterTestingModule, MaterialModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WizardLandingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
