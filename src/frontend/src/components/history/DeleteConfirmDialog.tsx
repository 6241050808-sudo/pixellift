import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  fileName: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Thai confirmation dialog shown before a history entry is removed. The
 * destructive action stays disabled while the delete mutation is in flight.
 */
export function DeleteConfirmDialog({
  open,
  fileName,
  isPending,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        data-ocid="history.delete_dialog"
        className="rounded-2xl border-border bg-card shadow-elevated"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-lg font-bold tracking-tight">
            ลบรายการนี้หรือไม่?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            งาน{" "}
            <span className="font-medium text-foreground">“{fileName}”</span>{" "}
            จะถูกลบออกจากประวัติอย่างถาวร และไม่สามารถกู้คืนได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            data-ocid="history.delete_cancel_button"
            disabled={isPending}
            className="rounded-xl"
          >
            ยกเลิก
          </AlertDialogCancel>
          <AlertDialogAction
            data-ocid="history.delete_confirm_button"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 aria-hidden="true" />
            )}
            {isPending ? "กำลังลบ…" : "ลบรายการ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
