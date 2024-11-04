export interface FileDetails {
    name: string;
    modifiedName?: string;
    lastModified?: number;
    size?: number;
    type?: string;
    slice?(start?: number, end?: number, contentType?: string): Blob;
    alreadyUploaded?: boolean;
    isError?: boolean;
    isSuccess?: boolean;
    canDownload?: boolean;
    errorStatus?: string;
    successStatus?: string;
    isProgressBarEnabled?: boolean;
    isUploadingStarted?: boolean;
    documentId?: number;
    isFileSelected?: boolean;
    isFileUploaded?: boolean;
    modeProgress?: string;
    fileUploadPercentage?: number;
    status?: string;
}
