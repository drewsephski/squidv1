"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  X,
  Copy,
  Download,
  FileText,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GraphEndEvent } from "ts-edge";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "ui/dialog";
import { ScrollArea } from "ui/scroll-area";
import MarkdownView from "ui/markdown-view";
import { useCopy } from "@/hooks/use-copy";
import { cn, errorToString } from "lib/utils";

interface WorkflowResultDialogProps {
  result: GraphEndEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExtractedContent {
  type: "markdown" | "text" | "empty";
  content: string;
  title?: string;
}

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

/**
 * Check if a key is technical metadata
 */
function isTechnicalKey(key: string): boolean {
  return (
    TECHNICAL_KEYS.has(key.toLowerCase()) ||
    key.endsWith("Id") ||
    key.endsWith("ID") ||
    key.startsWith("_")
  );
}

/**
 * Filter out technical fields from an object
 */
function filterTechnicalFields(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(filterTechnicalFields);
  }

  const filtered: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip technical keys
    if (isTechnicalKey(key)) {
      continue;
    }

    // Skip empty/null values
    if (value === null || value === undefined) {
      continue;
    }

    // Skip empty arrays
    if (Array.isArray(value) && value.length === 0) {
      continue;
    }

    // Skip empty objects
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    ) {
      continue;
    }

    // Recursively filter nested objects
    if (typeof value === "object" && value !== null) {
      const filteredValue = filterTechnicalFields(value);
      // Only include if the filtered result has content
      if (
        typeof filteredValue === "object" &&
        !Array.isArray(filteredValue) &&
        Object.keys(filteredValue).length === 0
      ) {
        continue;
      }
      filtered[key] = filteredValue;
    } else {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Extract meaningful outputs from workflow node results
 */
function extractNodeOutputs(output: any): ExtractedContent[] {
  const results: ExtractedContent[] = [];

  if (typeof output !== "object" || output === null) {
    return results;
  }

  // Handle array of node outputs
  if (Array.isArray(output)) {
    for (const item of output) {
      const extracted = extractReadableContent(item);
      if (extracted.type !== "empty" && extracted.content.trim()) {
        results.push(extracted);
      }
    }
    return results;
  }

  // Extract from each node output by ID
  for (const [key, value] of Object.entries(output)) {
    // Skip if key looks like metadata or is a technical field
    if (isTechnicalKey(key)) {
      continue;
    }

    // Skip the 'inputs' section entirely - it's too verbose
    if (key.toLowerCase() === "inputs") {
      continue;
    }

    // Handle node output object
    if (typeof value === "object" && value !== null) {
      // Try to extract answer/content from the node output
      const nodeValue = value as any;

      // Look for answer field (LLM output)
      if (nodeValue.answer !== undefined) {
        if (typeof nodeValue.answer === "string") {
          results.push({ type: "markdown", content: nodeValue.answer });
        } else if (typeof nodeValue.answer === "object") {
          const filtered = filterTechnicalFields(nodeValue.answer);
          if (Object.keys(filtered).length > 0) {
            results.push({
              type: "markdown",
              content: objectToMarkdown(filtered),
            });
          }
        }
        continue;
      }

      // Look for response.body (HTTP output)
      if (nodeValue.response?.body) {
        const body = nodeValue.response.body;
        if (typeof body === "string") {
          try {
            const parsed = JSON.parse(body);
            const extracted = extractReadableContent(parsed);
            if (extracted.type !== "empty") {
              results.push(extracted);
            }
          } catch {
            results.push({ type: "text", content: body });
          }
        }
        continue;
      }

      // Look for text/content fields
      if (nodeValue.text && typeof nodeValue.text === "string") {
        results.push({ type: "markdown", content: nodeValue.text });
        continue;
      }

      if (nodeValue.content && typeof nodeValue.content === "string") {
        results.push({ type: "markdown", content: nodeValue.content });
        continue;
      }

      // Filter and add remaining fields
      const filtered = filterTechnicalFields(value);
      if (Object.keys(filtered).length > 0) {
        // Check if filtered result has meaningful content
        const hasContent = Object.values(filtered).some(
          (v) =>
            v !== null &&
            v !== undefined &&
            v !== "" &&
            !(Array.isArray(v) && v.length === 0) &&
            !(typeof v === "object" && Object.keys(v).length === 0),
        );

        if (hasContent) {
          results.push({
            type: "markdown",
            content: objectToMarkdown(filtered),
          });
        }
      }
    } else if (typeof value === "string" && value.trim()) {
      // Simple string value
      results.push({ type: "text", content: value });
    }
  }

  return results;
}

/**
 * Extract human-readable content from workflow output
 * Removes technical metadata and returns clean text
 */
function extractReadableContent(output: any): ExtractedContent {
  // Handle string output directly
  if (typeof output === "string") {
    return { type: "markdown", content: output };
  }

  if (typeof output !== "object" || output === null) {
    return { type: "empty", content: "" };
  }

  // Extract from SUMMARY.answer (structured LLM output)
  if (output.SUMMARY?.answer) {
    const answer = output.SUMMARY.answer;
    if (typeof answer === "string") {
      return { type: "markdown", content: answer };
    }
    if (typeof answer === "object") {
      // If answer has a content field, use that
      if (answer.content && typeof answer.content === "string") {
        return { type: "markdown", content: answer.content };
      }
      // Convert structured object to readable format
      return { type: "markdown", content: objectToMarkdown(answer) };
    }
  }

  // Extract from template output
  if (output.template && typeof output.template === "string") {
    return { type: "markdown", content: output.template };
  }

  // Extract from LLM text response
  if (output.answer && typeof output.answer === "string") {
    return { type: "markdown", content: output.answer };
  }

  // Handle tool results - try to extract meaningful content
  if (output.tool_result) {
    const toolResult = output.tool_result;
    if (typeof toolResult === "string") {
      return { type: "text", content: toolResult };
    }
    if (typeof toolResult === "object") {
      const readable = findReadableContent(toolResult);
      if (readable) {
        return readable;
      }
    }
  }

  // Handle HTTP response - extract body content only
  if (output.response?.body && typeof output.response.body === "string") {
    try {
      const parsed = JSON.parse(output.response.body);
      return extractReadableContent(parsed);
    } catch {
      return { type: "text", content: output.response.body };
    }
  }

  // For workflow execution results - extract node outputs intelligently
  const nodeOutputs = extractNodeOutputs(output);
  if (nodeOutputs.length > 0) {
    // If only one meaningful output, return it directly
    if (nodeOutputs.length === 1) {
      return nodeOutputs[0]!;
    }
    // Multiple outputs - combine them
    const combined = nodeOutputs
      .map((item, i) => `## Output ${i + 1}\n\n${item.content}`)
      .join("\n\n---\n\n");
    return { type: "markdown", content: combined };
  }

  // For other objects, try to convert to markdown (but filter first)
  const keys = Object.keys(output);
  if (keys.length === 1) {
    const value = output[keys[0]!];
    if (typeof value === "string") {
      return { type: "markdown", content: value };
    }
    if (typeof value === "object" && value !== null) {
      return extractReadableContent(value);
    }
  }

  // Multi-key object - filter out technical fields and convert
  const filteredOutput = filterTechnicalFields(output);
  if (Object.keys(filteredOutput).length > 0) {
    return { type: "markdown", content: objectToMarkdown(filteredOutput) };
  }

  return { type: "empty", content: "" };
}

/**
 * Recursively find readable content in an object
 */
function findReadableContent(obj: any): ExtractedContent | null {
  if (typeof obj === "string") {
    return { type: "markdown", content: obj };
  }

  if (typeof obj !== "object" || obj === null) {
    return null;
  }

  // Look for common content keys
  const contentKeys = [
    "content",
    "text",
    "answer",
    "result",
    "output",
    "message",
    "data",
    "body",
    "value",
  ];

  for (const key of contentKeys) {
    if (obj[key] !== undefined) {
      if (typeof obj[key] === "string") {
        return { type: "markdown", content: obj[key] };
      }
      if (typeof obj[key] === "object") {
        return findReadableContent(obj[key]);
      }
    }
  }

  // Check first key if no content keys found
  const firstKey = Object.keys(obj)[0];
  if (firstKey && typeof obj[firstKey] === "string") {
    return { type: "markdown", content: obj[firstKey] };
  }

  return null;
}

/**
 * Convert an object to markdown format
 */
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

export function WorkflowResultDialog({
  result,
  open,
  onOpenChange,
}: WorkflowResultDialogProps) {
  const { copy } = useCopy();
  const t = useTranslations();
  const [showRaw, setShowRaw] = useState(false);

  const isSuccess = result.isOk;

  const extractedContent = useMemo(() => {
    if (!result.output) {
      return { type: "empty" as const, content: "" };
    }
    return extractReadableContent(result.output);
  }, [result.output]);

  const hasContent = extractedContent.content.trim().length > 0;

  const handleCopy = () => {
    copy(extractedContent.content || JSON.stringify(result.output, null, 2));
    toast.success(t("Common.resultsCopied"));
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(result.output, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-results-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t("Common.resultsDownloaded"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-lg">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full",
                  isSuccess ? "bg-primary/10" : "bg-destructive/10",
                )}
              >
                {isSuccess ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">
                  {isSuccess
                    ? t("Common.executionSummary")
                    : t("Common.completedWithError")}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {isSuccess
                    ? t("Workflow.resultsModalDescription")
                    : t("Workflow.resultsModalErrorDescription")}
                </span>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[calc(85vh-180px)]">
          <div className="px-6 py-6">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {hasContent ? (
                    <>
                      {/* Content Header */}
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {t("Common.generatedContent")}
                        </span>
                      </div>

                      {/* Main Content */}
                      <div className="bg-card border rounded-xl overflow-hidden">
                        <div className="p-6">
                          {extractedContent.type === "markdown" ? (
                            <MarkdownView content={extractedContent.content} />
                          ) : (
                            <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                              {extractedContent.content}
                            </pre>
                          )}
                        </div>
                      </div>

                      {/* Raw Output Toggle (for advanced users) */}
                      <div className="pt-4">
                        <button
                          onClick={() => setShowRaw(!showRaw)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          <span>
                            {showRaw ? "Hide" : "Show"} technical details
                          </span>
                        </button>

                        <AnimatePresence>
                          {showRaw && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 p-4 bg-muted/50 rounded-lg border">
                                <pre className="text-xs text-muted-foreground overflow-x-auto">
                                  {JSON.stringify(result.output, null, 2)}
                                </pre>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {t("Workflow.noReadableContent")}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        The workflow completed but no readable content was
                        generated.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <XCircle className="w-6 h-6 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-destructive mb-2">
                          {t("Common.errorDetails")}
                        </h3>
                        <p className="text-sm text-destructive/80 whitespace-pre-wrap">
                          {errorToString(result.error)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSuccess && hasContent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {t("Common.copy")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {t("Common.download")}
              </Button>
            </div>
            <Button onClick={() => onOpenChange(false)} size="sm">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact notification toast for workflow completion
 * Shows briefly then allows opening full dialog
 */
interface WorkflowCompletionToastProps {
  result: GraphEndEvent;
  onViewResults?: () => void;
  onClose?: () => void;
}

export function WorkflowCompletionToast({
  result,
  onViewResults,
  onClose,
}: WorkflowCompletionToastProps) {
  const t = useTranslations();
  const isSuccess = result.isOk;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={cn(
        "fixed top-4 right-4 z-50 w-80 shadow-lg border rounded-xl overflow-hidden",
        isSuccess
          ? "bg-card border-primary/20"
          : "bg-card border-destructive/20",
      )}
    >
      {/* Status Bar */}
      <div
        className={cn(
          "h-1 w-full",
          isSuccess ? "bg-primary" : "bg-destructive",
        )}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
              isSuccess ? "bg-primary/10" : "bg-destructive/10",
            )}
          >
            {isSuccess ? (
              <CheckCircle className="w-5 h-5 text-primary" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">
              {isSuccess
                ? t("Common.completedSuccessfully")
                : t("Common.completedWithError")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isSuccess
                ? t("Common.contentReadyDescription")
                : errorToString(result.error)}
            </p>

            <div className="flex items-center gap-2 mt-3">
              {isSuccess && onViewResults && (
                <Button size="sm" onClick={onViewResults} className="h-8">
                  {t("Common.viewResults")}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Complete workflow result component with notification + dialog
 */
interface WorkflowResultProps {
  result: GraphEndEvent;
  autoOpen?: boolean;
  onClose?: () => void;
}

export function WorkflowResult({
  result,
  autoOpen = true,
  onClose,
}: WorkflowResultProps) {
  const [dialogOpen, setDialogOpen] = useState(autoOpen);
  const [showToast, setShowToast] = useState(true);

  const handleCloseToast = () => {
    setShowToast(false);
    onClose?.();
  };

  const handleViewResults = () => {
    setDialogOpen(true);
    setShowToast(false);
  };

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      onClose?.();
    }
  };

  return (
    <>
      <AnimatePresence>
        {showToast && (
          <WorkflowCompletionToast
            result={result}
            onViewResults={handleViewResults}
            onClose={handleCloseToast}
          />
        )}
      </AnimatePresence>

      <WorkflowResultDialog
        result={result}
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
      />
    </>
  );
}
