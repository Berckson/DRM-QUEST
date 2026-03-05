import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookOpen, Trash2, Plus } from 'lucide-react';
import { Activity } from '@/hooks/useActivities';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HistorySidebarProps {
  activities: Activity[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function HistorySidebar({ activities, activeId, onSelect, onDelete, onNew }: HistorySidebarProps) {
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary shrink-0" />
          <span className="font-serif text-lg font-bold text-foreground truncate">LucsQuestions</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="p-3">
          <Button onClick={onNew} className="w-full gap-2" size="sm">
            <Plus className="h-4 w-4" />
            <span>Nova Atividade</span>
          </Button>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4">
            Histórico
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <SidebarMenu>
                {activities.length === 0 && (
                  <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                    Nenhuma atividade criada ainda.
                  </p>
                )}
                {activities.map((activity) => (
                  <SidebarMenuItem key={activity.id}>
                    <SidebarMenuButton
                      onClick={() => onSelect(activity.id)}
                      isActive={activeId === activity.id}
                      className="group justify-between pr-2"
                    >
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-sm font-medium truncate w-full">
                          {activity.topic}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), "dd/MM/yy", { locale: ptBR })}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(activity.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground text-center">
          v1.0 — Para professores
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
