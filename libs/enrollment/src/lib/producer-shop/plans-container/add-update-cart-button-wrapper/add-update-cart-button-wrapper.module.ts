import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AddUpdateCartButtonWrapperComponent } from "./add-update-cart-button-wrapper.component";
import { UiComponentsModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { AddUpdateCartButtonComponent } from "./add-update-cart-button/add-update-cart-button.component";
// eslint-disable-next-line max-len
import { AddUpdateCartBucketPlanButtonWrapperComponent } from "./add-update-cart-bucket-plan-button-wrapper/add-update-cart-bucket-plan-button-wrapper.component";
import { MaterialModule } from "@empowered/ui";

@NgModule({
    declarations: [AddUpdateCartButtonWrapperComponent, AddUpdateCartButtonComponent, AddUpdateCartBucketPlanButtonWrapperComponent],
    imports: [CommonModule, MaterialModule, UiComponentsModule, LanguageModule],
    exports: [AddUpdateCartButtonWrapperComponent, AddUpdateCartButtonComponent, AddUpdateCartBucketPlanButtonWrapperComponent],
})
export class AddUpdateCartButtonWrapperModule {}
