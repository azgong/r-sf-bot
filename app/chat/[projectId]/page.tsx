"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

const STAGE_LABELS: Record<string, string> = {
  interest_capture: "Finding your interest",
  idea_narrowing: "Narrowing your idea",
  methodology: "Designing your methodology",
  iteration: "Running your project",
  writeup: "Writing it up",
  complete: "Complete 🎉",
};

export default function ChatPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [stage, setStage] = useState<string>("interest_capture");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load existing history + current stage when the page first opens.
  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: project } = await supabase
        .from("projects")
        .select("stage")
        .eq("id", projectId)
        .single();
      if (project) setStage(project.stage);

      const { data: history } = await supabase
        .from("messages")
        .select("role, content")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (history && history.length > 0) {
        setMessages(history as Message[]);
      } else {
        // Kick off the conversation with an opening message from the coach,
        // so the student isn't staring at a blank screen.
        setMessages([
          {
            role: "assistant",
            content:
              "Hi! I'm here to help you turn an idea into a real research or science fair project. To start — what's something you find yourself thinking about, even outside of school? It doesn't have to be a school subject — a hobby, a question you've wondered about, anything.",
          },
        ]);
      }
      setLoaded(true);
    }
    load();
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: userMessage }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setStage(data.stage);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, something went wrong reaching the coach. Please try sending that again in a moment.",
        },
      ]);
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="flex h-screen flex-col bg-[#FAF8F4]">
      <header className="border-b border-stone-200 bg-white/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <a href="/dashboard" className="text-sm text-stone-500 hover:text-stone-700">
            ← All projects
          </a>
          <span className="text-xs font-medium text-stone-500">
            {STAGE_LABELS[stage] ?? stage}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {!loaded && (
            <p className="text-center text-sm text-stone-400">Loading...</p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-stone-900 text-white"
                    : "border border-stone-200 bg-white text-stone-800"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-400">
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-stone-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reply..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
