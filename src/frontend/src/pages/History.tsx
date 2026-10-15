import { DeleteConfirmDialog } from "@/components/history/DeleteConfirmDialog";
import { EmptyState } from "@/components/history/EmptyState";
import { JobCard } from "@/components/history/JobCard";
import { JobDetail } from "@/components/history/JobDetail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteJob, useJobs } from "@/hooks/use-jobs";
import type { JobId, JobSummary } from "@/types/jobs";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { AlertTriangle, History as HistoryIcon, LogIn } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SKELETON_IDS = Array.from(
  { length: 6 },
  (_, i) => `history-skeleton-${i}`,
);

interface PendingDelete {
  id: JobId;
  fileName: string;
}

/**
 * History route: the signed-in user's past upscaling jobs as a responsive card
 * grid, with an in-place detail view and Thai-confirmed deletion.
 */
export function HistoryPage() {
  const { isAuthenticated, login, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const { data: jobs, isLoading, isError, refetch } = useJobs();
  const deleteJob = useDeleteJob();

  const [selectedId, setSelectedId] = useState<JobId | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );

  if (!isAuthenticated) {
    return (
      <div
        data-ocid="history.signin_prompt"
        className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8"
      >
        <span className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
          <HistoryIcon className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
          เข้าสู่ระบบเพื่อดูประวัติงาน
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          ประวัติการเพิ่มความละเอียดจะถูกบันทึกไว้กับบัญชี Internet Identity ของคุณ
          และมีเพียงคุณเท่านั้นที่เห็นได้
        </p>
        <Button
          type="button"
          onClick={() => login()}
          disabled={isInitializing || isLoggingIn}
          data-ocid="history.signin_button"
          className="mt-6 rounded-xl"
        >
          <LogIn aria-hidden="true" />
          {isInitializing
            ? "กำลังโหลด…"
            : isLoggingIn
              ? "กำลังเข้าสู่ระบบ…"
              : "เข้าสู่ระบบ"}
        </Button>
      </div>
    );
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    deleteJob.mutate(target.id, {
      onSuccess: () => {
        toast.success(`ลบ “${target.fileName}” แล้ว`);
        setPendingDelete(null);
        setSelectedId((current) => (current === target.id ? null : current));
      },
      onError: () => {
        toast.error("ลบรายการไม่สำเร็จ กรุณาลองอีกครั้ง");
      },
    });
  };

  const openDelete = (job: JobSummary) =>
    setPendingDelete({ id: job.id, fileName: job.fileName });

  return (
    <div
      data-ocid="history.page"
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            PixelLift
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
            ประวัติงาน
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            งานที่เพิ่มความละเอียดสำเร็จแล้วจะถูกเก็บไว้ที่นี่ พร้อมภาพย่อ การตั้งค่า และวันที่
            เพื่อกลับมาดาวน์โหลดได้ทุกเมื่อ
          </p>
        </div>
        {!selectedId && jobs && jobs.length > 0 && (
          <p className="font-mono text-xs text-muted-foreground">
            {jobs.length} รายการ
          </p>
        )}
      </header>

      <div className="pt-8">
        {selectedId !== null ? (
          <JobDetail
            jobId={selectedId}
            onBack={() => setSelectedId(null)}
            onDelete={(id, fileName) => setPendingDelete({ id, fileName })}
          />
        ) : isLoading ? (
          <div
            data-ocid="history.loading_state"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SKELETON_IDS.map((id) => (
              <div
                key={id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="flex flex-col gap-3 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div
            data-ocid="history.error_state"
            className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 px-6 py-16 text-center"
          >
            <AlertTriangle
              className="size-6 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              ไม่สามารถโหลดประวัติงานได้ในขณะนี้
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
              data-ocid="history.retry_button"
              className="rounded-xl"
            >
              ลองอีกครั้ง
            </Button>
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            data-ocid="history.list"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {jobs.map((job, index) => (
              <JobCard
                key={job.id.toString()}
                job={job}
                index={index + 1}
                onOpen={(target) => setSelectedId(target.id)}
                onDelete={openDelete}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        fileName={pendingDelete?.fileName ?? ""}
        isPending={deleteJob.isPending}
        onOpenChange={(open) => {
          if (!open && !deleteJob.isPending) setPendingDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
