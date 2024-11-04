/* eslint-disable max-classes-per-file */

import { MemberQualifyingEvent } from "@empowered/constants";

export class GetQualifyingEventType {
    static readonly type = "[QualifyingEventType] GetQualifyingEventType";
    constructor(public mpGroup: number) {}
}

export class SetMemberQualifyingEvent {
    static readonly type = "[QualifyingEventType] SetMemberQualifyingEvent";
    constructor(private qualifyingEvent: MemberQualifyingEvent) {}
}
