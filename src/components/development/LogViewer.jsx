"use client";

import { useRef } from "react";
import { Terminal, Trash2, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export default function LogViewer({ logs = [], isConnected = false, isPaused = false, setIsPaused, onClear }) {
  const terminalEndRef = useRef(null);

  const getLogColorClass = (type) => {
    switch (type) {
      case "traffic":
        return "text-emerald-400";
      case "graphql":
        return "text-purple-400";
      case "error":
        return "text-rose-400 font-bold";
      case "auth":
        return "text-amber-400";
      default:
        return "text-gray-300";
    }
  };

  const formatLogPayload = (type, entry) => {
    if (!entry) return "";
    const time = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : "";
    if (type === "traffic") {
      return `[${time}] [TRAFFIC] ${entry.method} ${entry.path} - Status: ${entry.statusCode} (${entry.responseTimeMs}ms) [IP: ${entry.ip}]`;
    }
    if (type === "graphql") {
      return `[${time}] [GRAPHQL] ${entry.operationType.toUpperCase()} ${entry.operationName} (${entry.durationMs}ms) ${entry.hasError ? "❌ ERROR" : "✅ OK"}`;
    }
    if (type === "error") {
      return `[${time}] [ERROR] ${entry.method} ${entry.path} - ${entry.statusCode}: ${entry.errorMessage} (IP: ${entry.ip})`;
    }
    if (type === "auth") {
      return `[${time}] [AUTH] ${entry.event} - Reason: ${entry.reason} (IP: ${entry.ip})`;
    }
    return `[${time}] [${type.toUpperCase()}] ${JSON.stringify(entry)}`;
  };

  return (
    <div className="flex flex-col bg-gray-950 rounded-xl border border-gray-800 shadow-2xl overflow-hidden h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Terminal className="h-5 w-5 text-sky-400 animate-pulse" />
          <span className="font-mono text-sm font-semibold text-gray-200">Live Log Viewer</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            isConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isConnected ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`} />
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs h-8"
          >
            {isPaused ? <Play className="h-3.5 w-3.5 mr-1" /> : <Pause className="h-3.5 w-3.5 mr-1" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="border-gray-700 text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 text-xs h-8"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Terminal logs */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed text-gray-300 space-y-1">
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-20">
            Waiting for logs... Perform some actions in the application.
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className={`${getLogColorClass(log.type)} break-all whitespace-pre-wrap transition-all duration-150`}>
              {formatLogPayload(log.type, log.entry)}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
