export interface AccountListProducer {
    id: number;
    firstName: string;
    lastName: string;
    writingNumbers: string[];
    primary: boolean;
    pendingInvitation: boolean;
}
