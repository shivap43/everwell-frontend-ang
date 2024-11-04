import {
    Component,
    ComponentFactoryResolver,
    ComponentRef,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    Output,
    EventEmitter,
} from "@angular/core";
import { Observable, Subject } from "rxjs";
import { StepMeta } from "../models/EmpStep";
import { TabMeta, TabState } from "../models/EmpTab";
import { EmpStepperService, StepperState, StepperCommand } from "./../stepper-service/emp-stepper.service";
import { tap, takeUntil } from "rxjs/operators";
import { StepModel, AbstractComponentStep, TabModel } from "@empowered/constants";

@Component({
    selector: "empowered-emp-stepper",
    templateUrl: "./emp-stepper.component.html",
    styleUrls: ["./emp-stepper.component.scss"],
})
export class EmpStepperComponent implements OnInit, OnDestroy {
    @Input() steps: StepModel[];
    @Input() tabs: TabModel[];

    @Input() steps$: Observable<StepModel[]>;
    @Input() tabs$: Observable<TabModel[]>;

    @Output() isTouched: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() currentStep: EventEmitter<number> = new EventEmitter<number>();
    @Output() savedStepId: EventEmitter<string> = new EventEmitter<string>();

    private stepsFromObservable: StepModel[];
    private tabsFromObservable: TabModel[];

    @ViewChild("stepView", { read: ViewContainerRef, static: true }) stepView: ViewContainerRef;
    private stepViewComponent: ComponentRef<AbstractComponentStep>;

    private stepIndex = -1;
    private stepState: StepMeta[] = [];

    private stepStateFromObservable: StepMeta[] = [];
    private tabStateFromObservable: TabMeta[] = [];

    private unsubscribeSubject: Subject<void> = new Subject();

    private command$: Observable<StepperCommand> = this.stepperService.getStepperCommandStream().pipe(
        tap((command) => {
            switch (command) {
                case "NEXT":
                    this.next();
                    break;
                case "PREVIOUS":
                    this.previous();
                    break;
                case "SAVE":
                    this.save();
                    break;
                case "RESET":
                    this.resetStepper();
                    break;
            }
        }),
        takeUntil(this.unsubscribeSubject.asObservable()),
    );

    private previousStep$: Observable<number> = this.stepperService.getStepperPreviousStepStream().pipe(
        tap((stepIndex) => {
            this.previous(stepIndex);
        }),
        takeUntil(this.unsubscribeSubject.asObservable()),
    );

    private goToStep$: Observable<string> = this.stepperService.getStepperGoToStepStream().pipe(
        tap((tabId) => {
            this.goToStepBasedOnTabId(tabId);
        }),
        takeUntil(this.unsubscribeSubject.asObservable()),
    );

    constructor(private resolver: ComponentFactoryResolver, private stepperService: EmpStepperService) {}

    ngOnInit(): void {
        this.steps$.subscribe((steps) => {
            this.stepsFromObservable = steps;
            const originalStepStates = [...this.stepStateFromObservable];
            this.stepStateFromObservable = [];
            for (const step of steps) {
                let existingStepState: StepMeta;
                if (originalStepStates) {
                    existingStepState = originalStepStates.find((stepState) => stepState.stepId === step.id);
                }
                this.stepStateFromObservable.push({
                    stepId: step.id,
                    cachedForm: existingStepState ? existingStepState.cachedForm : null,
                });
            }
        });

        this.tabs$.subscribe((tabs) => {
            this.tabsFromObservable = tabs;
            const originalTabStates = [...this.tabStateFromObservable];
            this.tabStateFromObservable = [];
            for (const tab of tabs) {
                let existingTabState: TabMeta;
                if (originalTabStates) {
                    existingTabState = originalTabStates.find((tabState) => tabState.tabId === tab.id);
                }
                this.tabStateFromObservable.push({
                    tabId: tab.id,
                    active: false,
                    state: existingTabState ? existingTabState.state : "CLEAN",
                });
            }
        });

        if (this.stepsFromObservable && this.stepsFromObservable[0]) {
            this.determineNextState(this.stepsFromObservable[0].id);
        }

        this.command$.subscribe();
        this.previousStep$.subscribe();
        this.goToStep$.subscribe();
    }

    ngOnDestroy(): void {
        this.unsubscribeSubject.next();
    }

