import { FormGroup } from "@angular/forms";
import { MatExpansionPanel } from "@angular/material/expansion";
import {
    Component,
    OnInit,
    Input,
    ViewChild,
    EventEmitter,
    Output,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    OnDestroy,
} from "@angular/core";
import { ClassNames, ClassTypeDisplay, ClassType, AccountService } from "@empowered/api";
import { PortalsService } from "../../portals.service";
import { EditClassComponent } from "./edit-class/edit-class.component";
import { ActionType } from "../../shared/models/container-data-model";
import { LanguageModel } from "@empowered/api";
import { LanguageService, LanguageState } from "@empowered/language";
import { Store, Select } from "@ngxs/store";
import { Observable, Subscription } from "rxjs";
import { map, take } from "rxjs/operators";
import { Permission, CarrierId, RatingCode } from "@empowered/constants";

import { AccountListState, SharedState, StaticUtilService } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-class",
    templateUrl: "./class.component.html",
    styleUrls: ["./class.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassComponent implements OnInit, OnDestroy {
    @ViewChild(MatExpansionPanel, { static: true }) panel: MatExpansionPanel;
    @Select(SharedState.regex) regex$: Observable<any>;
    @Input() className: ClassNames;
    @Input() classType: ClassTypeDisplay;
    @Input() totalNumberOfMembers: number;
    @Input() addClass: { add: boolean; isFirst: boolean };
    @Input() hasOneClass: boolean;
    @Input() classesList: string[];
    @Input() isPrivacyOnForEnroller: boolean;
    @Output() removeClass: EventEmitter<{
        className: ClassNames;
        classType: ClassType;
    }> = new EventEmitter<{
        className: ClassNames;
        classType: ClassType;
    }>();
    panelClosedSubscription: Subscription;
    // TODO - Use language for this.
    removeClassErrors;
    editClassForm: FormGroup;
    panelOpenState: boolean;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    portalHostId: string;
    CLASS_NAME_PATTERN: string;
    languageStrings: Record<string, string>;
    isPEOClassType: boolean;
    isPEO$: Observable<boolean>;
    permissionEnum = Permission;
    isPeoEditAllowed$ = this.staticUtilService.hasPermission(Permission.EDIT_PEO_CLASS);
    isPeoRemoveAllowed$ = this.staticUtilService.hasPermission(Permission.REMOVE_PEO_CLASS);
    isPeoAddAllowed$ = this.staticUtilService.hasPermission(Permission.ADD_PEO_CLASS);

    constructor(
        readonly portalsService: PortalsService,
        private readonly store: Store,
        private readonly cdr: ChangeDetectorRef,
        private readonly language: LanguageService,
        private readonly accountService: AccountService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        if (this.regex$) {
            this.regex$.pipe(take(1)).subscribe((data) => {
                if (data) {
                    this.CLASS_NAME_PATTERN = data.CLASS_NAME_PATTERN;
                }
            });
        }
    }

    /**
     * Used to get PEO class type and rating Code
     */
    ngOnInit(): void {
        const mpGroupId = this.store.selectSnapshot(AccountListState.getMpGroupId);
        this.isPEO$ = this.accountService.getAccount(mpGroupId.toString()).pipe(map((resp) => resp.ratingCode === RatingCode.PEO));
        this.fetchLanguage();
        this.isPEOClassType = this.classType.carrierId === CarrierId.AFLAC;
        this.removeClassErrors = {
            errHasEmployees: this.languageStrings["primary.portal.classes.class.remove.employees"],
            errHasOneClass: this.languageStrings["primary.portal.classes.class.remove.oneClass"],
        };
        // FIXME - Temp fix for [MON-20803]: Listen to subject emissions till a solution is figured out for why event emitter didn't work.
        if (this.portalsService.panelClosed$) {
            this.panelClosedSubscription = this.portalsService.panelClosed$.subscribe(() => this.triggerPanelToggle(false));
        }
        if (this.classType && this.classType.id) {
            this.portalHostId = `portal-host-${this.classType.id}`;
        } else {
            this.portalHostId = "portal-host-0";
        }
    }

    editClass(): void {
        this.panel.disabled = false;
        this.portalsService.selectedClass = this.className;
        this.portalsService.selectedClassType = this.classType;
        this.portalsService.attachPortal(EditClassComponent, {
            actionType: ActionType.class_update,
            className: this.className,
            classType: this.classType,
            classesList: this.classesList,
            panel: this.panel,
        });
    }
    addClasses(): void {
        this.panel.disabled = false;
        this.portalsService.selectedClass = null;
        this.portalsService.selectedClassType = this.classType;
        this.cdr.detectChanges();
        this.portalsService.attachPortal(
            EditClassComponent,
            {
                actionType: this.isPEOClassType ? ActionType.class_create_peo : ActionType.class_create,
                classType: this.classType,
                classesList: this.classesList,
                panel: this.panel,
                defaultPayFreq: this.classType.defaultClass ? this.classType.defaultClass["payFrequencyId"] : null,
            },
            this.classType.id.toString(),
        );
        this.cdr.detectChanges();
    }
    getRemoveClassError(): string {
        if (this.hasOneClass) {
            return this.removeClassErrors.errHasOneClass;
        }
        if (this.className && this.className.numberOfMembers > 0) {
            return this.removeClassErrors.errHasEmployees;
        }
        return null;
    }
    // Let parent component handle this since it has knowledge of other classes.
    onRemoveClassClicked(): void {
        if (!this.getRemoveClassError()) {
            this.removeClass.emit({
                className: this.className,
                classType: this.classType,
            });
        }
    }
    triggerPanelToggle(isOpen: boolean): void {
        const expPanels = document.querySelectorAll(".mat-expansion-panel");
        const wholeSection = document.querySelector(".class-whole-section");

        expPanels.forEach((each) => {
            if (isOpen) {
                wholeSection.classList.add("class-whole-white");
                each.classList.add("panel-white-out");
                Array.prototype.forEach.call(each.getElementsByTagName("mat-expansion-panel-header"), (el) => {
                    el.setAttribute("tabindex", "-1");
                });
            } else {
                wholeSection.classList.remove("class-whole-white");
                each.classList.remove("panel-white-out");
                Array.prototype.forEach.call(each.getElementsByTagName("mat-expansion-panel-header"), (el) =>
                    el.removeAttribute("tabindex"),
                );
            }
        });
        this.panelOpenState = isOpen;
    }
    fetchLanguage(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.common.remove",
            "primary.portal.common.edit",
            "primary.portal.members.workLabel.addClassLabel",
            "primary.portal.members.workLabel.addClassLabel.PEO",
            "primary.portal.classes.newClass",
            "primary.portal.classes.newClass.PEO",
            "primary.portal.classes.class.remove.employees",
            "primary.portal.classes.class.remove.oneClass",
            "primary.portal.classtypePopup.industryCode",
        ]);
    }
    ngOnDestroy(): void {
        this.panelClosedSubscription.unsubscribe();
    }
}
