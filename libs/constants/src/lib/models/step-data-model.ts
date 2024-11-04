import { BasePlanApplicationPanel } from "./base-plan-application-panel-model";
import { CustomSection } from "./custom-section-model";
import { RiderIndex } from "./rider-index-model";
import { Step } from "./step.model";

export interface StepData {
    index?: string;
    application: BasePlanApplicationPanel;
    currentSection?: CustomSection;
    currentStep?: number;
    steps?: Step[];
    rider?: RiderIndex;
    reInstatement?: boolean;
    blurFlag?: boolean;
    previousProduct?: string;
    nextProduct?: string;
    lastStep?: boolean;
    basePlanId?: number;
    reinstate?: boolean;
    isRider?: boolean;
}
