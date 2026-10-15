import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ImagePlus, Sparkles } from "lucide-react";

/**
 * Shown when the signed-in user has no saved jobs yet. Offers a direct path
 * back to the studio so the empty view always has a next step.
 */
export function EmptyState() {
  return (
    <div
      data-ocid="history.empty_state"
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
        <ImagePlus className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-foreground">
        ยังไม่มีงานในประวัติ
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        เมื่อคุณเพิ่มความละเอียดภาพเสร็จ งานจะถูกบันทึกไว้ที่นี่พร้อมภาพย่อ การตั้งค่า และวันที่
        เพื่อให้กลับมาดาวน์โหลดได้ทุกเมื่อ
      </p>
      <Button asChild className="mt-6 rounded-xl">
        <Link to="/" data-ocid="history.empty_cta_button">
          <Sparkles aria-hidden="true" />
          เริ่มเพิ่มความละเอียด
        </Link>
      </Button>
    </div>
  );
}
