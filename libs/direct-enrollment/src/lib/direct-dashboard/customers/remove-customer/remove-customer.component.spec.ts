import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { LanguageService } from "@empowered/language";
import { RemoveCustomerComponent } from "./remove-customer.component";
import { Component, Input } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    template: "",
    selector: "empowered-modal",
})
class MockModalComponent {
    @Input() showCancel: boolean;
}

@Component({
    template: "",
    selector: "empowered-modal-header",
})
class MockModalHeaderComponent {}

@Component({
    template: "",
    selector: "empowered-modal-footer",
})
class MockModalFooterComponent {}

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

const data = {
    name: "name",
};

describe("RemoveCustomerComponent", () => {
    let component: RemoveCustomerComponent;
    let fixture: ComponentFixture<RemoveCustomerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RemoveCustomerComponent, MockModalComponent, MockModalFooterComponent, MockModalHeaderComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RemoveCustomerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
