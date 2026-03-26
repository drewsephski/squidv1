"use client";

import { useState } from "react";
import { Button } from "ui/button";
import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { toast } from "sonner";

interface JsonDisplayProps {
  data: any;
  className?: string;
}

export function JsonDisplay({ data, className = "" }: JsonDisplayProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const renderValue = (value: any, path: string): React.ReactNode => {
    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }

    if (value === undefined) {
      return <span className="text-gray-500">undefined</span>;
    }

    if (typeof value === "string") {
      return <span className="text-green-600">"{value}"</span>;
    }

    if (typeof value === "number") {
      return <span className="text-blue-600">{value}</span>;
    }

    if (typeof value === "boolean") {
      return <span className="text-purple-600">{value}</span>;
    }

    if (Array.isArray(value)) {
      const isExpanded = expanded.has(path);

      return (
        <div className="ml-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => toggleExpand(path)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
            <span className="text-gray-600">[{value.length}]</span>
          </div>

          {isExpanded && (
            <div className="ml-4 border-l border-gray-200 pl-4">
              {value.map((item, index) => (
                <div key={index} className="py-1">
                  <span className="text-gray-500">{index}:</span>{" "}
                  {renderValue(item, `${path}[${index}]`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      const isExpanded = expanded.has(path);

      return (
        <div className="ml-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => toggleExpand(path)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
            <span className="text-gray-600">{"{" + keys.length + "}"}</span>
          </div>

          {isExpanded && (
            <div className="ml-4 border-l border-gray-200 pl-4">
              {keys.map((key) => (
                <div key={key} className="py-1">
                  <span className="text-gray-700 font-medium">{key}:</span>{" "}
                  {renderValue(value[key], `${path}.${key}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-2 right-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(jsonString)}
          className="h-8 w-8 p-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      <div className="bg-gray-50 border rounded-md p-4 text-sm font-mono overflow-auto max-h-96">
        {renderValue(data, "root")}
      </div>
    </div>
  );
}
