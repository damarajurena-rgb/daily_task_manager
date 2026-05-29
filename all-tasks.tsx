import { useState } from "react";
import { 
  useListTasks, 
  getListTasksQueryKey 
} from "@workspace/api-client-react";
import { TaskCard } from "@/components/task-card";
import { Layout } from "@/components/layout";
import { ListChecks } from "lucide-react";

export function AllTasksPage() {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  
  const completedParam = filter === "all" ? undefined : filter === "completed";
  
  const { data: tasks, isLoading } = useListTasks(
    { completed: completedParam }, 
    { query: { queryKey: getListTasksQueryKey({ completed: completedParam }) } }
  );

  return (
    <Layout>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif text-foreground mb-2">All Tasks</h1>
          <p className="text-muted-foreground">Every task across all days.</p>
        </div>
        
        <div className="flex bg-card border rounded-xl p-1 shadow-sm">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <section className="flex flex-col gap-4">
        {isLoading ? (
          <div className="animate-pulse flex flex-col gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted rounded-2xl w-full"></div>
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ListChecks className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif mb-2">Nothing to see here</h3>
            <p className="text-muted-foreground max-w-sm">
              You have no tasks matching this filter.
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
}
