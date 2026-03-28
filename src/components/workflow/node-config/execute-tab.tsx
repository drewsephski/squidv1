import { useWorkflowStore } from "@/app/store/workflow.store";
import {
  NodeKind,
  NodeRuntimeHistory,
} from "lib/ai/workflow/workflow.interface";
import { useReactFlow } from "@xyflow/react";
import { useObjectState } from "@/hooks/use-object-state";
import { UINode } from "lib/ai/workflow/workflow.interface";
import { cn, createDebounce } from "lib/utils";
import { useCallback, useMemo, useState } from "react";
import { GraphEndEvent } from "ts-edge";
import { allNodeValidate } from "lib/ai/workflow/node-validate";
import { toast } from "sonner";
import { decodeWorkflowEvents } from "lib/ai/workflow/shared.workflow";
import { Loader, WandSparklesIcon, XIcon } from "lucide-react";
import { Button } from "ui/button";
import { Separator } from "ui/separator";
import { FlipWords } from "ui/flip-words";
import { Label } from "ui/label";
import { Input } from "ui/input";
import { Switch } from "ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { Textarea } from "ui/textarea";
import { generateObjectAction } from "@/app/api/chat/actions";
import { appStore } from "@/app/store";
import { notify } from "lib/notify";
import { SelectModel } from "@/components/select-model";
import { WorkflowOutcomeLayer } from "../workflow-outcome-layer";
import { useTranslations } from "next-intl";
import { mutate } from "swr";
import { WorkflowChatOutput } from "../workflow-chat-output";

const debounce = createDebounce();

