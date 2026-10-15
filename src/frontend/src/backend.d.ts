import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface Cell {
    value: Value;
    name: string;
}
export interface CreateJobInput {
    resultHeight: bigint;
    originalWidth: bigint;
    originalHeight: bigint;
    mode: UpscaleMode;
    modelStyle: ModelStyle;
    fileName: string;
    resultWidth: bigint;
    resultByteSize: bigint;
    thumbnailBlob: ExternalBlob;
    resultBlob: ExternalBlob;
    scaleFactor: bigint;
    originalByteSize: bigint;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Job {
    id: JobId;
    resultHeight: bigint;
    originalWidth: bigint;
    originalHeight: bigint;
    mode: UpscaleMode;
    createdAt: Timestamp;
    modelStyle: ModelStyle;
    fileName: string;
    resultWidth: bigint;
    resultByteSize: bigint;
    thumbnailBlob: ExternalBlob;
    resultBlob: ExternalBlob;
    scaleFactor: bigint;
    originalByteSize: bigint;
}
export type JobId = bigint;
export interface JobSummary {
    id: JobId;
    resultHeight: bigint;
    mode: UpscaleMode;
    createdAt: Timestamp;
    modelStyle: ModelStyle;
    fileName: string;
    resultWidth: bigint;
    thumbnailBlob: ExternalBlob;
    scaleFactor: bigint;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum ModelStyle {
    anime = "anime",
    text = "text",
    general = "general",
    photo = "photo"
}
export enum UpscaleMode {
    fast = "fast",
    quality = "quality",
    balanced = "balanced"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Persist a completed upscaling job for the signed-in caller.
     */
    createJob(input: CreateJobInput): Promise<JobId>;
    /**
     * / Delete one of the caller's jobs by id.
     */
    deleteJob(id: JobId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Return the backend's public API documentation as Markdown.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Fetch one of the caller's jobs by id.
     */
    getJob(id: JobId): Promise<Job | null>;
    /**
     * / Fetch the thumbnail blob for one of the caller's jobs.
     */
    getThumbnail(id: JobId): Promise<ExternalBlob | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List the caller's jobs, newest first.
     */
    listJobs(): Promise<Array<JobSummary>>;
    schema(): Promise<string>;
}
