import { FormsModule } from "@angular/forms";
import { MESSAGE_CENTER_ROUTES } from "./message-center.routing";
import { NgModule } from "@angular/core";
import { CommonModule, TitleCasePipe } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { MessageCenterSettingsContainerComponent } from "./message-center-settings-container/message-center-settings-container.component";
import { NgxDropzoneModule } from "ngx-dropzone";
import { AudienceGroupBuilderModule } from "@empowered/audience-group-builder";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTableModule } from "@angular/material/table";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatMenuModule } from "@angular/material/menu";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatDividerModule } from "@angular/material/divider";
import { MatSortModule } from "@angular/material/sort";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UiComponentsModule, SharedModule } from "@empowered/shared";
import { DereferenceCategoryPipe } from "./pipes/dereference-category.pipe";
import { DereferenceTargetUnitPipe } from "./pipes/dereference-target-unit.pipe";
import { DereferenceAssignedToPipe } from "./pipes/dereference-assigned-to.pipe";
import { DereferenceStatusPipe } from "./pipes/dereference-status.pipe";
import { MessageCenterViewContainerComponent } from "./containers/message-center-view-container/message-center-view-container.component";
import { MessageDetailComponent } from "./components/message-detail/message-detail.component";
import { ThreadMetaDetailComponent } from "./components/message-metadata/thread-meta-detail/thread-meta-detail.component";
import { StatusModalComponent } from "./components/modals/status-modal/status-modal.component";
import { CategoryModalComponent } from "./components/modals/category-modal/category-modal.component";
import { AssignAdminModalComponent } from "./components/modals/assign-admin-modal/assign-admin-modal.component";
import { DeleteMessageModalComponent } from "./components/modals/delete-message-modal/delete-message-modal.component";
import { CommentModalComponent } from "./components/modals/comment-modal/comment-modal.component";
import { DeleteCommentModalComponent } from "./components/modals/delete-comment-modal/delete-comment-modal.component";
import { MetadataElementComponent } from "./components/message-metadata/metadata-element/metadata-element.component";
// eslint-disable-next-line max-len
import { CategorySettingsContainerComponent } from "./containers/admin-settings/category-settings-container/category-settings-container.component";
import { AdminSettingsContainerComponent } from "./containers/admin-settings/admin-settings-container/admin-settings-container.component";
import { DeleteCategoryModalComponent } from "./components/modals/delete-category-modal/delete-category-modal.component";
import { CategoryUpdateRowComponent } from "./containers/admin-settings/category-update-row/category-update-row.component";
import { AdminRolesModalComponent } from "./components/modals/admin-roles-modal/admin-roles-modal.component";
// eslint-disable-next-line max-len
import { CategoryAdminAssignmentComponent } from "./containers/admin-settings/category-admin-assignment/category-admin-assignment.component";
// eslint-disable-next-line max-len
import { CategoryAdminAssignmentRowComponent } from "./containers/admin-settings/category-admin-assignment-row/category-admin-assignment-row.component";
import { DeleteAdminModalComponent } from "./components/modals/delete-admin-modal/delete-admin-modal.component";
import { ComposeMessageComponent } from "./components/compose-message/compose-message.component";
// eslint-disable-next-line max-len
import { SingleRecipientInputComponent } from "./components/compose-message-components/single-recipient-input/single-recipient-input.component";
import { NgxsModule } from "@ngxs/store";
import { ReplyMetaDetailComponent } from "./components/message-metadata/reply-meta-detail/reply-meta-detail.component";
import { MessageAttachmentsComponent } from "./components/message-attachments/message-attachments.component";
import { MessageCenterFacadeService } from "./services/message-center-facade.service";
import { ResourceListState, MessageCenterState } from "@empowered/ngxs-store";
import { ComposeMessageButtonComponent } from "./components/compose-message-button/compose-message-button.component";
import { StatusIconComponent } from "./components/status-icon/status-icon.component";
import { CancelComposeModalComponent } from "./components/modals/cancel-compose-modal/cancel-compose-modal.component";
import { LanguageModule } from "@empowered/language";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [
        RouterModule.forChild(MESSAGE_CENTER_ROUTES),
        NgxsModule.forFeature([MessageCenterState, ResourceListState]),
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgxDropzoneModule,
        UiComponentsModule,
        AudienceGroupBuilderModule,
        SharedModule,
        LanguageModule,

        // Material
        MatTabsModule,
        MatTableModule,
        MatFormFieldModule,
        MatSelectModule,
        MatPaginatorModule,
        MatMenuModule,
        MatBottomSheetModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatDividerModule,
        MatSortModule,
        MatTooltipModule,
        UiModule,
    ],
    declarations: [
        MessageCenterViewContainerComponent,
        MessageDetailComponent,
        ThreadMetaDetailComponent,
        StatusModalComponent,
        CategoryModalComponent,
        AssignAdminModalComponent,
        DeleteMessageModalComponent,
        CommentModalComponent,
        DeleteCommentModalComponent,
        MetadataElementComponent,
        MessageCenterSettingsContainerComponent,
        CategorySettingsContainerComponent,
        AdminSettingsContainerComponent,
        DeleteCategoryModalComponent,
        CategoryUpdateRowComponent,
        AdminRolesModalComponent,
        CategoryAdminAssignmentComponent,
        CategoryAdminAssignmentRowComponent,
        DeleteAdminModalComponent,
        ComposeMessageComponent,
        SingleRecipientInputComponent,
        DereferenceCategoryPipe,
        DereferenceTargetUnitPipe,
        DereferenceAssignedToPipe,
        DereferenceStatusPipe,
        ReplyMetaDetailComponent,
        MessageAttachmentsComponent,
        ComposeMessageButtonComponent,
        StatusIconComponent,
        CancelComposeModalComponent,
    ],
    providers: [TitleCasePipe, MessageCenterFacadeService],
    exports: [ComposeMessageButtonComponent],
})
export class MessageCenterModule {}
