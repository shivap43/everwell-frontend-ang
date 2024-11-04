import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { DocumentApiService } from "@empowered/api";
import { Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-resource-acknowlegdement",
    templateUrl: "./resource-acknowlegdement.component.html",
    styleUrls: ["./resource-acknowlegdement.component.scss"],
})
export class ResourceAcknowledgmentComponent implements OnInit, OnDestroy {
    file = "FILE";
    url = "URL";
    video = "VIDEO";
    acknowledgementForm: FormGroup;
    resourceList = [];
    resourceType: any;
    fileName: any;
    downloadDocumentSubscription: Subscription;
    documentSubscriber: Subscription;
    multipleResources: Boolean = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.accountEnrollments.addNote.title",
        "primary.portal.members.resourceAcknowledgeModal.newResource",
        "primary.portal.common.view",
        "primary.portal.members.resourceAcknowledgeModal.multipleResourceAdded",
        "primary.portal.members.resourceAcknowledgeModal.logOut",
        "primary.portal.members.resourceAcknowledgeModal.benefitDepartmentContect",
        "primary.portal.members.resourceAcknowledgeModal.acknowledgeResource",
        "primary.portal.common.selectionRequired",
        "primary.portal.members.resourceAcknowledgeModal.onGoToHomePage",
    ]);

    constructor(
        @Inject(MAT_DIALOG_DATA)
        private readonly data: { resourceAckNeeded: any[] },
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly documentService: DocumentApiService,
        private readonly dialogRef: MatDialogRef<any>
    ) {
        this.resourceList = this.data.resourceAckNeeded;
    }

    ngOnInit(): void {
        this.resourceType = this.resourceList.map((r: any) => r.resourceType);
        this.acknowledgementForm = this.fb.group({
            acknowledge: ["", Validators.required],
        });
        if (this.resourceList && this.resourceList.length > 1) {
            this.multipleResources = true;
        } else {
            this.multipleResources = false;
        }
    }

    /* This will open document on new window tab. */
    onViewResource(resource: any): void {
        if (resource.resourceType === this.file) {
            const documentId = resource.documentId;
            this.documentSubscriber = this.documentService.getDocument(documentId).subscribe((r) => {
                this.fileName = r.fileName;
            });
            const fileType = this.fileName.split(".").pop();
            this.downloadDocumentSubscription = this.documentService
                .downloadDocument(documentId)
                .subscribe((response) => {
                    switch (fileType) {
                        case "pdf":
                            const pdfBlob = new Blob([response], { type: "application/pdf" });
                            const fileurl = URL.createObjectURL(pdfBlob);
                            window.open(fileurl, "_blank");
                            break;
                        default:
                            const blob = new Blob([response], {
                                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            });
                            const anchor = document.createElement("a");
                            anchor.download = this.fileName;
                            const fileURLBlob = URL.createObjectURL(blob);
                            anchor.href = fileURLBlob;
                            document.body.appendChild(anchor);
                            anchor.click();
                    }
                });
        }
        if (resource.resourceType === this.url || resource.resourceType === this.video) {
            window.open(resource.link, "_blank");
        }
    }

    onLogoutClick(): void {
        this.dialogRef.close("logout");
    }

    onGoToHomePage(): void {
        let anyError = false;
        if (!this.acknowledgementForm.valid) {
            this.acknowledgementForm.controls.acknowledge.setErrors({ requirement: true });
            anyError = true;
        }
        if (!anyError) {
            this.dialogRef.close("home");
        }
    }

    ngOnDestroy(): void {
        if (this.documentSubscriber) {
            this.documentSubscriber.unsubscribe();
        }
        if (this.downloadDocumentSubscription) {
            this.downloadDocumentSubscription.unsubscribe();
        }
    }
}
