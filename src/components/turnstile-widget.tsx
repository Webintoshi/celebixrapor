"use client";

import Script from "next/script";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { DEV_TURNSTILE_BYPASS_TOKEN } from "@/lib/pdf-contract";

interface TurnstileWidgetProps {
  resetNonce: number;
  onTokenChange: (token: string) => void;
}

export function TurnstileWidget({
  resetNonce,
  onTokenChange,
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const emitToken = useEffectEvent((token: string | null) => {
    onTokenChange(token ?? "");
  });

  useEffect(() => {
    if (!siteKey) {
      emitToken(DEV_TURNSTILE_BYPASS_TOKEN);
    }
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey || !scriptReady || !containerRef.current || widgetIdRef.current) {
      return;
    }

    const turnstile = window.turnstile;

    if (!turnstile) {
      return;
    }

    widgetIdRef.current = turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "light",
      callback: (token: string) => emitToken(token),
      "expired-callback": () => emitToken(null),
      "error-callback": () => emitToken(null),
      retry: "never",
    });

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = null;
    };
  }, [scriptReady, siteKey]);

  useEffect(() => {
    if (!siteKey) {
      emitToken(DEV_TURNSTILE_BYPASS_TOKEN);
      return;
    }

    if (resetNonce === 0) {
      return;
    }

    emitToken(null);

    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetNonce, siteKey]);

  if (!siteKey) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white/70 px-4 py-3 text-sm text-[var(--ink-soft)]">
        Gelistirme modu aktif. Turnstile anahtari eklenene kadar yerel bypass kullaniliyor.
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div className="rounded-2xl border border-white/70 bg-white/78 p-3 shadow-[0_14px_36px_rgba(17,24,39,0.08)]">
        <div ref={containerRef} />
      </div>
    </>
  );
}
