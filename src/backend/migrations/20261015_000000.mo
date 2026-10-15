import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type JobId = Nat;

  type UpscaleMode = {
    #fast;
    #balanced;
    #quality;
  };

  type ModelStyle = {
    #general;
    #photo;
    #anime;
    #text;
  };

  type Job = {
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
    createdAt : Nat;
    resultBlob : Blob;
    thumbnailBlob : Blob;
  };

  type UserJobs = {
    jobs : Map.Map<JobId, Job>;
    order : List.List<JobId>;
    var nextId : JobId;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    userJobs : Map.Map<Principal, UserJobs>;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      userJobs = Map.empty();
    };
  };
};
