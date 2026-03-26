import { useCopy } from "@/hooks/use-copy";
import {
  VercelAIWorkflowToolStreamingResult,
  NodeKind,
} from "app-types/workflow";
import equal from "lib/equal";
import {
  AlertTriangleIcon,
  Check,
  Copy,
  Loader2,
  XIcon,
  Eye,
  ChevronRight,
} from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { Button } from "ui/button";
import JsonView from "ui/json-view";
import { NodeResultPopup } from "../workflow/node-result-popup";
import { cn } from "lib/utils";
import { NodeIcon } from "../workflow/node-icon";
import { TextShimmer } from "ui/text-shimmer";
import { Badge } from "ui/badge";

interface WorkflowInvocationProps {
  result: VercelAIWorkflowToolStreamingResult;
}

function PureWorkflowInvocation({ result }: WorkflowInvocationProps) {
  const { copied, copy } = useCopy();
  const savedResult = useRef<VercelAIWorkflowToolStreamingResult>(result);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const getToolDisplayInfo = (item: any) => {
    if (item.kind === NodeKind.Tool && item.result?.input) {
      const input = item.result.input;
      return {
        toolName: input.name || input.tool_name || "Unknown Tool",
        serverName: input.serverName || input.server_name || "Unknown Server",
        parameters: input.parameters || input.args || input,
      };
    }
    return null;
  };

  const output = useMemo(() => {
    if (result.status == "running") return null;
    if (result.status == "fail")
      return (
        <Alert variant={"destructive"} className="border-destructive">
          <AlertTriangleIcon className="size-3" />
          <AlertTitle>{result?.error?.name || "ERROR"}</AlertTitle>
          <AlertDescription>{result.error?.message}</AlertDescription>
        </Alert>
      );
    if (!result.result) return null;

    return (
      <div className="w-full bg-card p-4 border text-xs rounded-lg text-muted-foreground">
        <div className="flex items-center">
          <h5 className="text-muted-foreground font-medium select-none">
            Response
          </h5>
          <div className="flex-1" />
          {copied ? (
            <Check className="size-3" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-3 text-muted-foreground"
              onClick={() => copy(JSON.stringify(result.result))}
            >
              <Copy className="size-3" />
            </Button>
          )}
        </div>
        <div className="p-2 max-h-[300px] overflow-y-auto">
          <JsonView data={result.result} />
        </div>
      </div>
    );
  }, [result.status, result.error, result.result, copied]);
  useEffect(() => {
    if (result.status == "running") {
      savedResult.current = result;
    }
  }, [result]);

  return (
    <div className="w-full flex flex-col gap-1">
      {result.history.map((item, i) => {
        const result = item.result || savedResult.current.history[i]?.result;
        const toolInfo = getToolDisplayInfo(item);
        const isExpanded = expandedNodes.has(item.id);

        return (
          <div key={item.id} className="w-full">
            <NodeResultPopup
              disabled={!result}
              history={{
                name: item.name,
                status: item.status,
                startedAt: item.startedAt,
                endedAt: item.endedAt,
                error: item.error?.message,
                result,
              }}
            >
              <div
                className={cn(
                  "flex items-center gap-2 text-sm rounded-sm px-2 py-1.5 relative group",
                  item.status == "fail" && "text-destructive",
                  !!result && "cursor-pointer hover:bg-secondary/50",
                )}
                onClick={() => result && toggleNodeExpansion(item.id)}
              >
                <div className="border rounded overflow-hidden">
                  <NodeIcon
                    type={item.kind}
                    iconClassName="size-3"
                    className="rounded-none"
                  />
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {item.status == "running" ? (
                    <TextShimmer className="font-semibold">
                      {`${item.name} Running...`}
                    </TextShimmer>
                  ) : (
                    <span className="font-semibold truncate">{item.name}</span>
                  )}

                  {toolInfo && (
                    <>
                      <ChevronRight className="size-3 text-muted-foreground flex-shrink-0" />
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 truncate max-w-[120px]"
                        >
                          {toolInfo.serverName}
                        </Badge>
                        <ChevronRight className="size-2 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {toolInfo.toolName}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-auto">
                  <span
                    className={cn(
                      "text-xs",
                      item.status != "fail" && "text-muted-foreground",
                    )}
                  >
                    {item.status != "running" &&
                      ((item.endedAt! - item.startedAt!) / 1000).toFixed(2)}
                  </span>
                  {item.status == "success" ? (
                    <Check className="size-3" />
                  ) : item.status == "fail" ? (
                    <XIcon className="size-3" />
                  ) : (
                    <Loader2 className="size-3 animate-spin" />
                  )}
                  {result && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNodeExpansion(item.id);
                      }}
                    >
                      <Eye className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            </NodeResultPopup>

            {/* Enhanced tool details display */}
            {toolInfo && isExpanded && result && (
              <div className="ml-8 mt-1 p-3 bg-muted/30 rounded border text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <h6 className="font-medium text-foreground">Tool Details</h6>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-3"
                    onClick={() =>
                      copy(JSON.stringify(toolInfo.parameters, null, 2))
                    }
                  >
                    {copied ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Server:</span>
                    <Badge variant="secondary" className="text-xs">
                      {toolInfo.serverName}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Tool:</span>
                    <Badge variant="secondary" className="text-xs">
                      {toolInfo.toolName}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <span className="text-muted-foreground block mb-1">
                      Parameters:
                    </span>
                    <div className="bg-background p-2 rounded border max-h-[200px] overflow-y-auto">
                      <JsonView
                        data={toolInfo.parameters}
                        initialExpandDepth={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-2">{output}</div>
    </div>
  );
}

function areEqual(
  prev: WorkflowInvocationProps,
  next: WorkflowInvocationProps,
) {
  if (prev.result.status != next.result.status) return false;
  if (prev.result.error?.message != next.result.error?.message) return false;
  if (prev.result.result != next.result.result) return false;
  if (!equal(prev.result.history, next.result.history)) return false;
  if (!equal(prev.result.result, next.result.result)) return false;
  return true;
}

export const WorkflowInvocation = memo(PureWorkflowInvocation, areEqual);
