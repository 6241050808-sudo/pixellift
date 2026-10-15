import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BlobValue "mo:caffeineai-oql/BlobValue";
import UpscaleModeValue "types/UpscaleModeValue";
import ModelStyleValue "types/ModelStyleValue";
import Types "types/jobs";
import JobsMixin "mixins/jobs-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  include MixinObjectStorage();

  let userJobs : Map.Map<Principal, Types.UserJobs>;

  include JobsMixin(userJobs);

  include ApiDocMixin();

  // Flatten the per-user job storage into one `job` row per persisted job.
  // The owner lives in the map key, so `newScoped` scans only the resolved
  // subject's rows and honours per-user scoping.
  func jobRows(subject : ?Principal) : Iter.Iter<Types.Job> {
    switch (subject) {
      case (?user) {
        switch (userJobs.get(user)) {
          case (?state) { state.jobs.values() };
          case null { [].values() };
        };
      };
      case null {
        let all = Map.empty<Types.JobId, Types.Job>();
        for (state in userJobs.values()) {
          for ((id, job) in state.jobs.entries()) {
            all.add(id, job);
          };
        };
        all.values();
      };
    };
  };

  include Expose({
    entities = [
      OQL.Entity.newScoped<Types.Job>(
        "job",
        jobRows,
        "Job",
        "id",
      )
        .sample({
          id = 0;
          fileName = "";
          mode = #fast : Types.UpscaleMode;
          scaleFactor = 1;
          modelStyle = #general : Types.ModelStyle;
          originalWidth = 0;
          originalHeight = 0;
          resultWidth = 0;
          resultHeight = 0;
          originalByteSize = 0;
          resultByteSize = 0;
          createdAt = 0;
          resultBlob = "" : Blob;
          thumbnailBlob = "" : Blob;
        })
        .scopedPerUser()
        .build(),
    ];
  });
};