    /**
     * Reset the stepper so that it can collect fresh data
     */
    resetStepper(): void {
        this.stepIndex = -1;
        this.stepState = [];
        this.stepStateFromObservable = [];

        this.steps$.subscribe((steps) => {
            this.stepsFromObservable = steps;
            const originalStepStates = [...this.stepStateFromObservable];
            this.stepStateFromObservable = [];
            for (const step of steps) {
                let existingStepState: StepMeta;
                if (originalStepStates) {
                    existingStepState = originalStepStates.find((stepState) => stepState.stepId === step.id);
                }
                this.stepStateFromObservable.push({
                    stepId: step.id,
                    cachedForm: existingStepState ? existingStepState.cachedForm : null,
                });
            }
        });

        this.tabs$.subscribe((tabs) => {
            const originalTabStates = [...this.tabStateFromObservable];
            this.tabStateFromObservable = [];
            for (const tab of tabs) {
                let existingTabState: TabMeta;
                if (originalTabStates) {
                    existingTabState = originalTabStates.find((tabState) => tabState.tabId === tab.id);
                }
                this.tabStateFromObservable.push({
                    tabId: tab.id,
                    active: false,
                    state: existingTabState ? existingTabState.state : "CLEAN",
                });
            }
        });

        // Load first step
        this.determineNextState(this.stepsFromObservable[0].id);
    }

    /**
     * Generate the composite data to submit to the API from the Form Groups associated with a form
     */
    private composeFormData(formId: string): any {
        const composite = {};

        const stepIds = this.stepsFromObservable.filter((step) => step.formId === formId).map((step) => step.id);
        const formGroups = this.stepStateFromObservable
            .filter((stepState) => stepIds.includes(stepState.stepId))
            .map((stepState) => stepState.cachedForm);

        if (formGroups) {
            formGroups
                // Map the FormGroup controls to the composite data object
                .forEach((group) => {
                    if (group) {
                        Object.keys(group.controls).forEach((key) => {
                            composite[key] = group.controls[key].value;
                        });
                    }
                });
        }

        return composite;
    }

    /**
     * Load the target step into the view and prepopulate it with data
     * @param targetStep The step to display in the view
     */
    private updateStepView(targetStep: StepMeta): void {
        this.stepView.clear();

        const step = this.stepsFromObservable.find((stepModel) => stepModel.id === targetStep.stepId);

        const factory = this.resolver.resolveComponentFactory(step.stepComponentType);
        this.stepViewComponent = this.stepView.createComponent(factory);

        // Initialize the component with the required data
        if (targetStep.cachedForm != null) {
            this.stepViewComponent.instance.form = targetStep.cachedForm;
        } else if (step.inputData != null) {
            // Update the form with any pre-loaded values
            Object.keys(this.stepViewComponent.instance.form.controls)
                .filter((key) => step.inputData.has(key))
                .forEach((controlKey) => {
                    this.stepViewComponent.instance.form.controls[controlKey].setValue(step.inputData.get(controlKey));
                });
        }

        if (step.prerequisiteData) {
            step.prerequisiteData.forEach((requirement) => {
                const prerequisiteForm = this.stepStateFromObservable.find((stepMeta) => stepMeta.stepId === requirement.formId);
                if (prerequisiteForm != null && prerequisiteForm.cachedForm.controls[requirement.controlName] != null) {
                    this.updateComponentProperty(
                        this.stepViewComponent.instance,
                        requirement.controlName,
                        prerequisiteForm.cachedForm.controls[requirement.controlName].value,
                    );
                }
            });
        }

        if (step.inputData) {
            step.inputData.forEach((value, key) => {
                this.updateComponentProperty(this.stepViewComponent.instance, key, value);
            });
        }

        // Call hook to handle newly loaded properties
        this.stepViewComponent.instance.onPropertyLoad();
        this.stepViewComponent.instance.isTouched
            .pipe(
                tap((val) => this.isTouched.emit(val)),
                takeUntil(this.unsubscribeSubject.asObservable()),
            )
            .subscribe();

        this.updateTabActive(step.tabId, true);
    }

    /**
     * Attempt to traverse to the previous step in the stepper
     */
    private previous(stepIndex?: number): void {
        this.goToStep(stepIndex);
    }

