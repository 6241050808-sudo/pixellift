import { ModelStyle, UpscaleMode } from "@/backend";

/** Backend `Timestamp` values are milliseconds since the Unix epoch. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp));
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Thai-formatted date, or a fallback when the timestamp is invalid. */
export function formatTimestamp(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  return date ? dateFormatter.format(date) : "ไม่ทราบเวลา";
}

/** Human-readable byte size, e.g. "2.4 MB". */
export function formatBytes(bytes: bigint): string {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const scaled = value / 1024 ** exponent;
  const rounded = exponent === 0 ? scaled : Math.round(scaled * 10) / 10;
  return `${rounded} ${units[exponent]}`;
}

/** Pixel dimensions, e.g. "1920 × 1080". */
export function formatDimensions(width: bigint, height: bigint): string {
  return `${width.toString()} × ${height.toString()}`;
}

/** Thai label for an upscaling mode. */
export function modeLabel(mode: UpscaleMode): string {
  switch (mode) {
    case UpscaleMode.fast:
      return "เร็ว";
    case UpscaleMode.balanced:
      return "เพิ่มความคมชัดเท่าเดิม";
    case UpscaleMode.quality:
      return "เพิ่มความละเอียด";
    default:
      return "ไม่ทราบโหมด";
  }
}

/** Thai label for a model style. */
export function modelStyleLabel(style: ModelStyle): string {
  switch (style) {
    case ModelStyle.general:
      return "ทั่วไป";
    case ModelStyle.photo:
      return "ภาพถ่าย";
    case ModelStyle.anime:
      return "อนิเมะ";
    case ModelStyle.text:
      return "ตัวอักษร";
    default:
      return "ไม่ทราบสไตล์";
  }
}

/** Short form of a principal for compact display. */
export function shortPrincipal(principal: string): string {
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 5)}…${principal.slice(-4)}`;
}
