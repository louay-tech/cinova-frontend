import { useRef, useCallback, useEffect, useState } from "react";
import type { MatchedMusic } from "./api";

type AudioState = {
  isPlaying: boolean;
  currentTitle: string | null;
};

export function useAudioEngine() {
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const activeIsARef = useRef(true);
  const [state, setState] = useState<AudioState>({ isPlaying: false, currentTitle: null });

  useEffect(() => {
    audioARef.current = new Audio();
    audioBRef.current = new Audio();
    audioARef.current.preload = "auto";
    audioBRef.current.preload = "auto";
    return () => {
      audioARef.current?.pause();
      audioBRef.current?.pause();
    };
  }, []);

  const fadeVolume = useCallback(
    (audio: HTMLAudioElement, from: number, to: number, durationMs: number): Promise<void> => {
      return new Promise((resolve) => {
        const steps = 20;
        const stepTime = durationMs / steps;
        let currentStep = 0;
        const interval = setInterval(() => {
          currentStep++;
          const progress = currentStep / steps;
          audio.volume = Math.max(0, Math.min(1, from + (to - from) * progress));
          if (currentStep >= steps) {
            clearInterval(interval);
            resolve();
          }
        }, stepTime);
      });
    },
    [],
  );

  const playMatched = useCallback(
    async (matched: MatchedMusic) => {
      const outgoing = activeIsARef.current ? audioARef.current : audioBRef.current;
      const incoming = activeIsARef.current ? audioBRef.current : audioARef.current;
      if (!outgoing || !incoming) return;

      const fullUrl = matched.matched_song.storage_path;
      if (!fullUrl) return;

      const transition = matched.transition_out || "crossfade";
      const durationSec = matched.transition_duration || 2;
      const durationMs = durationSec * 1000;

      incoming.src = fullUrl;
      incoming.currentTime = matched.matched_song.start_sec;
      incoming.volume = 0;

      setState({ isPlaying: true, currentTitle: matched.matched_song.title });

      if (transition === "hard_cut") {
        outgoing.pause();
        incoming.volume = 1;
        await incoming.play().catch(() => {});
      } else if (transition === "fade_to_silence") {
        await fadeVolume(outgoing, outgoing.volume || 1, 0, durationMs / 2);
        outgoing.pause();
        incoming.volume = 0;
        await incoming.play().catch(() => {});
        await fadeVolume(incoming, 0, 1, durationMs / 2);
      } else if (transition === "swell") {
        await fadeVolume(outgoing, outgoing.volume || 1, 1, durationMs * 0.6);
        outgoing.pause();
        incoming.volume = 1;
        await incoming.play().catch(() => {});
      } else {
        // crossfade (default)
        incoming.volume = 0;
        await incoming.play().catch(() => {});
        await Promise.all([
          fadeVolume(outgoing, outgoing.volume || 1, 0, durationMs),
          fadeVolume(incoming, 0, 1, durationMs),
        ]);
        outgoing.pause();
      }

      activeIsARef.current = !activeIsARef.current;
    },
    [fadeVolume],
  );

  const stopAll = useCallback(() => {
    audioARef.current?.pause();
    audioBRef.current?.pause();
    setState({ isPlaying: false, currentTitle: null });
  }, []);

  const pauseAll = useCallback(() => {
    audioARef.current?.pause();
    audioBRef.current?.pause();
  }, []);

  const resumeActive = useCallback(() => {
    const active = activeIsARef.current ? audioARef.current : audioBRef.current;
    active?.play().catch(() => {});
  }, []);

  return { playMatched, stopAll, pauseAll, resumeActive, audioState: state };
}
