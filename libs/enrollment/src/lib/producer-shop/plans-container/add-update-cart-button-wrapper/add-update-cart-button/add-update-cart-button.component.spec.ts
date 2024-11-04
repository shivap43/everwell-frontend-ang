import { Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { AddUpdateCartButtonState } from "../add-update-cart-button-wrapper.model";

import { AddUpdateCartButtonComponent } from "./add-update-cart-button.component";

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[language]",
})
class MockLanguageDirective {
    @Input() language!: string;

    transform(value: any): string {
        return value;
    }
}

@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("AddUpdateCartButtonComponent", () => {
    let component: AddUpdateCartButtonComponent;
    let fixture: ComponentFixture<AddUpdateCartButtonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddUpdateCartButtonComponent, MockLanguageDirective, MockRichTooltipDirective],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddUpdateCartButtonComponent);
        component = fixture.componentInstance;
        component.addUpdateCartButtonState = AddUpdateCartButtonState.ADD_TO_CART;
        component.disableAddCart = false;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    it("should emit", () => {
        const spy = jest.spyOn(component.addToCartHandler, "emit");
        component.onAddToCartHandler();
        expect(spy).toBeCalledTimes(1);
    });
});
