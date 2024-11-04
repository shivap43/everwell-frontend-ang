import { Component, OnInit, Inject } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-previous-covered-dependents",
    templateUrl: "./previous-covered-dependents.component.html",
    styleUrls: ["./previous-covered-dependents.component.scss"],
})
export class PreviousCoveredDependentsComponent implements OnInit {
    // TODO - Language integration
    displayedColumns = ["name", "startDate", "endDate"];
    dataSource = new MatTableDataSource<any>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.editCoverage.name",
        "primary.portal.editCoverage.previouslycoveryDependents",
        "primary.portal.editCoverage.startDate",
        "primary.portal.editCoverage.endDate",
        "primary.portal.editCoverage.close",
    ]);

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly data: any,
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<PreviousCoveredDependentsComponent>
    ) {}

    ngOnInit(): void {
        this.dataSource.data = this.data;
    }

    closeForm(): void {
        this.dialogRef.close();
    }
}
