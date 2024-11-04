import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { LanguageService } from "@empowered/language";
import { CloseLifeEventPopupComponent } from "./close-life-event-popup.component";

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

@Component({
    template: "",
    selector: "empowered-modal",
})
class MockModalComponent {}

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

describe("CloseLifeEventPopupComponent", () => {
    let component: CloseLifeEventPopupComponent;
    let fixture: ComponentFixture<CloseLifeEventPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CloseLifeEventPopupComponent, MockModalHeaderComponent, MockModalFooterComponent, MockModalComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CloseLifeEventPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
