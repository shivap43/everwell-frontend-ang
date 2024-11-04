export enum TargetUnitType {
    CATEGORY = "CATEGORY",
    ADMIN = "ADMIN",
    PRODUCER = "PRODUCER",
    MEMBER = "MEMBER",
    AUDIENCE = "AUDIENCE",
}

export interface TargetUnit {
    type: TargetUnitType;
    ids: number[];
}
