"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, ChevronDown, Loader2, RotateCcw } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";

export interface AIWorkflowAction {
  type: "add_node" | "update_node" | "delete_node" | "add_edge" | "delete_edge" | "replace_workflow";
  // add_node
  node?: {
    id: string;
    nodeType: string;
    name: string;
    position: { x: number; y: number };
    data: Record<string, any>;
  };
  // update_node
  nodeId?: string;
  data?: Record<string, any>;
  // delete_node / delete_edge
  edgeId?: string;
  // add_edge
  edge?: {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
  };
  // replace_workflow
  nodes?: any[];
  edges?: any[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AIWorkflowAction[];
  appliedActions?: boolean;
  error?: boolean;
}

interface WorkflowAIChatboxProps {
  nodes: Node[];
  edges: Edge[];
  workflowName?: string;
  onApplyActions: (actions: AIWorkflowAction[]) => void;
}

export default function WorkflowAIChatbox({
  nodes,
  edges,
  workflowName,
  onApplyActions,
}: WorkflowAIChatboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI workflow designer. Tell me what you'd like to build or modify. For example:\n\n• \"Create a customer support workflow\"\n• \"Add a condition node after the agent\"\n• \"Make the agent use GPT-4o\"\n• \"Add an approval step before the end\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Build previous messages for API (exclude welcome message)
    const apiMessages = [...messages.filter((m) => m.id !== "welcome"), userMessage].map(
      (m) => ({ role: m.role, content: m.content })
    );

    try {
      const response = await fetch("/api/workflow-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          nodes,
          edges,
          workflowName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Request failed");
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        actions: data.actions?.length > 0 ? data.actions : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : "Unknown error"}`,
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, nodes, edges, workflowName]);

  const handleApplyActions = useCallback(
    (messageId: string, actions: AIWorkflowAction[]) => {
      onApplyActions(actions);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, appliedActions: true } : m
        )
      );
    },
    [onApplyActions]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm your AI workflow designer. Tell me what you'd like to build or modify. For example:\n\n• \"Create a customer support workflow\"\n• \"Add a condition node after the agent\"\n• \"Make the agent use GPT-4o\"\n• \"Add an approval step before the end\"",
      },
    ]);
  }, []);

  const actionCount = (msg: ChatMessage) => msg.actions?.length ?? 0;

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-24 right-24 z-[100] flex items-center gap-8 px-16 py-10 rounded-full shadow-lg transition-all font-medium text-sm ${
          isOpen
            ? "bg-accent-white border border-border-faint text-accent-black hover:bg-black-alpha-4"
            : "bg-heat-100 hover:bg-heat-200 text-white"
        }`}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        title="AI Workflow Designer"
      >
        {isOpen ? (
          <>
            <ChevronDown className="w-16 h-16" />
            <span>Close AI</span>
          </>
        ) : (
          <>
            <Sparkles className="w-16 h-16" />
            <span>AI Designer</span>
          </>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-76 right-24 z-[99] w-[420px] max-w-[calc(100vw-48px)] bg-accent-white border border-border-faint rounded-16 shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "min(600px, calc(100vh - 140px))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-16 py-12 border-b border-border-faint flex-shrink-0">
              <div className="flex items-center gap-10">
                <div className="w-28 h-28 rounded-8 bg-heat-100 flex items-center justify-center">
                  <Sparkles className="w-14 h-14 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-accent-black leading-tight">AI Workflow Designer</p>
                  <p className="text-xs text-black-alpha-48 leading-tight">{workflowName || "Untitled Workflow"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={clearHistory}
                  title="Clear chat history"
                  className="w-28 h-28 rounded-6 hover:bg-black-alpha-4 text-black-alpha-48 hover:text-accent-black transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="w-14 h-14" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-28 h-28 rounded-6 hover:bg-black-alpha-4 text-black-alpha-48 hover:text-accent-black transition-colors flex items-center justify-center"
                >
                  <X className="w-14 h-14" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-12 space-y-12 min-h-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-12 px-12 py-8 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-heat-100 text-white rounded-br-4"
                        : msg.error
                        ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-4"
                        : "bg-black-alpha-4 text-accent-black rounded-bl-4"
                    }`}
                  >
                    {/* Message content with newline support */}
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Action buttons */}
                    {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-black-alpha-8">
                        {msg.appliedActions ? (
                          <div className="flex items-center gap-6 text-xs text-green-600 font-medium">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Applied {actionCount(msg)} change{actionCount(msg) !== 1 ? "s" : ""} to workflow
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApplyActions(msg.id, msg.actions!)}
                            className="flex items-center gap-6 text-xs font-medium px-10 py-6 bg-heat-100 hover:bg-heat-200 text-white rounded-8 transition-colors"
                          >
                            <Sparkles className="w-12 h-12" />
                            Apply {actionCount(msg)} change{actionCount(msg) !== 1 ? "s" : ""} to workflow
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-black-alpha-4 rounded-12 rounded-bl-4 px-12 py-10 flex items-center gap-8">
                    <Loader2 className="w-14 h-14 text-heat-100 animate-spin" />
                    <span className="text-sm text-black-alpha-48">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 border-t border-border-faint p-12">
              <div className="flex items-end gap-8">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me to create or modify the workflow…"
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 resize-none rounded-10 border border-border-faint bg-background-base px-12 py-8 text-sm text-accent-black placeholder:text-black-alpha-48 focus:outline-none focus:ring-1 focus:ring-heat-100 focus:border-heat-100 disabled:opacity-50 transition-all"
                  style={{ minHeight: "36px", maxHeight: "120px" }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = Math.min(t.scrollHeight, 120) + "px";
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="w-36 h-36 flex-shrink-0 rounded-10 bg-heat-100 hover:bg-heat-200 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-16 h-16" />
                </button>
              </div>
              <p className="text-xs text-black-alpha-32 mt-6">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
