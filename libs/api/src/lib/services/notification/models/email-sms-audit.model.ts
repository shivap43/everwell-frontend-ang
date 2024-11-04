export enum MessageType {
    EMAIL = "EMAIL",
    SMS = "SMS",
}
export interface EmailSMSAudit {
    adminId: number;
    type: MessageType;
    dateSent: string;
    subject: string;
    smsMessage: string;
}
