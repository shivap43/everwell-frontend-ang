import { NgModule } from "@angular/core";
import { MockComponent, MockDirective } from "@empowered/jest";

const MockMatCard = MockComponent("mat-card", {
    exportAs: "matCard",
}) as any;

const MockMatCardHeader = MockComponent("mat-card-header") as any;

const MockMatCardTitleGroup = MockComponent("mat-card-title-group") as any;

const MockMatCardContent = MockDirective("mat-card-content") as any;

const MockMatCardTitle = MockDirective("mat-card-title, [mat-card-title], [matCardTitle]") as any;

const MockMatCardSubtitle = MockDirective("mat-card-subtitle, [mat-card-subtitle], [matCardSubtitle]") as any;

const MockMatCardActions = MockDirective("mat-card-actions") as any;

const MockMatCardFooter = MockDirective("mat-card-footer") as any;

const MockMatCardImage = MockDirective("[mat-card-image], [matCardImage]") as any;

const MockMatCardSmImage = MockDirective("[mat-card-sm-image], [matCardImageSmall]") as any;

const MockMatCardMdImage = MockDirective("[mat-card-md-image], [matCardImageMedium]") as any;

const MockMatCardLgImage = MockDirective("[mat-card-lg-image], [matCardImageLarge]") as any;

const MockMatCardXlImage = MockDirective("[mat-card-xl-image], [matCardImageXLarge]") as any;

const MockMatCardAvatar = MockDirective("[mat-card-avatar], [matCardAvatar]") as any;

export const MockMatCardModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [
            MockMatCard,
            MockMatCardHeader,
            MockMatCardTitleGroup,
            MockMatCardContent,
            MockMatCardTitle,
            MockMatCardSubtitle,
            MockMatCardActions,
            MockMatCardFooter,
            MockMatCardSmImage,
            MockMatCardMdImage,
            MockMatCardLgImage,
            MockMatCardImage,
            MockMatCardXlImage,
            MockMatCardAvatar,
        ],
        exports: [
            MockMatCard,
            MockMatCardHeader,
            MockMatCardTitleGroup,
            MockMatCardContent,
            MockMatCardTitle,
            MockMatCardSubtitle,
            MockMatCardActions,
            MockMatCardFooter,
            MockMatCardSmImage,
            MockMatCardMdImage,
            MockMatCardLgImage,
            MockMatCardImage,
            MockMatCardXlImage,
            MockMatCardAvatar,
        ],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
