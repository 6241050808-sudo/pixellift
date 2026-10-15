import { createActor } from "@/backend";
import type { CreateJobInput, Job, JobId, JobSummary } from "@/types/jobs";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const JOBS_KEY = ["jobs"] as const;

/** List the signed-in caller's jobs, newest first. */
export function useJobs() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<JobSummary[]>({
    queryKey: JOBS_KEY,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listJobs();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Fetch a single job by id. */
export function useJob(id: JobId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Job | null>({
    queryKey: ["job", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getJob(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

/** Persist a completed upscaling job. */
export function useCreateJob() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<JobId, Error, CreateJobInput>({
    mutationFn: async (input: CreateJobInput) => {
      if (!actor) throw new Error("ยังไม่พร้อมเชื่อมต่อกับเซิร์ฟเวอร์");
      return actor.createJob(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: JOBS_KEY });
    },
  });
}

/** Delete one of the caller's jobs. */
export function useDeleteJob() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, JobId>({
    mutationFn: async (id: JobId) => {
      if (!actor) throw new Error("ยังไม่พร้อมเชื่อมต่อกับเซิร์ฟเวอร์");
      return actor.deleteJob(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: JOBS_KEY });
    },
  });
}
