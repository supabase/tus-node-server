export declare const REQUEST_METHODS: readonly ["POST", "HEAD", "PATCH", "OPTIONS", "DELETE"];
export declare const HEADERS: readonly ["Authorization", "Content-Type", "Location", "Tus-Extension", "Tus-Max-Size", "Tus-Resumable", "Tus-Version", "Upload-Concat", "Upload-Defer-Length", "Upload-Length", "Upload-Metadata", "Upload-Offset", "X-HTTP-Method-Override", "X-Requested-With", "X-Forwarded-Host", "X-Forwarded-Proto", "Forwarded"];
export declare const HEADERS_LOWERCASE: ("authorization" | "content-type" | "location" | "tus-extension" | "tus-max-size" | "tus-resumable" | "tus-version" | "upload-concat" | "upload-defer-length" | "upload-length" | "upload-metadata" | "upload-offset" | "x-http-method-override" | "x-requested-with" | "x-forwarded-host" | "x-forwarded-proto" | "forwarded")[];
export declare const ALLOWED_HEADERS: string;
export declare const ALLOWED_METHODS: string;
export declare const EXPOSED_HEADERS: string;
export declare const ERRORS: {
    readonly MISSING_OFFSET: {
        readonly status_code: 403;
        readonly body: "Upload-Offset header required\n";
    };
    readonly INVALID_CONTENT_TYPE: {
        readonly status_code: 403;
        readonly body: "Content-Type header required\n";
    };
    readonly FILE_NOT_FOUND: {
        readonly status_code: 404;
        readonly body: "The file for this url was not found\n";
    };
    readonly INVALID_OFFSET: {
        readonly status_code: 409;
        readonly body: "Upload-Offset conflict\n";
    };
    readonly FILE_NO_LONGER_EXISTS: {
        readonly status_code: 410;
        readonly body: "The file for this url no longer exists\n";
    };
    readonly INVALID_LENGTH: {
        readonly status_code: 400;
        readonly body: "Upload-Length or Upload-Defer-Length header required\n";
    };
    readonly INVALID_METADATA: {
        readonly status_code: 400;
        readonly body: "Upload-Metadata is invalid. It MUST consist of one or more comma-separated key-value pairs. The key and value MUST be separated by a space. The key MUST NOT contain spaces and commas and MUST NOT be empty. The key SHOULD be ASCII encoded and the value MUST be Base64 encoded. All keys MUST be unique";
    };
    readonly UNKNOWN_ERROR: {
        readonly status_code: 500;
        readonly body: "Something went wrong with that request\n";
    };
    readonly FILE_WRITE_ERROR: {
        readonly status_code: 500;
        readonly body: "Something went wrong receiving the file\n";
    };
    readonly UNSUPPORTED_CONCATENATION_EXTENSION: {
        readonly status_code: 501;
        readonly body: "Concatenation extension is not (yet) supported. Disable parallel uploads in the tus client.\n";
    };
    readonly UNSUPPORTED_CREATION_DEFER_LENGTH_EXTENSION: {
        readonly status_code: 501;
        readonly body: "creation-defer-length extension is not (yet) supported.\n";
    };
    readonly UNSUPPORTED_EXPIRATION_EXTENSION: {
        readonly status_code: 501;
        readonly body: "expiration extension is not (yet) supported.\n";
    };
};
export declare const POST_CREATE: "POST_CREATE";
export declare const POST_RECEIVE: "POST_RECEIVE";
export declare const POST_FINISH: "POST_FINISH";
export declare const POST_TERMINATE: "POST_TERMINATE";
export declare const EVENTS: {
    readonly POST_CREATE: "POST_CREATE";
    readonly POST_RECEIVE: "POST_RECEIVE";
    readonly POST_FINISH: "POST_FINISH";
    readonly POST_TERMINATE: "POST_TERMINATE";
};
export declare const MAX_AGE: 86400;
export declare const TUS_RESUMABLE: "1.0.0";
export declare const TUS_VERSION: readonly ["1.0.0"];
