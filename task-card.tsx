import { useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useUpdateTask, 
  getListTasksQueryKey, 
  getGetTaskSummaryQueryKey 
} from "@workspace/api-client-react";
import type { Task } from "@workspace/api-client-react";
import { CheckCircle2, Circle, Calendar } from "lucide-react";
import { TaskDetailsDialog } from "./task-details-dialog";

export function TaskCard({ task }: { task: Task }) {
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening details
    updateTask.mutate(
      { id: task.id, data: { completed: !task.completed } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTaskSummaryQueryKey() });
        }
      }
    );
  };

  return (
    <>
      <div 
        onClick={() => setDetailsOpen(true)}
        className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
          task.completed 
            ? "bg-muted/50 border-transparent opacity-60 hover:opacity-80" 
            : "bg-card border-border shadow-sm hover:shadow-md hover:border-primary/30"
        }`}
      >
        <button 
          onClick={handleToggle}
          className="mt-0.5 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
        >
          {task.completed ? (
            <CheckCircle2 className="w-6 h-6 text-primary" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-medium transition-all ${
            task.completed ? "text-muted-foreground line-through" : "text-foreground"
          }`}>
            {task.title}
          </h3>
          
          {(task.notes || task.date || task.priority) && (
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {task.date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(task.date), "MMM d")}
                </span>
              )}
              {task.priority && (
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                  task.priority === "high" ? "bg-destructive/10 text-destructive" :
                  task.priority === "medium" ? "bg-orange-500/10 text-orange-600" :
                  "bg-secondary/10 text-secondary"
                }`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              )}
              {task.notes && (
                <span className="line-clamp-1 max-w-[200px] truncate">{task.notes}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <TaskDetailsDialog 
        taskId={task.id} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
      />
    </>
  );
}
