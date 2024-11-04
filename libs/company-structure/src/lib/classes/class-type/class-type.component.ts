import { SharedService } from "@empowered/common-services";
import { ClassType, LanguageModel, ClassNames } from "@empowered/api";
import { MatExpansionPanel } from "@angular/material/expansion";
import { MatDialog } from "@angular/material/dialog";
import { Component, OnInit, Input, ViewChild, EventEmitter, Output, ChangeDetectionStrategy, OnDestroy } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { EditClassTypeComponent } from "./edit-class-type/edit-class-type.component";
import { PortalsService } from "../../portals.service";
import { RemoveClassTypeComponent } from "./remove-class-type/remove-class-type.component";
import { RemoveClassComponent } from "../class/remove-class/remove-class.component";
import { ClassTypeDetails } from "../../shared/models/class-type-details.model";
import { ActionType } from "../../shared/models/container-data-model";
import { ClassComponent } from "../class/class.component";
import { LanguageService, LanguageState } from "@empowered/language";
import { Store } from "@ngxs/store";
import { Subscription } from "rxjs";
import { AlertType, ConfigName, Permission, PagePrivacy, CarrierId } from "@empowered/constants";
import { AccountInfoState, SharedState } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-class-type",
    templateUrl: "./class-type.component.html",
    styleUrls: ["./class-type.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassTypeComponent implements OnInit, OnDestroy {
    @Input() classTypeDetails: ClassTypeDetails;
    @Input() addClassType: boolean;
    @ViewChild(MatExpansionPanel, { static: true }) panel: MatExpansionPanel;
    @ViewChild("addclassView") addclassView: ClassComponent;
    @Output() validateClassTypeName: EventEmitter<AbstractControl> = new EventEmitter<AbstractControl>();
    @Output() refreshImportPeo = new EventEmitter<void>();
    @Input() importPeoAlertType: string;
    @Input() spinner: boolean;
    classesList: string[];
    panelOpenState = false;
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.planList.title",
        "primary.portal.classes.addClassType",
        "primary.portal.classes.newClassType",
        "primary.portal.common.remove",
        "primary.portal.common.edit",
        "primary.portal.classes.classType.remove.planPricing",
        "primary.portal.classes.classType.remove.payFreq",
        "primary.portal.classes.classType.remove.planAndPay",
        "primary.portal.classes.classType.remove.required",
    ]);
    @Input() zeroState: boolean;
    @Input() classTypesList: string[];
    // TODO - Use language for this.
    removeClassTypeErrors = {
        errDeterminesPlan: this.languageStrings["primary.portal.classes.classType.remove.planPricing"],
        errDeterminesPay: this.languageStrings["primary.portal.classes.classType.remove.payFreq"],
        errPlanAndPay: this.languageStrings["primary.portal.classes.classType.remove.planAndPay"],
    };

    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    panelClosedSubscription: Subscription;
    isPEOClassType: boolean;
    peoData = false;
    peoError = false;
    showSpinner = false;
    permissionEnum = Permission;
    readonly PEO_FEATURE_ENABLE = ConfigName.FEATURE_ENABLE_PEO_RULES;
    readonly SUCCESS = AlertType.SUCCESS;
    readonly WARNING = AlertType.WARNING;
    readonly INFO = AlertType.INFO;
    readonly DANGER = AlertType.DANGER;
    isPEOAccount: boolean;
    isEnroller: boolean;
    isPrivacyOnForEnroller: boolean;

    constructor(
        readonly portalsService: PortalsService,
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly sharedService: SharedService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.ACCOUNT_STRUCTURE);
        }
    }

    /**
     * This is the initial function that executes after coming to Classes.
     * Few service calls to fetch the required data and to validate some conditions initially are performed
     */
    ngOnInit(): void {
        // FIXME - Temp fix for [MON-20803]: Listen to subject emissions till a solution is figured out for why event emitter didn't work.
        if (this.portalsService.panelClosed$) {
            this.panelClosedSubscription = this.portalsService.panelClosed$.subscribe(() => this.triggerPanelToggle(false));
        }
        this.classesList = this.classTypeDetails ? this.classTypeDetails.classes.map((clazz) => clazz.name) : null;
        this.isPEOClassType = this.classTypeDetails ? this.classTypeDetails.classType.carrierId === CarrierId.AFLAC : false;
        this.isPEOAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo).ratingCode === "PEO";
    }
    getRemoveClassTypeError(): string {
        if (this.classTypeDetails.classType.determinesPayFrequency && this.classTypeDetails.classType.determinesPlanAvailabilityOrPricing) {
            return this.removeClassTypeErrors.errPlanAndPay;
        }
        if (this.classTypeDetails.classType.determinesPayFrequency) {
            return this.removeClassTypeErrors.errDeterminesPay;
        }
        if (this.classTypeDetails.classType.determinesPlanAvailabilityOrPricing) {
            return this.removeClassTypeErrors.errDeterminesPlan;
        }
        return null;
    }
    editClassType(): void {
        this.panel.disabled = false;
        this.portalsService.selectedClassType = this.classTypeDetails.classType;
        this.portalsService.attachPortal(EditClassTypeComponent, {
            actionType: ActionType.class_type_update,
            classType: this.classTypeDetails.classType,
            classes: this.classTypeDetails.classes,
            panel: this.panel,
            classTypesList: this.classTypesList,
        });
    }
    openRemoveClassTypeDialog(): void {
        if (!this.getRemoveClassTypeError()) {
            this.dialog.open(RemoveClassTypeComponent, {
                data: this.classTypeDetails.classType,
                width: "600px",
                height: "auto",
            });
        }
    }
    openRemoveClassDialog(removeClassObj: { className: ClassNames; classType: ClassType }): void {
        const withClassList = removeClassObj.className.default
            ? Object.assign(removeClassObj, {
                list: this.classTypeDetails.classes.filter((className) => className.id !== removeClassObj.className.id),
            })
            : removeClassObj;
        this.dialog.open(RemoveClassComponent, {
            width: "600px",
            height: "auto",
            data: withClassList,
        });
    }
    addClassTypes(): void {
        this.panel.disabled = false;
        this.portalsService.selectedClassType = undefined;
        this.portalsService.attachPortal(EditClassTypeComponent, {
            actionType: ActionType.class_type_create,
            classTypesList: this.classTypesList,
            panel: this.panel,
        });
    }
    triggerPanelToggle(isOpen: boolean): void {
        const wholeSection = document.querySelector(".class-whole-section");
        const expPanels = document.querySelectorAll(".mat-expansion-panel");

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
    /*
     * Make API call here to refresh data
     */
    refreshPeoData(): void {
        this.refreshImportPeo.emit();
    }
    /**
     * life cycle hook on component destroy
     * To unsubscribe
     */
    ngOnDestroy(): void {
        this.panelClosedSubscription.unsubscribe();
    }
}
