import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download as DownloadIcon,
  ExternalLink,
  FileDown,
  Info,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * The project's GitHub Releases page. The APK is built by GitHub Actions and
 * published here as a release asset, so this is the single download entry point.
 */
const GITHUB_RELEASES_URL =
  "https://github.com/caffeine-ai/pixellift/releases/latest";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: FileDown,
    title: "ดาวน์โหลดไฟล์ APK",
    body: "เปิดหน้า GitHub Releases แล้วแตะไฟล์ .apk ในส่วน Assets ของเวอร์ชันล่าสุด ไฟล์จะถูกบันทึกไว้ในโฟลเดอร์ Downloads ของมือถือ",
  },
  {
    icon: Settings2,
    title: "อนุญาตติดตั้งจากแหล่งที่ไม่รู้จัก",
    body: "ไปที่ ตั้งค่า › แอป › การเข้าถึงพิเศษ › ติดตั้งแอปที่ไม่รู้จัก แล้วเปิดสิทธิ์ให้เบราว์เซอร์หรือแอปไฟล์ที่คุณใช้เปิด APK",
  },
  {
    icon: DownloadIcon,
    title: "เปิดไฟล์และยืนยันการติดตั้ง",
    body: "แตะไฟล์ APK ที่ดาวน์โหลดมา แล้วกด “ติดตั้ง” หากมีคำเตือนของ Play Protect ให้เลือก “ติดตั้งอยู่ดี” เพื่อดำเนินการต่อ",
  },
  {
    icon: Sparkles,
    title: "เปิดแอปและเริ่มใช้งาน",
    body: "เมื่อติดตั้งเสร็จ เปิดแอป PixelLift จากหน้าจอหลัก แล้วนำภาพเข้าสตูดิโอเพื่อเพิ่มความละเอียดได้ทันที",
  },
];

const REQUIREMENTS = [
  "Android 8.0 (Oreo) หรือใหม่กว่า",
  "พื้นที่ว่างในเครื่องอย่างน้อย 150 MB",
  "อนุญาตการติดตั้งจากแหล่งที่ไม่รู้จักสำหรับแอปที่ใช้เปิดไฟล์ APK",
];

/**
 * Download & install guide for the Android APK. Explains the sideload flow,
 * links to the project's GitHub Releases page, and states the debug-build caveat.
 */
export function DownloadPage() {
  return (
    <div
      data-ocid="download.page"
      className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
    >
      <Link
        to="/"
        data-ocid="download.back_link"
        className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground outline-none transition-smooth hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        กลับไปที่สตูดิโอ
      </Link>

      <header className="mt-6 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          แอป Android
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          ดาวน์โหลดและติดตั้ง PixelLift บนมือถือ
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          PixelLift ทำงานได้เต็มรูปแบบบนเบราว์เซอร์ แต่หากต้องการประสบการณ์แบบแอป
          คุณสามารถติดตั้งเวอร์ชัน Android ได้ ไฟล์ APK ถูกสร้างโดยอัตโนมัติผ่าน GitHub
          Actions และเผยแพร่ไว้ที่หน้า Releases ของโปรเจกต์
        </p>
      </header>

      <section
        data-ocid="download.cta_panel"
        aria-labelledby="download-cta-heading"
        className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Smartphone className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2
              id="download-cta-heading"
              className="font-display text-lg font-bold tracking-tight text-foreground"
            >
              ดาวน์โหลด APK ล่าสุด
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ไฟล์ติดตั้งเวอร์ชันล่าสุดพร้อมให้ดาวน์โหลดจาก GitHub Releases
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0 rounded-xl">
          <a
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noreferrer"
            data-ocid="download.releases_button"
          >
            <DownloadIcon aria-hidden="true" />
            ไปที่ GitHub Releases
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </Button>
      </section>

      <section aria-labelledby="download-steps-heading" className="mt-12">
        <h2
          id="download-steps-heading"
          className="font-display text-xl font-bold tracking-tight text-foreground"
        >
          ขั้นตอนการติดตั้ง
        </h2>
        <ol
          data-ocid="download.steps_list"
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                data-ocid={`download.step.${index + 1}`}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">
                    ขั้นที่ {index + 1}
                  </p>
                  <h3 className="mt-0.5 font-display text-base font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section
          data-ocid="download.requirements_panel"
          aria-labelledby="download-requirements-heading"
          className="rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            <h2
              id="download-requirements-heading"
              className="font-display text-base font-semibold tracking-wide text-foreground"
            >
              ข้อกำหนดเบื้องต้น
            </h2>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {REQUIREMENTS.map((requirement) => (
              <li key={requirement} className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="text-sm text-muted-foreground">
                  {requirement}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          data-ocid="download.notice_panel"
          aria-labelledby="download-notice-heading"
          className="rounded-2xl border border-warning/40 bg-warning/10 p-5 sm:p-6"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
            <h2
              id="download-notice-heading"
              className="font-display text-base font-semibold tracking-wide text-foreground"
            >
              หมายเหตุสำคัญ
            </h2>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            ไฟล์ APK นี้เป็น{" "}
            <span className="font-semibold text-foreground">debug build</span>{" "}
            สำหรับการทดสอบเท่านั้น ยังไม่ได้ลงนามด้วย release keystore
            จึงไม่เหมาะสำหรับเผยแพร่บน Google Play และอาจแสดงคำเตือนด้านความปลอดภัย
            ของระบบปฏิบัติการระหว่างการติดตั้ง
          </p>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            หากต้องการทดลองใช้อย่างรวดเร็วโดยไม่ติดตั้งแอป คุณสามารถใช้งาน PixelLift
            ผ่านเบราว์เซอร์ได้ทันที
          </p>
        </section>
      </div>
    </div>
  );
}
