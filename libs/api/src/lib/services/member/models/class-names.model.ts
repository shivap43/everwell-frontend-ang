export interface CreateClass {
    clazz: ClassNames;
}
export interface ClassNames {
    id?: number;
    name: string;
    description?: string;
    payFrequency?: number;
    riskClass?: string;
    default?: boolean;
    numberOfMembers?: number;
    isselected?: boolean;
    classTypeId?: number;
}
export interface ClassObject {
    type: string;
    classTypeId: number;
    classId: number;
}
