import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewProjectButton from "./new-project-button";

const STAGE_LABELS: Record<string, string> = {
  interest_capture: "Finding your interest",
  idea_narrowing: "Narrowing your idea",
  methodology: "Designing your methodology",
  iteration: "Running your project",
  writeup: "Writing it up",
  complete: "Complete",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#FAF8F4] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-stone-900">
            Your projects
          </h1>
          <NewProjectButton />
        </div>

        {(!projects || projects.length === 0) && (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 p-10 text-center">
            <p className="text-stone-600">
              No project yet. Start one to begin — tell the coach what
              you&apos;re curious about, and go from there.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {projects?.map((project) => (
            <a
              key={project.id}
              href={`/chat/${project.id}`}
              className="block rounded-lg border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-900">
                  {(project.context as { topic?: string })?.topic ||
                    "New research project"}
                </span>
                <span className="text-xs text-stone-400">
                  {new Date(project.updated_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-stone-500">
                {STAGE_LABELS[project.stage] ?? project.stage}
              </p>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
