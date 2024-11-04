import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { TabMeta } from "../models/EmpTab";

@Injectable({
    providedIn: "root",
})
export class EmpStepperService {
    private tabStateStream$: BehaviorSubject<TabMeta[]> = new BehaviorSubject([]);
    private stepperStateStream$: Subject<StepperState> = new Subject();
    private stepperResultStream$: Subject<Map<string, any>> = new Subject();
    private stepperCommandStream$: Subject<StepperCommand> = new Subject();
    private stepperPreviousStepStream$: Subject<number> = new Subject();
    private stepperGoToStepStream$: Subject<string> = new Subject();
    private selectedHQPlan: number;

    constructor() {}

    setTabState(tabState: TabMeta[]): void {
        return this.tabStateStream$.next(tabState);
    }

    getTabStateStream(): Observable<TabMeta[]> {
        return this.tabStateStream$.asObservable();
    }

    next(result?: Map<string, any>): void {
        if (result) {
            this.stepperResultStream$.next(result);
        } else {
            this.stepperCommandStream$.next("NEXT");
        }
    }

    previous(): void {
        this.stepperCommandStream$.next("PREVIOUS");
        this.stepperStateStream$.next("IN_PROGRESS");
    }

    previousStep(stepIndex: number): void {
        this.stepperPreviousStepStream$.next(stepIndex);
    }

    goToStep(tabId: string): void {
        this.stepperGoToStepStream$.next(tabId);
    }

    reset(): void {
        this.stepperCommandStream$.next("RESET");
        this.stepperStateStream$.next("IN_PROGRESS");
    }

    save(): void {
        this.stepperCommandStream$.next("SAVE");
    }

    setStepperState(state: StepperState): void {
        this.stepperStateStream$.next(state);
    }

    completeStepper(result: Map<string, any>): void {
        this.stepperResultStream$.next(result);
        this.stepperResultStream$.complete();
        this.stepperStateStream$.next("COMPLETE");
        this.stepperStateStream$.complete();
    }

    getStepperCommandStream(): Observable<StepperCommand> {
        return this.stepperCommandStream$.asObservable();
    }

    getStepperStateStream(): Observable<StepperState> {
        return this.stepperStateStream$.asObservable();
    }

    getStepperResultStream(): Observable<Map<string, any>> {
        return this.stepperResultStream$.asObservable();
    }

    getStepperPreviousStepStream(): Observable<number> {
        return this.stepperPreviousStepStream$.asObservable();
    }

    getStepperGoToStepStream(): Observable<string> {
        return this.stepperGoToStepStream$.asObservable();
    }
    /**
     * Method to save HQ funded plan ID
     * @param id Vas HQ Plan ID
     */
    saveSelectedVasHQPlanId(id: number): void {
        this.selectedHQPlan = id;
    }
    /**
     * Method to fetch the VAS HQ Plan id
     * @returns Vas HQ Plan ID
     */
    getSelectedVasHQPlanId(): number {
        return this.selectedHQPlan;
    }
}

export type StepperState = "IN_PROGRESS" | "FINAL_STEP" | "COMPLETE" | "CANCELED" | "ERROR" | "API_ERROR";
export type StepperCommand = "PREVIOUS" | "NEXT" | "SAVE" | "RESET";
