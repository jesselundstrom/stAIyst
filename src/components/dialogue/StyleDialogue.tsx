"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { DialogueTurn } from "@/types";

interface StyleDialogueProps {
  turns: DialogueTurn[];
  onComplete: () => void;
}

const COMPLETE_DELAY_MS = 4100;
const SECOND_TURN_DELAY_MS = 2400;
const SINGLE_TURN_COMPLETE_DELAY_MS = 2600;
const FIRST_TURN_DELAY_MS = 700;

const CLAUDE_NAMES = ["Mara", "Elise", "Noor", "Sable", "Vera"];
const GPT_NAMES = ["Arlo", "Felix", "Theo", "Caden", "Oscar"];

function pickName(pool: string[], seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}

export function StyleDialogue({ turns, onComplete }: StyleDialogueProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const onCompleteRef = useRef(onComplete);

  const seed = turns[0]?.text ?? "default";
  const claudeName = pickName(CLAUDE_NAMES, seed);
  const gptName = pickName(GPT_NAMES, seed);

  const leadName = turns[0]?.participant === "gpt" ? gptName : claudeName;
  const turnKey = turns
    .map((turn, index) => `${index}:${turn.participant}:${turn.text}`)
    .join("|");

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        setRevealedCount(1);
      }, FIRST_TURN_DELAY_MS)
    );

    if (turns.length > 1) {
      timers.push(
        setTimeout(() => {
          setRevealedCount(2);
        }, SECOND_TURN_DELAY_MS)
      );

      timers.push(
        setTimeout(() => {
          onCompleteRef.current();
        }, COMPLETE_DELAY_MS)
      );
    } else {
      timers.push(
        setTimeout(() => {
          onCompleteRef.current();
        }, SINGLE_TURN_COMPLETE_DELAY_MS)
      );
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [turnKey, turns.length]);

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            "overflow-hidden transition-all duration-700 ease-out",
            revealedCount === 0 ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-neutral-900" />
            <p className="text-sm font-medium text-neutral-700">
              {leadName} is reviewing your look...
            </p>
          </div>
        </div>

        {turns.map((turn, index) => {
          const isClaude = turn.participant === "claude";
          const isVisible = revealedCount > index;
          const name = isClaude ? claudeName : gptName;
          const initial = name[0];

          return (
            <div
              key={`${turn.participant}-${index}`}
              className={cn(
                "flex transition-all duration-700 ease-out",
                isClaude ? "justify-start" : "justify-end",
                isVisible
                  ? "translate-y-0 scale-100 opacity-100 blur-0"
                  : "translate-y-3 scale-[0.985] opacity-0 blur-[2px]"
              )}
            >
              <div
                className={cn(
                  "flex max-w-[85%] items-start gap-3",
                  isClaude ? "flex-row" : "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    isClaude
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-200 text-neutral-700"
                  )}
                  title={name}
                >
                  {initial}
                </div>

                <div className="flex flex-col gap-1">
                  <div className={cn("w-full", !isClaude && "text-right")}>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                      {name}
                    </span>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-700">
                    {turn.text}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
