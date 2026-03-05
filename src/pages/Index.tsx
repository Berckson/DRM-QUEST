import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { HistorySidebar } from '@/components/HistorySidebar';
import { GeneratorForm } from '@/components/GeneratorForm';
import { ActivityPreview } from '@/components/ActivityPreview';
import { useActivities } from '@/hooks/useActivities';
import { generateActivity } from '@/lib/mockGenerator';

const Index = () => {
  const { activities, active, activeId, setActiveId, addActivity, updateActivity, deleteActivity } = useActivities();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = (data: {
    school: string;
    subject: string;
    teacher: string;
    topic: string;
    source: string;
    levels: { teoria: number; facil: number; media: number; dificil: number };
  }) => {
    setIsLoading(true);
    // Simulate generation delay
    setTimeout(() => {
      const activity = generateActivity(
        data.school, data.subject, data.teacher,
        data.topic, data.source, data.levels
      );
      addActivity(activity);
      setIsLoading(false);
    }, 800);
  };

  const handleNew = () => setActiveId(null);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <HistorySidebar
          activities={activities}
          activeId={activeId}
          onSelect={setActiveId}
          onDelete={deleteActivity}
          onNew={handleNew}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-4 bg-card shrink-0">
            <SidebarTrigger className="mr-3" />
            <span className="text-sm font-medium text-muted-foreground">LucsQuestions</span>
          </header>

          <main className="flex-1 overflow-y-auto p-6 sm:p-8">
            {active ? (
              <ActivityPreview
                activity={active}
                onUpdate={updateActivity}
                onBack={handleNew}
              />
            ) : (
              <GeneratorForm onGenerate={handleGenerate} isLoading={isLoading} />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
