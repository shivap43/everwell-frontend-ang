export interface AuditActivity {
    cause: string;
    on: string;
    actions: Action[];
}

interface Action {
    name: string;
    on: string;
}
