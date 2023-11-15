type TUpload = {
    id: string;
    size?: number;
    offset: number;
    metadata?: Record<string, string | null>;
    creation_date?: string;
};
export declare class Upload {
    id: TUpload['id'];
    metadata: TUpload['metadata'];
    size?: TUpload['size'];
    offset: TUpload['offset'];
    creation_date: TUpload['creation_date'];
    constructor(upload: TUpload);
    get sizeIsDeferred(): boolean;
}
export {};
