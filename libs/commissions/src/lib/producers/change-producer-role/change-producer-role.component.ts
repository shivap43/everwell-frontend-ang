import { Component, OnInit, Optional, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
interface DialogData {
    producerId: string;
    name: string;
    role: string;
    roleList: any;
    primaryButton: any;
    secondaryButton: any;
    previousPrimaryFirstName: string;
}
@Component({
    selector: "empowered-change-producer-role",
    templateUrl: "./change-producer-role.component.html",
    styleUrls: ["./change-producer-role.component.scss"],
})
export class ChangeProducerRoleComponent implements OnInit {
    roleList = [];
    selectedRole: string;
    languageString: Record<string, string>;
    ROLE_DETAILS = "";
    changeRoleString = "";
    replaceString = "";

    constructor(
        private readonly dialogRef: MatDialogRef<ChangeProducerRoleComponent>,
        private readonly languageService: LanguageService,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
    ) {
        if (data) {
            if (data.role) {
                this.selectedRole = data.role;
            }
            if (data.roleList) {
                this.roleList = data.roleList;
            }
        }
    }

    ngOnInit(): void {
        this.fetchlanguageValues();
    }
    closePopup(): void {
        this.dialogRef.close();
    }
    primaryButtonClick(): void {
        if (this.data.primaryButton) {
            this.dialogRef.close({ save: "Save", selectedRole: this.selectedRole });
        }
    }
    secondaryButtonClick(): void {
        if (this.data.secondaryButton) {
            this.dialogRef.close("Don't Save");
        }
    }
    setLanguageStrings(): void {
        this.ROLE_DETAILS =
            `<strong>${this.languageString["primary.portal.commission.producer.single.addSplit.primaryProd"]}</strong>
        ${this.languageString["primary.portal.commission.producer.single.addSplit.primaryProdDesc"]}</br></br>` +
            `<strong>${this.languageString["primary.portal.commission.producer.single.addSplit.assistingProd"]}</strong>
        ${this.languageString["primary.portal.commission.producer.single.addSplit.assistingProdDesc"]}</br></br>` +
            `<strong>${this.languageString["primary.portal.commission.producer.single.addSplit.enroller"]}</strong>
        ${this.languageString["primary.portal.commission.producer.single.addSplit.enrollerDesc"]}</br></br>` +
            `<strong>${this.languageString["primary.portal.commission.producer.single.addSplit.noAuthProducer"]}</strong>
            ${this.languageString["primary.portal.commission.producer.single.addSplit.noAuthProducerDesc"]}`;
        this.changeRoleString = this.languageString["primary.portal.commission.producer.change.header"].replace(
            "##PRODUCERFIRSTNAME##",
            this.data?.name,
        );
        this.replaceString = this.languageString["primary.portal.commission.producer.replace.hint"].replace(
            "##PRIMARY##",
            this.data?.previousPrimaryFirstName,
        );
    }

    fetchlanguageValues(): void {
        this.languageString = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.commission.producer.single.addSplit.primaryProd",
            "primary.portal.commission.producer.single.addSplit.primaryProdDesc",
            "primary.portal.commission.producer.single.addSplit.assistingProd",
            "primary.portal.commission.producer.single.addSplit.assistingProdDesc",
            "primary.portal.commission.producer.single.addSplit.enroller",
            "primary.portal.commission.producer.single.addSplit.enrollerDesc",
            "primary.portal.commission.producer.change.header",
            "primary.portal.commission.producer.replace.hint",
            "primary.portal.commission.producer.single.addSplit.noAuthProducer",
            "primary.portal.commission.producer.single.addSplit.noAuthProducerDesc",
            "primary.portal.common.close",
            "primary.portal.common.info",
        ]);
        this.setLanguageStrings();
    }
}
