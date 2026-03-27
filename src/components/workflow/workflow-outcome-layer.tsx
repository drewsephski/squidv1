"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { GraphEndEvent } from "ts-edge";
import {
  CheckCircle2,
  XCircle,
  Copy,
  ChevronRight,
  ArrowRight,
  Terminal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as Portal from "@radix-ui/react-portal";

import { Button } from "ui/button";
import { ScrollArea } from "ui/scroll-area";
import MarkdownView from "ui/markdown-view";
import { useCopy } from "@/hooks/use-copy";
import { cn, errorToString } from "lib/utils";

/**
 * Technical metadata keys to filter out from output
 */
const TECHNICAL_KEYS = new Set([
  "id",
  "version",
  "workflowId",
  "kind",
  "uiConfig",
  "nodeConfig",
  "createdAt",
  "updatedAt",
  "source",
  "target",
  "edges",
  "nodes",
  "messages",
  "model",
  "provider",
  "headers",
  "status",
  "statusText",
  "ok",
  "duration",
  "size",
  "method",
  "url",
  "timeout",
  "query",
  "path",
  "mentionSuggestionChar",
  "attrs",
  "label",
  "position",
  "type",
  "description",
  "totalTokens",
]);

function isTechnicalKey(key: string): boolean {
  return (
    TECHNICAL_KEYS.has(key.toLowerCase()) ||
    key.endsWith("Id") ||
    key.endsWith("ID") ||
    key.startsWith("_")
  );
}

function filterTechnicalFields(obj: any): any {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(filterTechnicalFields);

  const filtered: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isTechnicalKey(key)) continue;
    if (value === null || value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    )
      continue;

    if (typeof value === "object" && value !== null) {
      const filteredValue = filterTechnicalFields(value);
      if (
        typeof filteredValue === "object" &&
        !Array.isArray(filteredValue) &&
        Object.keys(filteredValue).length === 0
      )
        continue;
      filtered[key] = filteredValue;
    } else {
      filtered[key] = value;
    }
  }
  return filtered;
}

function objectToMarkdown(obj: any, level = 0): string {
  if (typeof obj === "string") return obj;
  if (typeof obj !== "object" || obj === null) return String(obj);
  if (Array.isArray(obj)) {
    return obj
      .map((item) => `- ${objectToMarkdown(item, level + 1)}`)
      .join("\n");
  }

  const entries = Object.entries(obj);
  if (entries.length === 0) return "";

  return entries
    .map(([key, value]) => {
      const cleanKey = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return `**${cleanKey}:**\n${objectToMarkdown(value, level + 1)}`;
      }
      if (Array.isArray(value)) {
        return `**${cleanKey}:**\n${value.map((v) => `- ${objectToMarkdown(v, level + 1)}`).join("\n")}`;
      }
      return `**${cleanKey}:** ${value}`;
    })
    .join("\n\n");
}

/**
 * Extract human-readable content from workflow output, prioritizing final results
 */
function extractFinalOutcome(output: any): {
  type: "markdown" | "text" | "empty";
  content: string;
} {
  if (!output) return { type: "empty", content: "" };
  if (typeof output === "string") return { type: "markdown", content: output };

  // Prioritize common "final result" keys
  const priorityKeys = ["answer", "content", "result", "output", "template"];
  for (const key of priorityKeys) {
    if (output[key] && typeof output[key] === "string") {
      return { type: "markdown", content: output[key] };
    }
  }

  // Handle HTTP response body
  if (output.response?.body && typeof output.response.body === "string") {
    try {
      const parsed = JSON.parse(output.response.body);
      return extractFinalOutcome(parsed);
    } catch {
      return { type: "text", content: output.response.body };
    }
  }

  // If it's a complex object, filter and convert
  const filtered = filterTechnicalFields(output);
  if (Object.keys(filtered).length > 0) {
    return { type: "markdown", content: objectToMarkdown(filtered) };
  }

  return { type: "empty", content: "" };
}