    /**
     * Attempt to traverse to a particular step in the stepper based on tabId
     */
    private goToStepBasedOnTabId(tabId: string): void {
        const stepIndex = this.stepsFromObservable.indexOf(this.stepsFromObservable.find((step) => step.tabId === tabId));
        this.goToStep(stepIndex);
        this.currentStep.emit(stepIndex + 1);
    }

    /**
     * Attempt to traverse to a particular step in the stepper
     */
    private goToStep(stepIndex?: number): void {
        if (this.stepIndex > 0 || stepIndex) {
            const currentStep: AbstractComponentStep = this.stepViewComponent.instance;
            this.stepStateFromObservable[this.stepIndex].cachedForm = currentStep.form;

            const step = this.stepsFromObservable.find((stepModel) => stepModel.id === this.stepStateFromObservable[this.stepIndex].stepId);
            this.updateTabActive(step.tabId, false);
            this.stepIndex = stepIndex !== undefined ? stepIndex : this.stepIndex - 1;
            this.updateStepView(this.stepStateFromObservable[this.stepIndex]);
        }
    }

    /**
     * Attempt to traverse to the next step in the stepper and propagate result to the parent component
     */
    private next(): void {
        const currentStepMeta = this.stepStateFromObservable[this.stepIndex];
        const step = this.stepsFromObservable.find((stepModel) => stepModel.id === currentStepMeta.stepId);
        const currentStepComponent: AbstractComponentStep = this.stepViewComponent.instance;

        if (currentStepComponent.form == null) {
            // Step with no form, next step will not require data
            if (step.nextStep) {
                this.determineNextState(step.nextStep());
            } else {
                this.completeStepper();
            }
        } else if (currentStepComponent.form.valid) {
            // Form is valid, attempt the next step
            currentStepMeta.cachedForm = currentStepComponent.form;

            if (step.evaluateNextStep) {
                this.emitCurrentStepData(step);
            } else if (step.nextStep) {
                this.emitCurrentStepData(step);
                this.determineNextState(step.nextStep(currentStepMeta.cachedForm));
            } else {
                this.completeStepper();
            }
        } else {
            // Form was not valid, alert the user
            currentStepComponent.onInvalidTraversal();
        }
    }

    private save(): void {
        const currentStepMeta = this.stepStateFromObservable[this.stepIndex];
        const step = this.stepsFromObservable.find((stepModel) => stepModel.id === currentStepMeta.stepId);
        const currentStepComponent: AbstractComponentStep = this.stepViewComponent.instance;
        this.savedStepId.emit(step.id);
        currentStepMeta.cachedForm = currentStepComponent.form;
        if (currentStepComponent.form !== null && currentStepComponent.form.valid) {
            this.emitCurrentStepData(step);
        } else if (currentStepComponent.form.invalid) {
            currentStepComponent.onInvalidTraversal();
        }
    }

    private emitCurrentStepData(step: StepModel): void {
        this.stepperService.next(
            this.stepStateFromObservable
                .filter((stepState) => stepState.stepId !== undefined)
                .filter((stepState) => {
                    const filteredStep = this.stepsFromObservable.find((stepModel) => stepModel.id === stepState.stepId);
                    return filteredStep !== undefined ? filteredStep.formId != null && filteredStep.formId === step.formId : false;
                })
                .map((stepState) =>
                    this.stepsFromObservable.find((stepModel) => stepModel.id === stepState.stepId)
                        ? this.stepsFromObservable.find((stepModel) => stepModel.id === stepState.stepId).formId
                        : undefined,
                )
                .reduce((uniqueFormIds, formId) => (uniqueFormIds.includes(formId) ? uniqueFormIds : [...uniqueFormIds, formId]), [])
                .reduce((compositeMap, formId) => compositeMap.set(formId, this.composeFormData(formId)), new Map()),
        );
    }

