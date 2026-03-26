"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "lib/utils";
import { WorkflowRunSummary } from "app-types/workflow";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Workflow,
} from "lucide-react";
import { Skeleton } from "ui/skeleton";
import { Alert, AlertDescription } from "ui/alert";
import { JsonDisplay } from "@/components/json-display";

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "running":
        return {
          icon: <Clock className="h-3 w-3" />,
          label: "Running",
          variant: "default" as const,
        };
      case "completed":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          label: "Completed",
          variant: "default" as const,
        };
      case "failed":
        return {
          icon: <XCircle className="h-3 w-3" />,
          label: "Failed",
          variant: "destructive" as const,
        };
      case "cancelled":
        return {
          icon: <XCircle className="h-3 w-3" />,
          label: "Cancelled",
          variant: "secondary" as const,
        };
      default:
        return {
          icon: <Play className="h-3 w-3" />,
          label: status,
          variant: "outline" as const,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

// Format duration
const formatDuration = (duration?: number): string => {
  if (!duration) return "N/A";

  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`;
  } else {
    return `${(duration / 60000).toFixed(1)}m`;
  }
};

// Format date
const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
};

export default function WorkflowRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;

  const {
    data: run,
    error,
    isLoading,
  } = useSWR<WorkflowRunSummary>(`/api/workflow-run/${runId}`, fetcher);

  const handleGoBack = () => {
    router.back();
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load workflow run. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          {isLoading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <h1 className="text-2xl font-bold">{run?.title}</h1>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          run && <StatusBadge status={run.status} />
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Run Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Run Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ) : run ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Workflow:</span>
                    <span>{run.workflowName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Status:</span>
                    <StatusBadge status={run.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Duration:</span>
                    <span>{formatDuration(run.duration)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Started: {formatDate(run.startedAt)}</span>
                  </div>
                  {run.endedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Ended: {formatDate(run.endedAt)}</span>
                    </div>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : run ? (
                <JsonDisplay data={run.input || {}} />
              ) : null}
            </CardContent>
          </Card>

          {/* Output */}
          {run?.status === "completed" && run.output && (
            <Card>
              <CardHeader>
                <CardTitle>Output</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonDisplay data={run.output} />
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {run?.status === "failed" && run.error && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>
                        <strong>{run.error.name}</strong>
                      </div>
                      <div>{run.error.message}</div>
                      {run.error.stack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm opacity-70">
                            Stack Trace
                          </summary>
                          <pre className="mt-2 text-xs overflow-auto bg-gray-50 p-2 rounded">
                            {run.error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ) : run ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {run.userAvatar ? (
                      <img
                        src={run.userAvatar}
                        alt={run.userName}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <span className="text-xs font-medium">
                        {run.userName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{run.userName}</div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Metadata */}
          {run?.metadata && Object.keys(run.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonDisplay data={run.metadata} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
