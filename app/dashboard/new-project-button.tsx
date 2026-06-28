"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewProjectButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function startNewProject() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("projects")
      .insert({ student_id: user.id })
      .select()
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    router.push(`/chat/${data.id}`);
  }

  return (
    <button
      onClick={startNewProject}
      disabled={loading}
      className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
    >
      {loading ? "Starting..." : "+ New project"}
    </button>
  );
}
