import { format } from "date-fns";
import { 
  useListTasks, 
  getListTasksQueryKey,
  useGetTaskSummary,
  getGetTaskSummaryQueryKey
} from "@workspace/api-client-react";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "@/components/task-form";
import { Layout } from "@/components/layout";
import { WeeklyChart } from "@/components/weekly-chart";
import { Sparkles } from "lucide-react";

export function TodayPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  
  const { data: tasks, isLoading: tasksLoading } = useListTasks(
    { date: today }, 
    { query: { queryKey: getListTasksQueryKey({ date: today }) } }
  );

  const { data: summary } = useGetTaskSummary(
    { query: { queryKey: getGetTaskSummaryQueryKey() } }
  );

  return (
    <Layout>
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
          {format(new Date(), "EEEE, MMMM do")}
        </h1>
        {summary && (
          <div className="flex gap-6 text-muted-foreground">
            <span><strong className="text-foreground">{summary.todayCompleted}</strong> completed</span>
            <span><strong className="text-foreground">{summary.todayTotal - summary.todayCompleted}</strong> remaining</span>
          </div>
        )}
      </header>

      <WeeklyChart />

      <section className="mb-10">
        <TaskForm defaultDate={today} />
      </section>

      <section className="flex flex-col gap-4">
        {tasksLoading ? (
          <div className="animate-pulse flex flex-col gap-4">
            {[1, 2, 3].map(i => (
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
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif mb-2">A fresh page</h3>
            <p className="text-muted-foreground max-w-sm">
              Your day is clear. Add a task above to start planning your day.
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
}
