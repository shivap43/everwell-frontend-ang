import { Component, Input, OnInit } from "@angular/core";
import { TabMeta } from "../models/EmpTab";
import { EmpStepperService } from "../stepper-service/emp-stepper.service";
import { LanguageService } from "@empowered/language";
import { TabModel } from "@empowered/constants";

@Component({
    selector: "empowered-tab",
    templateUrl: "./tab.component.html",
    styleUrls: ["./tab.component.scss"],
})
export class TabComponent implements OnInit {
    @Input() tabMeta: TabMeta;
    @Input() subTabs: TabMeta[];
    @Input() stepNumber: number;
    @Input() tabs: TabModel[];
    @Input() canVisit: boolean;

    tabTitle: string;
    subTabTitles: string[];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.empStepper.tab",
        "primary.portal.empStepper.subTab",
        "primary.portal.empStepper.currentTab",
    ]);

    constructor(private readonly stepperService: EmpStepperService, private readonly language: LanguageService) {}

    ngOnInit(): void {
        this.tabTitle = this.tabs.find((tab) => tab.id === this.tabMeta.tabId).title;
        this.subTabTitles = this.tabs.filter((tab) => this.subTabs.map((subTab) => subTab.tabId).includes(tab.id)).map((tab) => tab.title);
    }

    activeChild(): boolean {
        return this.subTabs.find((subTask) => subTask.active) != null;
    }

    jumpToStep(subStepNumber?: number): void {
        if (this.canVisit) {
            this.stepperService.goToStep(this.tabMeta.tabId);
        } else if (this.activeChild() || this.tabMeta.state === "COMPLETED") {
            this.stepperService.previousStep(subStepNumber ? subStepNumber - 1 : this.stepNumber - 1);
        }
    }
}
