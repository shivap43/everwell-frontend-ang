import { CategorizedMessage, Message } from "./message.model";
import { TargetUnit } from "./target-unit.model";

export interface Thread {
    readonly id?: number;
    from?: TargetUnit;
    sentTo?: TargetUnit;
    subject: string;
    assignedAdminId?: number;
    categoryId?: number;
    status?: AdminStatus;

    readonly messageAttachments?: boolean;
    readonly lastReadOn?: string;
    readonly lastReceivedOn?: string;
    readonly lastSentOn?: string;
    readonly readCount?: number;
    readonly recalledOn?: string;
    readonly recalledCount?: number;
    readonly adminDeletedOn?: string;
    readonly memberDeletedOn?: string;
    readonly producerDeletedOn?: string;
}

export interface CreateThread {
    thread: Thread;
    message: Message | CategorizedMessage;
}

export type AdminStatus = "NEW" | "CLOSED" | "IN_RESEARCH";