interface WorkflowOutcomeLayerProps {
  result: GraphEndEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkflowOutcomeLayer({
  result,
  open,
  onOpenChange,
}: WorkflowOutcomeLayerProps) {
  const t = useTranslations();
  const { copy } = useCopy();
  const [showTrace, setShowTrace] = useState(false);

  const isSuccess = result.isOk;
  const outcome = useMemo(
    () => extractFinalOutcome(result.output),
    [result.output],
  );
  const hasContent = outcome.content.trim().length > 0;

  const handleCopy = () => {
    copy(outcome.content || JSON.stringify(result.output, null, 2));
    toast.success(t("Common.resultsCopied"));
  };

  // Styles matching the landing page
  const styles = `
    .outcome-layer {
      --primary: oklch(0.21 0.006 285.885);
      --primary-foreground: oklch(0.985 0 0);
    }
    .dark .outcome-layer {
      --primary: oklch(0.92 0.004 286.32);
      --primary-foreground: oklch(0.21 0.006 285.885);
    }

    .lp-serif {
      font-family: 'Instrument Serif', serif;
    }
    
    .lp-btn-primary {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 11px 22px; border-radius: 10px;
      font-size: 14px; font-weight: 500;
      background: var(--primary); color: var(--primary-foreground);
      text-decoration: none;
      border: 1px solid color-mix(in oklch, var(--primary) 76%, black 24%);
      box-shadow: 0 1px 4px oklch(0 0 0 / 0.12);
      transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
      position: relative; overflow: hidden;
    }
    .lp-btn-primary:hover {
      opacity: 0.88; transform: translateY(-1px);
      box-shadow: 0 6px 20px oklch(0 0 0 / 0.18);
    }
    .lp-btn-primary:active { transform: translateY(0); opacity: 1; }
    
    .lp-btn-arrow { transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94); overflow: visible; }
    .chevron-path { transition: opacity 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94); opacity: 1; }
    .arrow-path   { transition: opacity 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94); opacity: 0; }
    .lp-btn-primary:hover .lp-btn-arrow { transform: translateX(2px); }
    .lp-btn-primary:hover .chevron-path { opacity: 0; }
    .lp-btn-primary:hover .arrow-path   { opacity: 1; }

    .lp-bc-accent {
      background-image: linear-gradient(
        175deg,
        var(--card) 100%,
        transparent 0%,
        color-mix(in oklch, var(--card) 98%, var(--primary) 2%) 50%,
        color-mix(in oklch, var(--card) 94%, var(--primary) 6%) 100%
      );
      position: relative;
    }
    .lp-bc-accent::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(
        ellipse 70% 40% at 50% 0%,
        color-mix(in oklch, var(--primary) 12%, transparent) 0%,
        transparent 65%
      );
      pointer-events: none;
    }
    .lp-dot-grid {
      background-image: radial-gradient(
        circle, color-mix(in oklch, var(--foreground) 6%, transparent) 1px, transparent 1px
      );
      background-size: 24px 24px;
    }
  `;

  return (
    <Portal.Root>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <AnimatePresence>
        {open && (
          <div className="outcome-layer fixed inset-0 z-[100] flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpenChange(false)}
              className="absolute inset-0 bg-background/40 backdrop-blur-xl"
            />

            {/* Slide-up Content Pane */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-h-[85vh] bg-card border-t shadow-2xl overflow-hidden flex flex-col lp-bc-accent"
            >
              {/* Header */}
              <div className="px-8 py-6 flex items-center justify-between border-b border-border/50 relative z-10">
                <div>
                  <h2 className="lp-serif text-3xl italic font-normal text-foreground">
                    {isSuccess ? "Final Outcome" : "Workflow Failed"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    {isSuccess
                      ? "Generated successfully"
                      : "Execution encountered an error"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="rounded-full hover:bg-muted/50"
                >
                  <X className="size-5" />
                </Button>
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="flex-1 lp-dot-grid">
                <div className="max-w-4xl mx-auto px-8 py-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                  >
                    {isSuccess ? (
                      hasContent ? (
                        <div className="prose prose-lg dark:prose-invert max-w-none serif-content">
                          {outcome.type === "markdown" ? (
                            <MarkdownView content={outcome.content} />
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans text-foreground">
                              {outcome.content}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-20">
                          <p className="text-muted-foreground italic">
                            No readable outcome was generated.
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-8">
                        <div className="flex items-start gap-4">
                          <XCircle className="size-8 text-destructive shrink-0" />
                          <div>
                            <h3 className="text-lg font-semibold text-destructive mb-2">
                              Error Details
                            </h3>
                            <p className="text-destructive/80 font-mono text-sm">
                              {errorToString(result.error)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progressive Disclosure: Trace */}
                    <div className="pt-12 border-t border-border/50">
                      <button
                        onClick={() => setShowTrace(!showTrace)}
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <Terminal className="size-3" />
                        <span>View Technical Trace</span>
                        <ChevronRight
                          className={cn(
                            "size-3 transition-transform",
                            showTrace && "rotate-90",
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {showTrace && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-4"
                          >
                            <div className="bg-muted/30 rounded-xl p-6 border border-border/50 font-mono text-xs text-muted-foreground overflow-x-auto">
                              <pre>{JSON.stringify(result, null, 2)}</pre>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>
              </ScrollArea>

              {/* Footer Actions */}
              <div className="px-8 py-6 bg-background/50 backdrop-blur-sm border-t border-border/50 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  {isSuccess && hasContent && (
                    <button onClick={handleCopy} className="lp-btn-primary">
                      <span>Copy outcome</span>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lp-btn-arrow"
                      >
                        <path className="chevron-path" d="M9 18l6-6-6-6" />
                        <path
                          className="arrow-path"
                          d="M5 12h14M12 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl px-6"
                >
                  Back to Workflow
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal.Root>
  );
}
