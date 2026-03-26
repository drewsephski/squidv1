"use client";

import { memo, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  NodeRuntimeHistory,
  NodeKind,
} from "lib/ai/workflow/workflow.interface";
import { cn } from "lib/utils";
import { NodeIcon } from "./node-icon";
import { TextShimmer } from "ui/text-shimmer";
import { Markdown } from "../markdown";
import { Button } from "ui/button";
import { Separator } from "ui/separator";
import JsonView from "ui/json-view";
import { useCopy } from "@/hooks/use-copy";
import {
  Check,
  Copy,
  Clock,
  AlertTriangle,
  ChevronDown,
  Bot,
  Wrench,
  Globe,
  FileText,
  GitBranch,
  StickyNote,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { Alert, AlertDescription } from "ui/alert";

interface WorkflowChatOutputProps {
  histories: NodeRuntimeHistory[];
  isRunning: boolean;
  className?: string;
}

// Animation variants for message appearance
const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

// Get node kind icon mapping
const getNodeKindIcon = (kind: NodeKind) => {
  switch (kind) {
    case NodeKind.LLM:
      return Bot;
    case NodeKind.Tool:
      return Wrench;
    case NodeKind.Http:
      return Globe;
    case NodeKind.Template:
      return FileText;
    case NodeKind.Condition:
      return GitBranch;
    case NodeKind.Note:
      return StickyNote;
    default:
      return null;
  }
};

// Get node kind display name
const getNodeKindLabel = (kind: NodeKind) => {
  switch (kind) {
    case NodeKind.LLM:
      return "AI Response";
    case NodeKind.Tool:
      return "Tool Execution";
    case NodeKind.Http:
      return "HTTP Request";
    case NodeKind.Template:
      return "Template";
    case NodeKind.Condition:
      return "Condition";
    case NodeKind.Input:
      return "Input";
    case NodeKind.Output:
      return "Output";
    case NodeKind.Note:
      return "Note";
    default:
      return kind;
  }
};

// Format duration nicely
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Individual node execution message component
const NodeExecutionMessage = memo(function NodeExecutionMessage({
  history,
  isLatest,
}: {
  history: NodeRuntimeHistory;
  isLatest: boolean;
}) {
  const { copied, copy } = useCopy();
  const [expanded, setExpanded] = useState(false);

  const isRunning = history.status === "running";
  const isSuccess = history.status === "success";
  const isError = history.status === "fail";

  // Auto-expand for LLM nodes with output
  useEffect(() => {
    if (history.kind === NodeKind.LLM && history.result?.output && !isRunning) {
      setExpanded(true);
    }
  }, [history.kind, history.result, isRunning]);

  const output = history.result?.output;
  const outputText = useMemo(() => {
    if (!output) return null;
    if (typeof output === "string") return output;
    if (output.text && typeof output.text === "string") return output.text;
    if (output.content && typeof output.content === "string")
      return output.content;
    if (output.response && typeof output.response === "string")
      return output.response;
    if (output.message && typeof output.message === "string")
      return output.message;
    return null;
  }, [output]);

  const hasRenderableText =
    history.kind === NodeKind.LLM && outputText && !isRunning;

  const IconComponent = getNodeKindIcon(history.kind);

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "group relative flex gap-3 w-full",
        isLatest && "latest-message",
      )}
    >
      {/* Node icon / avatar */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm transition-all duration-300",
            isRunning && "animate-pulse ring-2 ring-primary/30",
            isSuccess && "bg-primary/10 border-primary/20 text-primary",
            isError &&
              "bg-destructive/10 border-destructive/20 text-destructive",
            !isRunning &&
              !isSuccess &&
              !isError &&
              "bg-muted border-border text-muted-foreground",
          )}
        >
          {isRunning ? (
            <Loader className="size-4 animate-spin" />
          ) : IconComponent ? (
            <IconComponent className="size-4" />
          ) : (
            <NodeIcon type={history.kind} iconClassName="size-4" />
          )}
        </div>
        {/* Connector line to next node */}
        {!isLatest && (
          <div className="w-px flex-1 bg-gradient-to-b from-border to-transparent mt-2 min-h-[20px]" />
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0 pb-4">
        {/* Header with name and metadata */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-semibold text-sm text-foreground">
            {history.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {getNodeKindLabel(history.kind)}
          </span>
          <div className="flex-1" />
          {!isRunning && history.endedAt && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatDuration(history.endedAt - history.startedAt)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Execution time</p>
              </TooltipContent>
            </Tooltip>
          )}
          {isRunning && (
            <TextShimmer className="text-xs">Processing...</TextShimmer>
          )}
          {isSuccess && <Check className="size-3.5 text-primary" />}
          {isError && <AlertTriangle className="size-3.5 text-destructive" />}
        </div>

        {/* Status indicator for running nodes */}
        {isRunning && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">
              <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="size-2 rounded-full bg-primary animate-bounce" />
            </div>
            <span className="text-xs text-muted-foreground">
              Executing node...
            </span>
          </div>
        )}

        {/* Error display */}
        {isError && history.error && (
          <Alert variant="destructive" className="mb-2 py-2">
            <AlertDescription className="text-xs">
              {history.error}
            </AlertDescription>
          </Alert>
        )}

        {/* LLM Output - Rendered as chat-like message */}
        {hasRenderableText && (
          <div className="relative">
            <div
              className={cn(
                "prose prose-sm dark:prose-invert max-w-none",
                "bg-card border rounded-lg p-4",
                "text-foreground",
              )}
            >
              <Markdown>{outputText}</Markdown>
            </div>

            {/* Copy button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 bg-background/80 backdrop-blur"
                    onClick={() => copy(outputText)}
                  >
                    {copied ? (
                      <Check className="size-3.5 text-primary" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copied ? "Copied!" : "Copy output"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Tool/HTTP/Other node output - Collapsible JSON */}
        {output && !hasRenderableText && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => setExpanded(!expanded)}
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  expanded && "rotate-180",
                )}
              />
              {expanded ? "Hide output" : "View output"}
            </Button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Output
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => copy(JSON.stringify(output, null, 2))}
                      >
                        {copied ? (
                          <Check className="size-3" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <JsonView data={output} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
});

// Main workflow chat output component
export const WorkflowChatOutput = memo(function WorkflowChatOutput({
  histories,
  isRunning,
  className,
}: WorkflowChatOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevHistoriesLength = useRef(histories.length);

  // Auto-scroll to latest message
  useEffect(() => {
    if (histories.length > prevHistoriesLength.current || isRunning) {
      const latestMessage =
        containerRef.current?.querySelector(".latest-message");
      if (latestMessage) {
        latestMessage.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
    prevHistoriesLength.current = histories.length;
  }, [histories, isRunning]);

  // Group consecutive messages for animation staggering
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (histories.length === 0 && !isRunning) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12",
          className,
        )}
      >
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Bot className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Ready to run workflow</p>
          <p className="text-xs text-muted-foreground/60">
            Configure input and click Run to see results
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col gap-1 py-4 px-2 overflow-y-auto", className)}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col"
        >
          {histories.map((history, index) => (
            <NodeExecutionMessage
              key={history.id}
              history={history}
              isLatest={index === histories.length - 1}
            />
          ))}

          {/* Workflow completion indicator */}
          {!isRunning && histories.length > 0 && (
            <motion.div
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-2 py-3 px-2 text-xs text-muted-foreground"
            >
              <Separator className="flex-1" />
              <span className="flex items-center gap-1">
                <Check className="size-3 text-primary" />
                Workflow completed
              </span>
              <Separator className="flex-1" />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

// Import missing dependencies
import { useState } from "react";
import { Loader } from "lucide-react";
