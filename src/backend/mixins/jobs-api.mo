import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/jobs";
import JobsLib "../lib/jobs";

mixin (userJobs : Map.Map<Principal, Types.UserJobs>) {
  /// Persist a completed upscaling job for the signed-in caller.
  public shared ({ caller }) func createJob(input : Types.CreateJobInput) : async Types.JobId {
    JobsLib.createJob(userJobs, caller, input);
  };

  /// List the caller's jobs, newest first.
  public query ({ caller }) func listJobs() : async [Types.JobSummary] {
    JobsLib.listJobs(userJobs, caller);
  };

  /// Fetch one of the caller's jobs by id.
  public query ({ caller }) func getJob(id : Types.JobId) : async ?Types.Job {
    JobsLib.getJob(userJobs, caller, id);
  };

  /// Delete one of the caller's jobs by id.
  public shared ({ caller }) func deleteJob(id : Types.JobId) : async Bool {
    JobsLib.deleteJob(userJobs, caller, id);
  };

  /// Fetch the thumbnail blob for one of the caller's jobs.
  public query ({ caller }) func getThumbnail(id : Types.JobId) : async ?Storage.ExternalBlob {
    JobsLib.getThumbnail(userJobs, caller, id);
  };
};
