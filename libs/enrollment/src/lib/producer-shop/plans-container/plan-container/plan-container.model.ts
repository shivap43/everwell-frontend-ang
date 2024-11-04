import { ApplicationStatusTypes } from "@empowered/api";
import { EnrollmentRequirement } from "@empowered/constants";
import { PlanKnockoutEligibility } from "../../services/producer-shop-component-store/producer-shop-component-store.model";
import { EndCoverageStatus } from "../plans-container.model";

export interface EndCoverageQleEventData {
    endCoverageStatus: EndCoverageStatus;
    requestedCoverageEndDate: string;
    iconData: EndCoverageIconData;
}

export interface PlanContainerData {
    knockoutEligibility: PlanKnockoutEligibility;
    inValidEnrollmentRequirement: EnrollmentRequirement;
    enrollmentStatus: ApplicationStatusTypes;
    enrollmentStatusIconData: EnrollmentStatusIconData | null;
    enrollmentEditable: boolean;
    disablePlanPanel: boolean;
    isOtherPanelMandatoryReinstate: boolean;
}

export interface EnrollmentStatusIconData {
    class: EnrollmentStatusIconClass;
    name: EnrollmentStatusIconName;
}

export interface EndCoverageIconData {
    class: EndCoverageIconClass;
    name: EndCoverageIconName;
}

export enum EnrollmentStatusIconClass {
    ENROLLED = "icon-success",
    ACTIVE = "mon-icon-status icon-success",
    LAPSED = "mon-icon-close icon-warning",
    ENDED = "mon-icon-status",
}

export enum EnrollmentStatusIconName {
    ENROLLED = "circle-check",
    ACTIVE = "Filled-check",
    LAPSED = "Filled-warning",
    ENDED = "Filled-check",
}

export enum EndCoverageIconName {
    ACTIVE = "Filled-check",
    ENDED = "Filled-X",
    END_COVERAGE_REQUESTED = "Filled-dash",
}

export enum EndCoverageIconClass {
    ACTIVE = "mon-icon-status icon-success",
    ENDED = "mon-icon-status icon-danger",
    END_COVERAGE_REQUESTED = "mon-icon-close icon-warning",
}
