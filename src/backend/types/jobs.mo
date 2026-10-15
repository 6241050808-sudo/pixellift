import Map "mo:core/Map";
import List "mo:core/List";
import Storage "mo:caffeineai-object-storage/Storage";
import Common "common";

module {
  public type JobId = Common.JobId;
  public type Timestamp = Common.Timestamp;

  /// Upscaling mode chosen by the user.
  public type UpscaleMode = {
    #fast;
    #balanced;
    #quality;
  };

  /// Model style used for the enhancement pass.
  public type ModelStyle = {
    #general;
    #photo;
    #anime;
    #text;
  };

  /// Full job record persisted per user.
  public type Job = {
    id : JobId;
    fileName : Text;
    mode : UpscaleMode;
    scaleFactor : Nat;
    modelStyle : ModelStyle;
    originalWidth : Nat;
    originalHeight : Nat;
    resultWidth : Nat;
    resultHeight : Nat;
    originalByteSize : Nat;
    resultByteSize : Nat;
    createdAt : Timestamp;
    resultBlob : Storage.ExternalBlob;
    thumbnailBlob : Storage.ExternalBlob;
  };

  /// Lightweight job summary for the history list (newest first).
  public type JobSummary = {
    id : JobId;
    fileName : Text;
    mode : UpscaleMode;
    scaleFactor : Nat;
    modelStyle : ModelStyle;
    resultWidth : Nat;
    resultHeight : Nat;
    createdAt : Timestamp;
    thumbnailBlob : Storage.ExternalBlob;
  };

  /// Input payload for creating a job record.
  public type CreateJobInput = {
    fileName : Text;
    mode : UpscaleMode;
    scaleFactor : Nat;
    modelStyle : ModelStyle;
    originalWidth : Nat;
    originalHeight : Nat;
    resultWidth : Nat;
    resultHeight : Nat;
    originalByteSize : Nat;
    resultByteSize : Nat;
    resultBlob : Storage.ExternalBlob;
    thumbnailBlob : Storage.ExternalBlob;
  };

  /// Per-user persistent state: job records plus the newest-first id index.
  public type UserJobs = {
    jobs : Map.Map<JobId, Job>;
    order : List.List<JobId>;
    var nextId : JobId;
  };
};
