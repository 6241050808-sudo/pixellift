/// Public API documentation for PixelLift, served as static Markdown.
/// This mixin declares only `getApiDoc`; it reads no actor state.
mixin () {
  /// Return the backend's public API documentation as Markdown.
  public query func getApiDoc() : async Text {
    "# PixelLift Backend API

PixelLift stores the history of completed image-upscaling jobs. Every job
belongs to exactly one user, and every method below is scoped to the
authenticated caller: a caller can only ever read or delete its own jobs.

## Authentication and identity

All five job-history methods require a signed (non-anonymous) caller. The
caller's identity is the Internet Computer principal derived from the
frontend's Internet Identity session; there is no separate login or token.

The frontend pins an Internet Identity derivation origin, published at
`/.well-known/ii-derivation-origin` when available. An agent that already
holds the user's Internet Identity authorization derives the correct per-app
principal against that origin, for example:

    icp identity link web <name> --app <host>

Such a delegation acts with the user's full authority in this app until it
expires. A principal derived against a different origin is a different
principal, so it sees a different (empty) job history.

There is no registration step for the job-history API: the first call from a
signed-in principal simply starts with an empty history. Anonymous callers
are rejected by the platform's caller check.

## Methods

### createJob(input : CreateJobInput) : async JobId

Persists one completed upscaling job for the caller and returns its numeric
id. The id is unique per caller and monotonically increasing.

CreateJobInput fields:

| Field | Type | Unit / encoding |
| --- | --- | --- |
| fileName | Text | Original file name, as supplied by the client |
| mode | UpscaleMode | #fast | #balanced | #quality |
| scaleFactor | Nat | Integer multiplier, e.g. 2 or 4 |
| modelStyle | ModelStyle | #general | #photo | #anime | #text |
| originalWidth | Nat | Pixels |
| originalHeight | Nat | Pixels |
| resultWidth | Nat | Pixels |
| resultHeight | Nat | Pixels |
| originalByteSize | Nat | Bytes |
| resultByteSize | Nat | Bytes |
| resultBlob | Storage.ExternalBlob | Object-storage reference to the upscaled image |
| thumbnailBlob | Storage.ExternalBlob | Object-storage reference to the thumbnail |

createdAt is not part of the input: the backend stamps it with the current
time in milliseconds since the Unix epoch.

Retry safety: createJob is not idempotent. Calling it twice creates two
distinct jobs with different ids. Retry only when the previous call failed
before returning an id.

### listJobs() : async [JobSummary]

Returns the caller's jobs as lightweight summaries, newest first (the most
recently created job is at index 0). A caller with no jobs receives an empty
array. Summaries omit the full-size result blob and the byte sizes; they
carry id, fileName, mode, scaleFactor, modelStyle, resultWidth, resultHeight,
createdAt, and thumbnailBlob.

This is a query method: it is fast and read-only.

### getJob(id : JobId) : async ?Job

Returns the full job record for id, or null when no job with that id belongs
to the caller. A job id that exists for another user is indistinguishable
from a nonexistent id: both return null.

The returned Job includes both resultBlob and thumbnailBlob object storage
references plus originalByteSize and resultByteSize.

This is a query method.

### deleteJob(id : JobId) : async Bool

Deletes the caller's job with id and returns true when a record was removed,
or false when no such job belongs to the caller. Deleting an already-deleted
id returns false.

Retry safety: deletion is idempotent in effect - a repeated call returns
false and changes nothing. Deletion is destructive and cannot be undone.

### getThumbnail(id : JobId) : async ?Storage.ExternalBlob

Returns the thumbnail object-storage reference for the caller's job id, or
null when no such job belongs to the caller. Use this to render history cards
without fetching the full job record.

This is a query method.

## Units and encodings

- Timestamps (createdAt) are milliseconds since the Unix epoch, as a Nat.
  Divide by 1,000 for seconds.
- Byte sizes (originalByteSize, resultByteSize) are bytes.
- Dimensions (originalWidth, originalHeight, resultWidth, resultHeight) are
  pixels.
- Blobs (resultBlob, thumbnailBlob) are Storage.ExternalBlob references (a
  Blob whose UTF-8 content is an object-storage URL such as
  !caf!sha256:...). They are not raw image bytes; resolve them through the
  object-storage gateway.
- Ids (JobId) are Nat values, unique per caller.

## Lifecycle and polling

Jobs are created only by createJob, after the client has finished upscaling
and uploaded the result and thumbnail to object storage. There is no
server-side processing queue and no pending state: a job returned by
createJob is already complete. Polling is therefore unnecessary - call
listJobs or getJob when the UI needs to refresh.

## Errors and gotchas

- All methods are scoped to the caller; there is no cross-user access.
- getJob and getThumbnail return null for ids that do not belong to the
  caller, including ids that belong to another user.
- listJobs returns newest first; do not assume ascending id order.
- createJob is not idempotent; deleteJob is safe to retry.
- Anonymous callers cannot call any of these methods.
";
  };
};
