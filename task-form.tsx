import { useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateTask, 
  getListTasksQueryKey, 
  getGetTaskSummaryQueryKey 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function TaskForm({ defaultDate }: { defaultDate?: string }) {
  const [title, setTitle] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createTask = useCreateTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask.mutate(
      { 
        data: { 
          title: title.trim(), 
          date: defaultDate || format(new Date(), "yyyy-MM-dd"),
          priority: "medium"
        } 
      },
      {
        onSuccess: () => {
          setTitle("");
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTaskSummaryQueryKey() });
          toast({
            title: "Task created",
            description: "Your task has been added to the planner.",
          });
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="w-full pl-6 pr-14 py-4 rounded-2xl border-2 border-transparent bg-card text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all text-lg"
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={!title.trim() || createTask.isPending}
        className="absolute right-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="w-5 h-5" />
      </Button>
    </form>
  );
}
