import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { UserService, UserState } from "@empowered/user";
import { Store } from "@ngrx/store";
import { RemoveDependentComponent } from "./remove-dependent.component";
import { MockReplaceTagPipe } from "@empowered/testing";

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
    member: true,
};

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;

describe("RemoveDependentComponent", () => {
    let component: RemoveDependentComponent;
    let fixture: ComponentFixture<RemoveDependentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RemoveDependentComponent, MockReplaceTagPipe],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                UserService,
                Store,
            ],
            imports: [NgxsModule.forRoot([UserState]), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RemoveDependentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
