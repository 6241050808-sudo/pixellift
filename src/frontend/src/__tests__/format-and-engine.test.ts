import { ModelStyle, UpscaleMode } from "@/backend";
import {
  formatBytes,
  formatDimensions,
  formatTimestamp,
  modeLabel,
  modelStyleLabel,
  shortPrincipal,
  timestampToDate,
} from "@/lib/format";
import {
  MAX_OUTPUT_EDGE,
  exceedsOutputLimit,
  outputDimensions,
} from "@/lib/upscale-engine";
import { describe, expect, it } from "vitest";

describe("format helpers", () => {
  it("renders pixel dimensions as 'W × H'", () => {
    expect(formatDimensions(1920n, 1080n)).toBe("1920 × 1080");
  });

  it("renders human-readable byte sizes", () => {
    expect(formatBytes(0n)).toBe("0 B");
    expect(formatBytes(512n)).toBe("512 B");
    expect(formatBytes(2048n)).toBe("2 KB");
    expect(formatBytes(2_621_440n)).toBe("2.5 MB");
  });

  it("maps backend modes to Thai labels", () => {
    expect(modeLabel(UpscaleMode.quality)).toBe("เพิ่มความละเอียด");
    expect(modeLabel(UpscaleMode.balanced)).toBe("เพิ่มความคมชัดเท่าเดิม");
    expect(modeLabel(UpscaleMode.fast)).toBe("เร็ว");
  });

  it("maps backend model styles to Thai labels", () => {
    expect(modelStyleLabel(ModelStyle.photo)).toBe("ภาพถ่าย");
    expect(modelStyleLabel(ModelStyle.anime)).toBe("อนิเมะ");
    expect(modelStyleLabel(ModelStyle.text)).toBe("ตัวอักษร");
    expect(modelStyleLabel(ModelStyle.general)).toBe("ทั่วไป");
  });

  it("converts a millisecond timestamp to a date and rejects invalid input", () => {
    expect(timestampToDate(1_700_000_000_000n)?.getTime()).toBe(
      1_700_000_000_000,
    );
    expect(timestampToDate(0n)?.getTime()).toBe(0);
    expect(formatTimestamp(1_700_000_000_000n)).not.toBe("ไม่ทราบเวลา");
  });

  it("shortens long principals but leaves short ones intact", () => {
    expect(shortPrincipal("abc")).toBe("abc");
    const long = "abcdefghijklmnop";
    expect(shortPrincipal(long)).toBe("abcde…mnop");
  });
});

describe("upscale engine dimension math", () => {
  it("scales width and height by the factor", () => {
    expect(outputDimensions(256, 192, 4)).toEqual({ width: 1024, height: 768 });
    expect(outputDimensions(100, 50, 2)).toEqual({ width: 200, height: 100 });
  });

  it("keeps dimensions unchanged at 1x (sharpen-only mode)", () => {
    expect(outputDimensions(640, 480, 1)).toEqual({ width: 640, height: 480 });
  });

  it("flags outputs beyond the safe edge limit", () => {
    expect(exceedsOutputLimit(256, 192, 4)).toBe(false);
    expect(exceedsOutputLimit(MAX_OUTPUT_EDGE, 10, 2)).toBe(true);
    expect(exceedsOutputLimit(MAX_OUTPUT_EDGE, 10, 1)).toBe(false);
  });
});