export function ExecuteTab({
  close,
  onSave,
}: {
  close: () => void;
  onSave: () => Promise<void>;
}) {
  const { addProcess, processIds, workflow } = useWorkflowStore();

  const tabs = useMemo(
    () => [
      {
        label: "Input",
        value: "input",
      },
      {
        label: "Result",
        value: "result",
      },
    ],
    [],
  );

  const [tab, setTab] = useState<(typeof tabs)[number]["value"]>(tabs[0].value);
  const t = useTranslations();
  const [isRunning, setIsRunning] = useState(false);
  const [histories, setHistories] = useState<NodeRuntimeHistory[]>([]);
  const [result, setResult] = useState<GraphEndEvent | undefined>();
  const [showResultDialog, setShowResultDialog] = useState(false);

  const isProcessing = useMemo(
    () => Boolean(processIds.length),
    [processIds.length],
  );

  const { getEdges, getNodes, fitView, getNode, updateNodeData, setNodes } =
    useReactFlow<UINode>();
  const nodes = getNodes();

  const [query, setQuery] = useObjectState({} as Record<string, any>);

  const startNodeData = useMemo(() => {
    return nodes.find((node) => node.data.kind === NodeKind.Input)!.data;
  }, [nodes]);

  const inputSchema = useMemo(() => {
    return startNodeData.outputSchema;
  }, [startNodeData]);

  const inputSchemaIterator = useMemo(() => {
    return Object.entries(inputSchema.properties ?? {});
  }, [inputSchema]);

  const handleGenerateInputWithAI = useCallback(async () => {
    let model = appStore.getState().chatModel;
    const result = await notify.prompt({
      title: t("Common.generateInputWithAI"),
      description: (
        <div className="flex items-center gap-2">
          <p className="mr-auto">
            {t("Workflow.generateInputWithAIDescription")}
          </p>
          <SelectModel
            onSelect={(m) => {
              model = m;
            }}
          />
        </div>
      ),
    });
    if (!result) return;
    toast.promise(
      generateObjectAction({
        model,
        prompt: {
          system: `You are a parameter generator for tool execution.
Analyze the user's request and generate creative JSON data that matches the provided schema.
If information cannot be inferred from the user's question, use your creativity to generate engaging data.
Fill all required fields and return only valid JSON without explanations.

tool-name: ${workflow!.name}
${workflow!.description ? `tool-description: ${workflow!.description}` : ""}`,
          user: result,
        },
        schema: inputSchema,
      }).then((res) => {
        setQuery(res);
      }),
      {
        loading: t("Common.generatingInputWithAI"),
        success: t("Common.inputGeneratedSuccessfully"),
        error: t("Common.failedToGenerateInput"),
      },
    );
  }, [inputSchema]);

  const handleClick = async () => {
    await onSave();
    const failSchema = inputSchemaIterator.find(([key]) => {
      if (inputSchema.required?.includes(key) && query[key] === undefined)
        return true;
    });
    if (failSchema) {
      return toast.warning(`${failSchema[0]} is Empty`);
    }

    const validateResult = allNodeValidate({
      nodes,
      edges: getEdges(),
    });

    if (validateResult !== true) {
      if (validateResult.node) {
        setNodes((nds) => {
          return nds.map((node) => {
            if (node.id === validateResult.node?.id) {
              return { ...node, selected: true };
            }
            if (node.selected) {
              return { ...node, selected: false };
            }
            return node;
          });
        });
      }
      return toast.warning(validateResult.errorMessage);
    }
    run(query);
  };

  const fitviewWithDebounce = useCallback((id: string) => {
    const node = getNode(id);
    if (!node) return;
    const nextNodes = getEdges()
      .filter((edge) => edge.source == id)
      .map((edge) => getNode(edge.target))
      .filter(Boolean) as UINode[];
    const fitviewNodes = [node, ...nextNodes];
    debounce(() => {
      fitView({
        duration: 300,
        nodes: fitviewNodes,
        maxZoom: 1.8,
      });
    }, 300);
  }, []);

  const run = useCallback(
    async (query: Record<string, any>) => {
      const stop = addProcess();
      const abortController = new AbortController();
      setHistories([]);
      setIsRunning(true);
      setNodes((nds) => {
        return nds.map((node) => {
          if (node.data.runtime?.status) {
            return {
              ...node,
              data: { ...node.data, runtime: { status: undefined } },
            };
          }
          return node;
        });
      });
      try {
        const response = await fetch(`/api/workflow/${workflow!.id}/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No readable stream available");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const { events, remainingBuffer } = decodeWorkflowEvents(buffer);
            buffer = remainingBuffer;

            for (const event of events) {
              switch (event.eventType) {
                case "WORKFLOW_START":
                  setTab("result");
                  break;
                case "WORKFLOW_END":
                  setResult(event);
                  stop();
                  setShowResultDialog(true);
                  // Invalidate SWR cache to refresh sidebar
                  mutate("/api/workflow-run");
                  break;
                case "NODE_START": {
                  fitviewWithDebounce(event.node.name);
                  updateNodeData(event.node.name, {
                    runtime: { status: "running" },
                  });
                  setHistories((prev) => {
                    const uiNode = getNode(event.node.name);
                    if (!uiNode) return prev;
                    return [
                      ...prev,
                      {
                        nodeId: event.node.name,
                        startedAt: Date.now(),
                        id: event.nodeExecutionId,
                        name: uiNode.data.name,
                        kind: uiNode.data.kind,
                        status: "running",
                      },
                    ];
                  });
                  break;
                }
                case "NODE_END": {
                  updateNodeData(event.node.name, {
                    runtime: { status: event.isOk ? "success" : "fail" },
                  });
                  setHistories((prev) => {
                    const prevHistory = prev.find(
                      (h) => h.id === event.nodeExecutionId,
                    );
                    if (!prevHistory) return prev;
                    return prev.map((n) => {
                      if (n != prevHistory) return n;
                      const source = event.isOk
                        ? event.node.output
                        : event.node.input;
                      return {
                        ...prevHistory,
                        endedAt: Date.now(),
                        status: event.isOk ? "success" : "fail",
                        error: event.error,
                        result: {
                          output: source?.outputs?.[prevHistory.nodeId],
                          input: source?.inputs?.[prevHistory.nodeId],
                        },
                      } as NodeRuntimeHistory;
                    });
                  });
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          stop();
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("Workflow execution was aborted");
        } else {
          console.error("Workflow execution error:", error);
        }
        stop();
      } finally {
        setIsRunning(false);
      }
    },
    [workflow!.id],
  );

  return (
    <div className="fade-300 w-sm h-[85vh] bg-card border rounded-lg shadow-lg overflow-y-auto py-4">
      <div className="flex flex-col px-4">
        <div className="flex items-center gap-2 w-full h-9">
          <span className="font-semibold text-foreground">Test Run</span>
          <div
            className={cn(
              "p-1 rounded-lg hover:bg-muted cursor-pointer ml-auto transition-all duration-200 group",
              isProcessing && "sr-only",
            )}
            onClick={close}
          >
            <XIcon className="size-5.5 text-muted-foreground group-hover:text-destructive transition-colors" />
          </div>
        </div>
      </div>
      <div className="flex">
        {tabs.map((t) => (
          <Button
            key={t.value}
            variant="ghost"
            className={cn(
              "rounded-none",
              tab == t.value && "border-b border-primary",
            )}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      <Separator className="mb-4" />

      {tab == tabs[0].value ? (
        <div className="px-4 flex flex-col gap-4">
          {inputSchemaIterator.length == 0 ? (
            <div className="flex items-center justify-center h-40">
              <FlipWords
                className="text-sm text-muted-foreground"
                words={["No input required for this workflow"]}
              />
            </div>
          ) : (
            <>
              <div
                tabIndex={1}
                onClick={handleGenerateInputWithAI}
                className="hover:bg-secondary rounded-sm px-2 py-1 flex items-center gap-2 ml-auto text-xs font-semibold cursor-pointer hover:text-primary transition-colors"
              >
                {t("Common.generateInputWithAI")}
                <WandSparklesIcon className="size-3" />
              </div>
              {inputSchemaIterator.map(([key, schema], i) => {
                return (
                  <div key={key ?? i}>
                    <Label
                      className="mb-2 text-sm font-semibold ml-0.5 gap-0.5"
                      htmlFor={key || String(i)}
                    >
                      {key || "undefined"}
                      {inputSchema.required?.includes(key) && (
                        <span className="text-xs text-destructive">*</span>
                      )}
                    </Label>
                    {schema.type == "number" ? (
                      <Input
                        disabled={isProcessing}
                        id={key || String(i)}
                        type="number"
                        placeholder={schema.description || "number"}
                        defaultValue={query[key] || undefined}
                        onChange={(e) =>
                          setQuery({ ...query, [key]: Number(e.target.value) })
                        }
                      />
                    ) : schema.type == "boolean" ? (
                      <Switch
                        disabled={isProcessing}
                        id={key || String(i)}
                        checked={query[key]}
                        onCheckedChange={(checked) =>
                          setQuery({ ...query, [key]: checked })
                        }
                      />
                    ) : schema.type == "string" && schema.enum ? (
                      <Select
                        disabled={isProcessing}
                        value={query[key]}
                        onValueChange={(value) =>
                          setQuery({ ...query, [key]: value })
                        }
                      >
                        <SelectTrigger
                          id={key || String(i)}
                          className="min-w-46"
                        >
                          <SelectValue
                            placeholder={schema.description || "option"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(schema.enum as string[]).map((item, i) => (
                            <SelectItem key={item ?? i} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : schema.type == "string" ? (
                      <Textarea
                        disabled={isProcessing}
                        id={key || String(i)}
                        value={query[key]}
                        className="resize-none max-h-28 overflow-y-auto"
                        placeholder={schema.description || "string"}
                        onChange={(e) =>
                          setQuery({ ...query, [key]: e.target.value })
                        }
                      />
                    ) : null}
                  </div>
                );
              })}
            </>
          )}
          <Button
            disabled={isProcessing}
            className="font-bold w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-[1.01] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClick}
          >
            {isProcessing ? (
              <Loader className="size-3.5 animate-spin" />
            ) : (
              t("Common.run")
            )}
          </Button>
        </div>
      ) : tab == tabs[1].value ? (
        <div className="flex flex-col h-full">
          {/* Chat-style workflow output */}
          <WorkflowChatOutput
            histories={histories}
            isRunning={isRunning}
            className="flex-1 max-h-[80vh]"
          />

          {/* View Results button at bottom */}
          {result && (
            <div className="px-4 py-3 border-t">
              <Button
                size="sm"
                onClick={() => setShowResultDialog(true)}
                className="w-full"
              >
                {t("Common.viewResults")}
              </Button>
              <WorkflowOutcomeLayer
                result={result}
                open={showResultDialog}
                onOpenChange={setShowResultDialog}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
