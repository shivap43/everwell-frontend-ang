// model for filter parameters
export interface FilterParameters {
    search?: string;
    property?: string;
    value?: string;
    filter?: string;
    page?: string;
    size?: string;
    unassignedOnly?: boolean;
    includeAllSubordinates?: boolean;
    filteredGroupList?: number[];
}
