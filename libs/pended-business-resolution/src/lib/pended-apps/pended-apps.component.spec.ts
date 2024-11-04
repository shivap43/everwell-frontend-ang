import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Component, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminService, PendedBusinessLevel } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { PendedAppsComponent } from "./pended-apps.component";
import { NgxsModule } from "@ngxs/store";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
} as LanguageService;

@Component({
    selector: "empowered-producer-tab",
    template: "",
})
class EmpoweredProducerTabComponent {
    @Input() level!: PendedBusinessLevel;
}

describe("PendedAppsComponent", () => {
    let component: PendedAppsComponent;
    let fixture: ComponentFixture<PendedAppsComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            declarations: [PendedAppsComponent, EmpoweredProducerTabComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                AdminService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(PendedAppsComponent);
        component = fixture.componentInstance;
        component.visibleTabs = [];
        fixture.detectChanges();
    });

    describe("PendedAppsComponent", () => {
        it("should get created", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("setTabsVisibility()", () => {
        it("should set the tab visibility on Account ", () => {
            component.setTabsVisibility(1);
            expect(component.visibleTabs).toEqual([0, 1]);
        });
        it("should set the tab visibility on DSC ", () => {
            component.setTabsVisibility(30);
            expect(component.visibleTabs).toEqual([0, 2, 1]);
        });
        it("should set the tab visibility on RSC ", () => {
            component.setTabsVisibility(40);
            expect(component.visibleTabs).toEqual([0, 2, 1, 3]);
        });
        it("should set the tab visibility on all tabs ", () => {
            component.setTabsVisibility(45);
            expect(component.visibleTabs).toEqual([0, 2, 1, 3, 4]);
        });
    });
});
