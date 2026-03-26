"use client";

import { CheckCircle, XCircle, X } from "lucide-react";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "ui/dialog";
import MarkdownView from "ui/markdown-view";
import { useCopy } from "@/hooks/use-copy";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { GraphEndEvent } from "ts-edge";
import { cn, errorToString } from "lib/utils";
import { useState } from "react";

interface WorkflowCompletionNotificationProps {
  result: GraphEndEvent;
  onClose?: () => void;
  autoOpen?: boolean;
}

export function WorkflowCompletionNotification({
  result,
  onClose,
  autoOpen = true,
}: WorkflowCompletionNotificationProps) {
  const { copy } = useCopy();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(autoOpen);

  const isSuccess = result.isOk;

  const formatOutputForDisplay = (output: any) => {
    if (typeof output === "string") {
      return { type: "markdown", content: output };
    }

    if (typeof output === "object" && output !== null) {
      if (output.SUMMARY?.answer?.content) {
        return { type: "markdown", content: output.SUMMARY.answer.content };
      }

      if (output.tool_result) {
        const content =
          typeof output.tool_result === "string"
            ? output.tool_result
            : JSON.stringify(output.tool_result, null, 2);
        return { type: "text", content };
      }

      // For regular JSON objects, format as markdown code block
      return {
        type: "markdown",
        content: "```json\n" + JSON.stringify(output, null, 2) + "\n```",
      };
    }

    return { type: "text", content: "No output generated" };
  };

  const outputDisplay = formatOutputForDisplay(result.output);

  return (
    <>
      {/* Notification */}
      <div
        className={cn(
          "fixed top-4 right-4 z-50 max-w-sm shadow-lg border rounded-lg p-4",
          isSuccess ? "bg-card border-primary" : "bg-card border-destructive",
          !autoOpen &&
            "opacity-0 translate-x-full pointer-events-none transition-all duration-300",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isSuccess ? (
              <CheckCircle className="h-5 w-5 text-primary" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-medium text-sm mb-1",
                isSuccess ? "text-primary" : "text-destructive",
              )}
            >
              {isSuccess
                ? t("Common.completedSuccessfully")
                : t("Common.completedWithError")}
            </h3>
            {!isSuccess && (
              <p className="text-xs text-destructive/80">
                {errorToString(result.error)}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
            className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
            title="Close notification"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Results Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {isSuccess ? (
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span>{t("Workflow.results")}</span>
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="p-4">
            {outputDisplay.type === "text" && (
              <div className="whitespace-pre-wrap text-sm">
                {outputDisplay.content}
              </div>
            )}
            {outputDisplay.type === "markdown" && (
              <MarkdownView content={outputDisplay.content} />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end p-4 border-t">
            <Button
              onClick={() => {
                copy(JSON.stringify(result.output, null, 2));
                toast.success(t("Workflow.resultsCopied"));
              }}
              variant="outline"
              size="sm"
            >
              {t("Common.copy")}
            </Button>
            <Button
              onClick={() => {
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
                toast.success(t("Workflow.resultsDownloaded"));
              }}
              variant="outline"
              size="sm"
            >
              {t("Common.download")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
