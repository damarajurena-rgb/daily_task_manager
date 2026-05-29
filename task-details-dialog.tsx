import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetTask,
  getGetTaskQueryKey,
  useUpdateTask, 
  useDeleteTask, 
  getListTasksQueryKey, 
  getGetTaskSummaryQueryKey 
} from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, Tag, FileText } from "lucide-react";

export function TaskDetailsDialog({ 
  taskId, 
  open, 
  onOpenChange 
}: { 
  taskId: number | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const { data: task, isLoading } = useGetTask(
    taskId!,
    { query: { enabled: !!taskId && open, queryKey: getGetTaskQueryKey(taskId!) } }
  );

  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  // Sync state when task is loaded
  useEffect(() => {
    if (task) {
      setNotes(task.notes || "");
      setPriority(task.priority || "medium");
    }
  }, [task]);

  const handleUpdate = () => {
    if (!taskId) return;
    updateTask.mutate(
      { id: taskId, data: { notes, priority } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTaskSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
          onOpenChange(false);
        }
      }
    );
  };

  const handleDelete = () => {
    if (!taskId) return;
    deleteTask.mutate(
      { id: taskId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTaskSummaryQueryKey() });
          onOpenChange(false);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-card rounded-2xl border border-border shadow-xl">
        {isLoading || !task ? (
          <div className="py-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-serif text-foreground flex items-start gap-2">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  task.priority === "high" ? "bg-destructive" :
                  task.priority === "medium" ? "bg-orange-500" :
                  "bg-secondary"
                }`} />
                {task.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-1.5 text-muted-foreground mt-2">
                <Calendar className="w-4 h-4" />
                {task.date ? format(new Date(task.date), "EEEE, MMMM do, yyyy") : "No date"}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-6 py-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" /> Priority
                </label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        priority === p 
                          ? p === "high" ? "bg-destructive/10 border-destructive/30 text-destructive" :
                            p === "medium" ? "bg-orange-500/10 border-orange-500/30 text-orange-600" :
                            "bg-secondary/10 border-secondary/30 text-secondary"
                          : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" /> Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add some details..."
                  className="w-full min-h-[120px] p-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <Button 
                variant="ghost" 
                onClick={handleDelete}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-3"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleUpdate} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                  Save Changes
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