    /**
     * Abstracted logic to update the step state array with the correct next value
     */
    private determineNextState(stepId: string): void {
        let step: StepMeta;
        let stepperState: StepperState = "IN_PROGRESS";

        const newStep = this.stepsFromObservable.find((stepModel) => stepModel.id === stepId);
        if (this.stepIndex + 1 === this.stepStateFromObservable.length) {
            // New step
            step = { stepId: newStep.id, cachedForm: null };
            this.stepStateFromObservable.push(step);
        } else if (this.stepsFromObservable[this.stepIndex + 1].id === stepId) {
            // Same existing step
            step = this.stepStateFromObservable.find((stepMeta) => stepMeta.stepId === stepId);
        } else {
            // Next step is new path, trim dead branch
            this.stepStateFromObservable
                .slice(this.stepIndex + 1, this.stepState.length + 1)
                .map((stateMeta) =>
                    this.stepsFromObservable.find((steps) => steps.id === stateMeta.stepId)
                        ? this.stepsFromObservable.find((steps) => steps.id === stateMeta.stepId).tabId
                        : undefined,
                )
                .filter((tabId) => tabId)
                .forEach((tabId) => this.updateTabState(tabId, "CLEAN"));
            this.stepStateFromObservable = this.stepStateFromObservable.slice(0, this.stepIndex + 1);
            step = { stepId: newStep.id, cachedForm: null };
            this.stepStateFromObservable.push(step);
        }

        if (newStep && !newStep.nextStep) {
            stepperState = "FINAL_STEP";
        }

        this.stepperService.setStepperState(stepperState);

        // update the tabs states
        let currentTab: string;
        let currentStep: StepModel;
        if (this.stepIndex >= 0) {
            currentStep = this.stepsFromObservable.find(
                (stepModel) => this.stepStateFromObservable[this.stepIndex].stepId === stepModel.id,
            );
            currentTab = currentStep ? currentStep.tabId : undefined;
            this.updateTabActive(currentTab, false);
            this.updateTabState(currentTab, "COMPLETED");
        }

        this.stepIndex++;
        this.updateStepView(step);

        currentStep = this.stepsFromObservable.find((stepModel) => this.stepStateFromObservable[this.stepIndex].stepId === stepModel.id);
        currentTab = currentStep ? currentStep.tabId : undefined;
        this.updateTabActive(currentTab, true);
        this.updateTabState(currentTab, "TOUCHED");
    }

    /**
     * Propogate the results to the parent component
     */
    private completeStepper(): void {
        const currentTab = this.tabStateFromObservable[this.stepIndex].tabId;
        this.updateTabActive(currentTab, false);
        this.updateTabState(currentTab, "COMPLETED");

        this.stepperService.completeStepper(
            this.stepsFromObservable
                .filter((step) => step.formId)
                .map((step) => step.formId)
                .reduce((uniqueFormIds, formId) => (uniqueFormIds.includes(formId) ? uniqueFormIds : [...uniqueFormIds, formId]), [])
                .reduce((compositeMap, formId) => compositeMap.set(formId, this.composeFormData(formId)), new Map()),
        );
    }

    /**
     * Update the given tab with a new active state
     * @param tabId Tab to update
     * @param active If the tab should be active or not
     */
    private updateTabActive(tabId: string, active: boolean): void {
        if (tabId != null) {
            const currentTab = this.tabStateFromObservable.find((tabMeta) => tabMeta.tabId === tabId);
            if (currentTab != null) {
                currentTab.active = active;
                this.stepperService.setTabState(this.tabStateFromObservable);
            }
        }
    }

    /**
     * Update the given tab with a new state
     * @param tabId Tab to update
     * @param state New state of the tab
     */
    private updateTabState(tabId: string, tabState: TabState): void {
        if (tabId != null) {
            const currentTab = this.tabStateFromObservable.find((tab) => tab.tabId === tabId);
            if (currentTab != null) {
                currentTab.state = tabState;
                const parentTabId = this.tabsFromObservable.find((tab) => tab.id === tabId).parentTab;
                if (parentTabId) {
                    const childrenTabs = this.tabsFromObservable
                        .filter((tab) => tab.parentTab === parentTabId)
                        .map((childrenTab) => childrenTab.id);
                    const childrenTabState = this.tabStateFromObservable.filter((tabMeta) =>
                        childrenTabs.find((childrenTab) => childrenTab === tabMeta.tabId),
                    );
                    const parentTabState = this.tabStateFromObservable.find((tabMeta) => tabMeta.tabId === parentTabId);
                    if (childrenTabs.length === childrenTabState.filter((childState) => childState.state === tabState).length) {
                        parentTabState.state = tabState;
                    }
                }
                this.stepperService.setTabState(this.tabStateFromObservable);
            }
        }
    }

    private updateComponentProperty(instance: AbstractComponentStep, propertyName: string, propertyValue: any): void {
        if (instance.form.controls[propertyName] != null) {
            instance.form.controls[propertyName].setValue(propertyValue);
        } else {
            instance[propertyName] = propertyValue;
        }
    }
}
