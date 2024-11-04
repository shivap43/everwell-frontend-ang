import { AudienceGrouping } from "../../account/models/incentive.model";
import { Admin } from "@empowered/constants";
import { TargetUnit } from "./target-unit.model";

export interface AbstractMessage {
    readonly id?: number;
    readonly exchangeType?: string;
    from?: TargetUnit;
    sentTo?: TargetUnit;
    body: string;
    attachments?: MessageAttachment[];
    readonly sentOn?: string;
}

export interface Message extends AbstractMessage {
    readonly exchangeType?: "PRODUCER";
}

export interface CategorizedMessage extends AbstractMessage {
    readonly exchangeType?: "AUDIENCE" | "MEMBER";
    assignedAdminId?: number;
    readonly assignedAdmin?: Admin;
    audienceGroupingId?: number;
    readonly audienceGrouping?: AudienceGrouping;
}

export interface MessageAttachment {
    referenceType: ReferenceType;
    referenceId: number;
}

export interface MessageCategory {
    readonly id?: number;
    name?: string;
    readonly numberOfThreads?: number;
    readonly numberOfUnresolvedThreads?: number;
}

export enum ReferenceType {
    FILE = "FILE",
    RESOURCE = "RESOURCE",
    PLAN_DOCUMENT = "PLAN_DOCUMENT",
}
