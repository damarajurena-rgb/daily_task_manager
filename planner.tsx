import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { 
  useListTasks, 
  getListTasksQueryKey 
} from "@workspace/api-client-react";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "@/components/task-form";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

export function PlannerPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  
  const { data: tasks, isLoading } = useListTasks(
    { date: dateStr }, 
    { query: { queryKey: getListTasksQueryKey({ date: dateStr }) } }
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setSelectedDate(prev => subDays(prev, 1))}
            className="rounded-xl border-border hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center min-w-[200px]">
            <h1 className="text-2xl font-serif">{format(selectedDate, "MMMM do, yyyy")}</h1>
            <span className="text-sm text-muted-foreground">{format(selectedDate, "EEEE")}</span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setSelectedDate(prev => addDays(prev, 1))}
            className="rounded-xl border-border hover:bg-muted"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        
        <Button 
          variant="secondary" 
          onClick={() => setSelectedDate(new Date())}
          className="rounded-xl"
        >
          Go to Today
        </Button>
      </div>

      <section className="mb-10">
        <TaskForm defaultDate={dateStr} />
      </section>

      <section className="flex flex-col gap-4">
        {isLoading ? (
          <div className="animate-pulse flex flex-col gap-4">
            {[1, 2].map(i => (
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
            <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif mb-2">No tasks planned</h3>
            <p className="text-muted-foreground max-w-sm">
              Enjoy the space or add something new for this day.
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
}
