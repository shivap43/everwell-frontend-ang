import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";
import { FormControl, FormBuilder } from "@angular/forms";
import { CompanyCode } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { MatSelectChange } from "@angular/material/select";

@Component({
    selector: "empowered-pbr-sub-header",
    templateUrl: "./pended-business-sub-header.component.html",
    styleUrls: ["./pended-business-sub-header.component.scss"],
})
export class PbrSubHeaderComponent implements OnInit {
    companyCodes: { name: string; value: string }[];
    companyCodeCtrl: FormControl;
    languageStrings: Record<string, string>;
    @Output() companyCodeSelectionChange: EventEmitter<CompanyCode> = new EventEmitter<CompanyCode>();
    @Input() showCompanyCodeSelect: boolean;

    constructor(private readonly formBuilder: FormBuilder, private readonly langService: LanguageService) {}

    ngOnInit(): void {
        this.fetchLanguageData();
        this.companyCodeCtrl = this.formBuilder.control(CompanyCode.ALL);

        this.companyCodes = [
            {
                name: this.languageStrings["primary.portal.administrators.all"],
                value: CompanyCode.ALL,
            },
            {
                name: this.languageStrings["primary.portal.pbr.overview.table.columns.us"],
                value: CompanyCode.US,
            },
            {
                name: this.languageStrings["primary.portal.pbr.overview.table.columns.ny"],
                value: CompanyCode.NY,
            },
        ];
    }

    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.administrators.all",
            "primary.portal.pbr.overview.table.columns.us",
            "primary.portal.pbr.overview.table.columns.ny",
            "primary.portal.pendedBusiness.companyCode",
            "primary.portal.common.select",
            "primary.portal.pendedBusiness.allPendedApps.noResults",
        ]);
    }
    onSelectionChange(event: MatSelectChange): void {
        this.companyCodeSelectionChange.emit(event.value);
    }
}
