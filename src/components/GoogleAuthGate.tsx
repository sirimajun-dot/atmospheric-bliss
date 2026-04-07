import React, { useCallback, useEffect, useRef, useState } from "react";

interface GsiClient {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (resp: { credential: string }) => void;
        auto_select?: boolean;
      }) => void;
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
    };
  };
}

type GateStatus =
  | { phase: "loading" }
  | { phase: "public" }
  | {
      phase: "google";
      authenticated: boolean;
      clientId: string;
      email?: string;
      configError?: string;
    };

export function GoogleAuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<GateStatus>({ phase: "loading" });
  const buttonHost = useRef<HTMLDivElement>(null);
  const scriptAppended = useRef(false);

  const refreshStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/status", { credentials: "include" });
      const raw = await r.text();

      if (!r.ok) {
        let message = `เซิร์ฟเวอร์ตอบ HTTP ${r.status}`;
        try {
          const parsed = JSON.parse(raw) as { error?: string };
          if (parsed?.error && typeof parsed.error === "string") message = parsed.error;
        } catch {
          /* body is not JSON (e.g. HTML error page) */
        }
        setStatus({
          phase: "google",
          authenticated: false,
          clientId: "",
          configError: message,
        });
        return;
      }

      let j: {
        mode?: string;
        authenticated?: boolean;
        clientId?: string;
        email?: string;
        error?: string;
      };
      try {
        j = JSON.parse(raw) as typeof j;
      } catch {
        setStatus({
          phase: "google",
          authenticated: false,
          clientId: "",
          configError:
            "ได้หน้า HTML แทน JSON — มักเปิดผิดพอร์ต: บนมือถือให้ใช้ http://[IP-เครื่อง-PC]:[พอร์ต] ตามที่เทอร์มินัลแสดงหลัง `npm run dev` (ค่าเริ่มต้นมักเป็น 3334; ตั้ง `PORT` ได้) ไม่ใช่แค่ http://IP เพราะจะไปพอร์ต 80",
        });
        return;
      }
      if (j.mode === "public") {
        setStatus({ phase: "public" });
        return;
      }
      setStatus({
        phase: "google",
        authenticated: !!j.authenticated,
        clientId: j.clientId || "",
        email: j.email,
        configError: j.error,
      });
    } catch (e) {
      const hint =
        e instanceof TypeError
          ? "เชื่อมต่อ `/api/auth/status` ไม่ได้ — ตรวจสอบ URL ให้มีพอร์ตตรงกับ `npm run dev` (ค่าเริ่มต้นมักเป็น 3334) เปิดไฟร์วอลล์ Windows สำหรับพอร์ตนั้น และให้ PC กับมือถืออยู่ Wi‑Fi เดียวกัน"
          : e instanceof Error
            ? e.message
            : "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";
      setStatus({
        phase: "google",
        authenticated: false,
        clientId: "",
        configError: hint,
      });
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (status.phase !== "google" || status.authenticated) return;
    if (!status.clientId) return;
    if (scriptAppended.current) return;
    scriptAppended.current = true;

    const clientId = status.clientId;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const g = (window as unknown as { google?: GsiClient }).google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: { credential: string }) => {
          const r = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ credential: resp.credential }),
          });
          if (r.ok) window.location.reload();
        },
        auto_select: false,
      });
      if (buttonHost.current) {
        g.accounts.id.renderButton(buttonHost.current, {
          theme: "filled_blue",
          size: "large",
          text: "signin_with",
          shape: "pill",
          locale: "th",
        });
      }
    };
    document.head.appendChild(script);
  }, [status.phase, status.authenticated, status.clientId]);

  if (status.phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <p className="text-sm tracking-wide">กำลังตรวจสอบการเข้าถึง…</p>
      </div>
    );
  }

  if (status.phase === "public") {
    return <>{children}</>;
  }

  if (!status.authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="text-center space-y-2 max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">เข้าสู่ระบบ</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            โหมด Google: ลงชื่อเข้าใช้เพื่อดูแดชบอร์ดและ API ที่ล็อกไว้
          </p>
          {status.configError && (
            <p className="text-amber-400 text-xs mt-2 leading-relaxed">{status.configError}</p>
          )}
        </div>
        <div ref={buttonHost} className="min-h-[44px]" />
        <p className="text-xs text-slate-500 text-center max-w-sm">
          โหมดเปิดสาธารณะ: ตั้ง <code className="text-slate-400">AUTH_MODE=public</code> บนเซิร์ฟเวอร์แล้วรีสตาร์ท
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
