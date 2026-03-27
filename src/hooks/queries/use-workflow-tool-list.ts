"use client";
import useSWR, { SWRConfiguration } from "swr";
import { appStore } from "@/app/store";
import { fetcher } from "lib/utils";

export function useWorkflowToolList(options?: SWRConfiguration) {
  // Fetch published workflows for chat tools
  const toolsQuery = useSWR("/api/workflow/tools", fetcher, {
    errorRetryCount: 0,
    revalidateOnFocus: false,
    focusThrottleInterval: 1000 * 60 * 30,
    fallbackData: [],
    onSuccess: (data) => {
      appStore.setState({ workflowToolList: data });
    },
    ...options,
  });

  // Fetch unpublished workflow count
  useSWR("/api/workflow/unpublished-count", fetcher, {
    errorRetryCount: 0,
    revalidateOnFocus: false,
    focusThrottleInterval: 1000 * 60 * 30,
    fallbackData: { count: 0 },
    onSuccess: (data) => {
      appStore.setState({ unpublishedWorkflowCount: data.count });
    },
    ...options,
  });

  return toolsQuery;
}
