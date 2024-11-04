export interface UploadedFile {
    id: number;
    name: string;
    file: File;
    documentId?: number;
    errorMessage?: string;
    percentComplete?: number;
}
