"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const IDLE_MS = 15 * 60 * 1000;
const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

export function IdleGuard() {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void signOut({ redirect: false }).then(() => {
          router.replace("/login?reason=idle");
        });
      }, IDLE_MS);
    };

    reset();
    for (const event of EVENTS) {
      window.addEventListener(event, reset, { passive: true });
    }

    return () => {
      clearTimeout(timer);
      for (const event of EVENTS) {
        window.removeEventListener(event, reset);
      }
    };
  }, [router]);

  return null;
}
