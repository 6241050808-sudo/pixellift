import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/jobs";

module {
  /// Fetch (or lazily create) the per-user job state.
  func stateFor(
    userJobs : Map.Map<Principal, Types.UserJobs>,
    user : Principal,
  ) : Types.UserJobs {
    switch (userJobs.get(user)) {
      case (?state) { state };
      case null {
        let state : Types.UserJobs = {
          jobs = Map.empty();
          order = List.empty();
          var nextId = 0;
        };
        userJobs.add(user, state);
        state;
      };
    };
  };

  /// Create a new job record for `user`, appending it to the newest-first index.
  public func createJob(
    userJobs : Map.Map<Principal, Types.UserJobs>,
    user : Principal,
    input : Types.CreateJobInput,
  ) : Types.JobId {
    let state = stateFor(userJobs, user);
    let id = state.nextId;
    state.nextId := id + 1;
    let job : Types.Job = {
      id;
      fileName = input.fileName;
      mode = input.mode;
      scaleFactor = input.scaleFactor;
      modelStyle = input.modelStyle;
      originalWidth = input.originalWidth;
      originalHeight = input.originalHeight;
      resultWidth = input.resultWidth;
      resultHeight = input.resultHeight;
      originalByteSize = input.originalByteSize;
      resultByteSize = input.resultByteSize;
      createdAt = (Time.now() / 1_000_000).toNat();
      resultBlob = input.resultBlob;
      thumbnailBlob = input.thumbnailBlob;
    };
    state.jobs.add(id, job);
    state.order.add(id);
    id;
  };

  /// List the caller's jobs, newest first, as lightweight summaries.
  public func listJobs(
    userJobs : Map.Map<Principal, Types.UserJobs>,
    user : Principal,
  ) : [Types.JobSummary] {
    switch (userJobs.get(user)) {
      case null { [] };
      case (?state) {
        let ids = state.order.toArray();
        let summaries = List.empty<Types.JobSummary>();
        var i = ids.size();
        while (i > 0) {
          i -= 1;
          switch (state.jobs.get(ids[i])) {
            case (?job) {
              summaries.add({
                id = job.id;
                fileName = job.fileName;
                mode = job.mode;
                scaleFactor = job.scaleFactor;
                modelStyle = job.modelStyle;
                resultWidth = job.resultWidth;
                resultHeight = job.resultHeight;
                createdAt = job.createdAt;
                thumbnailBlob = job.thumbnailBlob;
              });
            };
            case null {};
          };
        };
        summaries.toArray();
      };
    };
  };

  /// Fetch one job owned by `user`, or null when it does not exist.
  public func getJob(
    userJobs : Map.Map<Principal, Types.UserJobs>,
    user : Principal,
    id : Types.JobId,
  ) : ?Types.Job {
    switch (userJobs.get(user)) {
      case null { null };
      case (?state) { state.jobs.get(id) };
    };
  };

  /// Delete one job owned by `user`; returns whether a record was removed.
  public func deleteJob(
    userJobs : Map.Map<Principal, Types.UserJobs>,
    user : Principal,
    id : Types.JobId,
  ) : Bool {
    switch (userJobs.get(user)) {
      case null { false };
      case (?state) {
        switch (state.jobs.get(id)) {
          case null { false };
          case (?_) {
            state.jobs.remove(id);
            let snapshot = state.order.toArray();
            state.order.clear();
            for (existing in snapshot.values()) {
              if (existing != id) {
                state.order.add(existing);
              };
            };
            true;
          };
        };
      };
    };
  };

  /// Fetch the thumbnail blob for one job owned by `user`, or null.
  public func getThumbnail(
    userJobs : Map.Map<Principal, Types.UserJobs>,
    user : Principal,
    id : Types.JobId,
  ) : ?Storage.ExternalBlob {
    switch (userJobs.get(user)) {
      case null { null };
      case (?state) {
        switch (state.jobs.get(id)) {
          case (?job) { ?job.thumbnailBlob };
          case null { null };
        };
      };
    };
  };
};
