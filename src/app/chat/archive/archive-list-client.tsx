"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "ui/card";
import { MessageCircleXIcon, FolderSearchIcon } from "lucide-react";
import useArchives from "@/hooks/queries/use-archives";
import { Skeleton } from "ui/skeleton";

// Simple date formatting function
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

export default function ArchiveListClient() {
  const { data: archives, isLoading } = useArchives();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl z-40">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="bg-transparent border-none">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl z-40">
      {/* Header */}
      <div className="mb-8 z-50">
        <div className="flex items-center gap-3 mb-2">
          <FolderSearchIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Archives</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Your chat archives organized in one place.
        </p>
      </div>

      {/* Archives List */}
      <div className="space-y-4">
        {archives?.length === 0 ? (
          <Card className="bg-transparent border-none">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <MessageCircleXIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No archives yet</h3>
                <p className="text-muted-foreground">
                  Create your first archive to start organizing your chat
                  threads.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          archives?.map((archive) => (
            <Link key={archive.id} href={`/chat/archive/${archive.id}`}>
              <Card className="hover:bg-accent/30 transition-all duration-200 cursor-pointer">
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-base truncate mb-1">
                        {archive.name}
                      </h3>
                      {archive.description && (
                        <p className="text-muted-foreground text-sm truncate">
                          {archive.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        Created {formatTimeAgo(new Date(archive.createdAt))}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
