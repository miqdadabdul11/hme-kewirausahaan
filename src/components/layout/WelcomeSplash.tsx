"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./WelcomeSplash.module.css";

const SPLASH_TIMING = {
  totalMs: 3000,
  fadeOutMs: 450,
};
const SESSION_KEY = "estore-welcome-splash-seen";
const splashListeners = new Set<() => void>();

const subscribeToSplash = (listener: () => void) => {
  splashListeners.add(listener);
  return () => splashListeners.delete(listener);
};

const getSplashSnapshot = () =>
  document.documentElement.getAttribute("data-welcome-splash-skip") !== "true";
const getSplashServerSnapshot = () => true;

const suppressSplash = () => {
  document.documentElement.setAttribute("data-welcome-splash-skip", "true");
  for (const listener of splashListeners) listener();
};

export const WelcomeSplash = () => {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const eligible = useSyncExternalStore(
    subscribeToSplash,
    getSplashSnapshot,
    getSplashServerSnapshot,
  );
  const [removed, setRemoved] = useState(false);
  const visible = eligible && !removed;
  const [exiting, setExiting] = useState(false);
  const started = useRef(false);
  const dismissTimer = useRef<number | null>(null);
  const removeTimer = useRef<number | null>(null);
  const dismissRef = useRef<() => void>(() => {});

  const dismiss = useCallback(() => {
    if (exiting || !visible) return;
    setExiting(true);
    removeTimer.current = window.setTimeout(() => {
      suppressSplash();
      setRemoved(true);
    }, SPLASH_TIMING.fadeOutMs);
  }, [exiting, visible]);

  useEffect(() => {
    dismissRef.current = dismiss;
  }, [dismiss]);

  useEffect(() => {
    if (isAdminRoute) {
      if (started.current) dismissRef.current();
      return;
    }
    if (started.current) {
      dismissRef.current();
      return;
    }
    started.current = true;

    const shouldSkipFromBootstrap =
      document.documentElement.getAttribute("data-welcome-splash-skip") === "true";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      if (shouldSkipFromBootstrap || reducedMotion || sessionStorage.getItem(SESSION_KEY) === "true") {
        suppressSplash();
        return;
      }
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      if (shouldSkipFromBootstrap || reducedMotion) {
        suppressSplash();
        return;
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissRef.current();
    };
    window.addEventListener("keydown", closeOnEscape);
    dismissTimer.current = window.setTimeout(
      () => dismissRef.current(),
      SPLASH_TIMING.totalMs - SPLASH_TIMING.fadeOutMs,
    );
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      if (dismissTimer.current !== null) window.clearTimeout(dismissTimer.current);
      if (removeTimer.current !== null) window.clearTimeout(removeTimer.current);
    };
  }, [isAdminRoute]);

  useEffect(() => {
    if (!visible || isAdminRoute) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible, isAdminRoute]);

  if (!visible || isAdminRoute) return null;

  return (
    <div
      className={`${styles.overlay} ${exiting ? styles.exiting : ""}`}
      style={{
        transitionDuration: `${SPLASH_TIMING.fadeOutMs}ms`,
        animationDuration: `${SPLASH_TIMING.fadeOutMs}ms`,
      }}
      role="presentation"
      onClick={() => dismissRef.current()}
    >
      <button
        type="button"
        className={styles.skipButton}
        aria-label="Skip welcome screen"
        onClick={(event) => {
          event.stopPropagation();
          dismissRef.current();
        }}
      >
        Skip
      </button>
      <div className={styles.content}>
        <Image
          className={styles.logo}
          src="/logo-hme-mark-clean.png"
          alt="Logo HME FPTI UPI"
          width={512}
          height={512}
          preload
        />
        <p className={styles.title} role="status" aria-live="polite">
          Welcome to <span>E-STORE</span>
        </p>
        <p className={styles.subtitle}>HME FPTI UPI Official Merchandise</p>
        <div className={styles.progressTrack} aria-hidden="true">
          <div
            className={styles.progress}
            style={{ animationDuration: `${SPLASH_TIMING.totalMs}ms` }}
          />
        </div>
      </div>
    </div>
  );
};
