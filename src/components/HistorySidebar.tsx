import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookOpen, Trash2, Plus } from 'lucide-react';
import type { TD } from '@/types/td';
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
  tds: TD[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function HistorySidebar({ tds, activeId, onSelect, onDelete, onNew }: HistorySidebarProps) {
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border no-print">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary shrink-0" />
          <span className="font-serif text-lg font-bold text-foreground truncate">DRM Quest</span>
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
                {tds.length === 0 && (
                  <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                    Nenhuma atividade criada ainda.
                  </p>
                )}
                {tds.map((td) => (
                  <SidebarMenuItem key={td.id}>
                    <SidebarMenuButton
                      onClick={() => onSelect(td.id)}
                      isActive={activeId === td.id}
                      className="group justify-between pr-2"
                    >
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-sm font-medium truncate w-full">{td.topic}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(td.createdAt), 'dd/MM/yy', { locale: ptBR })} · {td.questionCount} questões
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(td.id);
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
        <p className="text-[10px] text-muted-foreground text-center">v2.0 — DRM Quest</p>
      </SidebarFooter>
    </Sidebar>
  );
}
