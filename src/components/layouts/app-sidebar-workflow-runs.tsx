"use client";

import { SidebarGroupLabel, SidebarMenuSub } from "ui/sidebar";
import Link from "next/link";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarMenuSubItem,
} from "ui/sidebar";
import { SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroup } from "ui/sidebar";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Play,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { Button } from "ui/button";
import { fetcher } from "lib/utils";
import useSWR, { mutate } from "swr";
import { handleErrorWithToast } from "ui/shared-toast";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "ui/alert-dialog";
import { WorkflowRunSummary } from "app-types/workflow";

type WorkflowRunGroup = {
  label: string;
  runs: WorkflowRunSummary[];
};

const MAX_WORKFLOW_RUNS_COUNT = 40;

// Status icon mapping
const getStatusIcon = (status: string) => {
  switch (status) {
    case "running":
      return <Clock className="h-3.5 w-3.5 text-blue-500" />;
    case "completed":
      return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    case "cancelled":
      return <XCircle className="h-3.5 w-3.5 text-muted-foreground" />;
    default:
      return <Play className="h-3.5 w-3.5 text-muted-foreground" />;
  }
};

// Format duration in human readable format
const formatDuration = (duration?: number): string => {
  if (!duration) return "";

  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`;
  } else {
    return `${(duration / 60000).toFixed(1)}m`;
  }
};

export function AppSidebarWorkflowRuns() {
  const mounted = useMounted();
  const t = useTranslations("Layout");

  const { data: workflowRunList, isLoading } = useSWR(
    "/api/workflow-run",
    fetcher,
    {
      onError: handleErrorWithToast,
      fallbackData: [],
    },
  );

  // State to track if expanded view is active
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if we have 40 or more workflow runs to display "View All" button
  const hasExcessRuns =
    workflowRunList && workflowRunList.length >= MAX_WORKFLOW_RUNS_COUNT;

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [runToDelete, setRunToDelete] = useState<string | null>(null);

  const handleDeleteWorkflowRun = async (runId: string) => {
    setRunToDelete(runId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteWorkflowRun = async () => {
    if (!runToDelete) return;

    try {
      const response = await fetch(`/api/workflow-run/${runToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t("workflowRunDeleted"));
        mutate("/api/workflow-run");
        setDeleteConfirmOpen(false);
        setRunToDelete(null);
      } else {
        throw new Error(response.statusText);
      }
    } catch (error) {
      handleErrorWithToast(error as Error);
    }
  };

  // Use either limited or full workflow run list based on expanded state
  const displayWorkflowRunList = useMemo(() => {
    if (!workflowRunList) return [];
    return !isExpanded && hasExcessRuns
      ? workflowRunList.slice(0, MAX_WORKFLOW_RUNS_COUNT)
      : workflowRunList;
  }, [workflowRunList, hasExcessRuns, isExpanded]);

  const workflowRunGroupByDate = useMemo(() => {
    if (!displayWorkflowRunList || displayWorkflowRunList.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: WorkflowRunGroup[] = [
      { label: t("today"), runs: [] },
      { label: t("yesterday"), runs: [] },
      { label: t("lastWeek"), runs: [] },
      { label: t("older"), runs: [] },
    ];

    displayWorkflowRunList.forEach((run) => {
      const runDate = new Date(run.startedAt);
      runDate.setHours(0, 0, 0, 0);

      if (runDate.getTime() === today.getTime()) {
        groups[0].runs.push(run);
      } else if (runDate.getTime() === yesterday.getTime()) {
        groups[1].runs.push(run);
      } else if (runDate.getTime() >= lastWeek.getTime()) {
        groups[2].runs.push(run);
      } else {
        groups[3].runs.push(run);
      }
    });

    // Filter out empty groups
    return groups.filter((group) => group.runs.length > 0);
  }, [displayWorkflowRunList]);

  if (isLoading || workflowRunList?.length === 0)
    return (
      <SidebarGroup>
        <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/workflow-runs">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarGroupLabel className="mb-2">
                <h4 className="text-xs text-muted-foreground">
                  {t("workflowRuns")}
                </h4>
              </SidebarGroupLabel>

              {isLoading ? (
                Array.from({ length: 8 }).map(
                  (_, index) => mounted && <SidebarMenuSkeleton key={index} />,
                )
              ) : (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("noWorkflowRunsYet")}
                  </p>
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );

  return (
    <>
      {workflowRunGroupByDate.map((group) => {
        return (
          <SidebarGroup key={group.label}>
            <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/workflow-runs">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarGroupLabel className="">
                    <h4 className="text-xs text-muted-foreground group-hover/workflow-runs:text-foreground transition-colors">
                      {group.label}
                    </h4>
                    <div className="flex-1" />
                  </SidebarGroupLabel>

                  {group.runs.map((run) => (
                    <SidebarMenuSub key={run.id} className={"group/run mr-0"}>
                      <SidebarMenuSubItem>
                        <div className="flex items-center data-[state=open]:bg-input! group-hover/run:bg-input! rounded-lg">
                          <Tooltip delayDuration={1000}>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                asChild
                                className="group-hover/run:bg-transparent!"
                              >
                                <Link
                                  href={`/workflow-runs/${run.id}`}
                                  className="flex items-center flex-1 min-w-0"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="flex-shrink-0">
                                      {getStatusIcon(run.status)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate min-w-0">
                                        {run.title}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground min-w-0">
                                        {run.workflowName}
                                        {run.duration && (
                                          <span className="ml-1">
                                            • {formatDuration(run.duration)}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </Link>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px] p-4 break-all overflow-y-auto max-h-[200px]">
                              <p className="font-medium">{run.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {run.workflowName}
                              </p>
                              {run.duration && (
                                <p className="text-xs text-muted-foreground">
                                  {formatDuration(run.duration)}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>

                          <SidebarMenuAction
                            className="data-[state=open]:bg-input data-[state=open]:opacity-100 opacity-0 group-hover/run:opacity-100"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteWorkflowRun(run.id);
                            }}
                          >
                            <MoreHorizontal />
                          </SidebarMenuAction>
                        </div>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  ))}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}

      {hasExcessRuns && (
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="w-full flex px-4">
              <Button
                variant="secondary"
                size="sm"
                className="w-full hover:bg-input! justify-start"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <MoreHorizontal className="mr-2" />
                {isExpanded ? t("Common.showLess") : t("Common.showAll")}
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteWorkflowRun")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteWorkflowRun}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
