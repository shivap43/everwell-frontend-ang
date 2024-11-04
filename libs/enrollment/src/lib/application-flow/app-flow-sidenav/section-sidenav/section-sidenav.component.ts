import { AppFlowService } from "@empowered/ngxs-store";
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnChanges } from "@angular/core";
import { Subject } from "rxjs";

@Component({
    selector: "empowered-section-sidenav",
    templateUrl: "./section-sidenav.component.html",
    styleUrls: ["./section-sidenav.component.scss"],
})
export class SectionSidenavComponent implements OnInit, OnChanges {
    @Input() currentSectionIndex: number;
    @Input() planData;
    @Input() lastCompletedSectionIndex;
    @Output() sectionChangeEvent: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild("sectionIndicator", { static: true }) sectionIndicator;
    @Input() unLockAllSteps: boolean;
    currentSection: string;
    private unsubscribe$ = new Subject<void>();
    sections = [];
    scrolled = false;
    initialize = true;
    unlock = false;

    constructor(private appFlowService: AppFlowService) {}

    ngOnInit(): void {
        const sectionData = this.planData.appData.sections.map((section) => section.title);
        sectionData.forEach((sectionTitle) => {
            const wordsArray = sectionTitle.toLowerCase().split(" ");
            if (wordsArray.length && wordsArray[0].length) {
                wordsArray[0] = wordsArray[0][0].toUpperCase() + wordsArray[0].slice(1);
            }
            this.sections.push(wordsArray.join(" "));
        });
    }

    ngOnChanges(): void {
        if (this.unLockAllSteps) {
            this.unlock = true;
            this.sectionIndicator.linear = false;
            this.sectionIndicator.selectedIndex = this.planData.appData.sections.length - 1;
            this.sectionIndicator.selectedIndex = this.currentSectionIndex;
            this.sectionIndicator.linear = true;
        }
        // if (this.initialize) {
        //     this.initialize = false;
        // } else {
        this.scrolled = true;
        this.sectionIndicator.selectedIndex = this.currentSectionIndex;
        // }
        // this.sections = this.planData.appData.sections.filter(section => {
        //     let falseCount = 0;
        //     for (const step of section.steps) {
        //         falseCount = step.showStep ? falseCount : falseCount + 1;
        //     }
        //     if (falseCount === section.steps.length) {
        //         return false;
        //     }
        //     return true;
        // });
        // this.sections = this.planData.appData.sections.map(section => section.titile);
    }

    onSectionChange(event: any): void {
        if (this.scrolled || this.unlock) {
            this.scrolled = this.scrolled ? false : this.scrolled;
            this.unlock = this.unlock ? false : this.unlock;
        } else {
            this.appFlowService.CustomSectionChanged$.next({
                sectionIndex: event.selectedIndex,
            });
        }
    }
}
