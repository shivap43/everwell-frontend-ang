import { NgModule } from "@angular/core";
import { CommonModule, TitleCasePipe } from "@angular/common";
import { SharedModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { RouterModule } from "@angular/router";
import { ASSIGN_ADMIN_ROUTES } from "./assign-admin.routes";
import { RemoveAdminComponent } from "./remove-admin/remove-admin.component";
import { CannotRemoveModalComponent } from "./cannot-remove-modal/cannot-remove-modal.component";
import { DeactivateReactivatePopupComponent } from "./deactivate-reactivate-popup/deactivate-reactivate-popup.component";
import { UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [CommonModule, SharedModule, LanguageModule, RouterModule.forChild(ASSIGN_ADMIN_ROUTES), UiModule, AccountListNgxsStoreModule],
    declarations: [RemoveAdminComponent, CannotRemoveModalComponent, DeactivateReactivatePopupComponent],
    providers: [TitleCasePipe],
})
export class AssignAdminModule {}
