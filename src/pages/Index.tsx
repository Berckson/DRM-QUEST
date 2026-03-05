import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { HistorySidebar } from '@/components/HistorySidebar';
import { GeneratorForm } from '@/components/GeneratorForm';
import { ActivityPreview } from '@/components/ActivityPreview';
import { AuthPage } from '@/components/AuthPage';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useAuth();
  const { activities, active, activeId, setActiveId, generateActivity, updateActivity, deleteActivity, loading: activitiesLoading } = useActivities(user?.id);
  const [isGenerating, setIsGenerating] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onSignIn={signInWithEmail} onSignUp={signUpWithEmail} onGoogleSignIn={signInWithGoogle} />;
  }

  const handleGenerate = async (data: {
    school: string;
    subject: string;
    teacher: string;
    topic: string;
    source: string;
    levels: { teoria: number; facil: number; media: number; dificil: number };
  }) => {
    setIsGenerating(true);
    await generateActivity(data);
    setIsGenerating(false);
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
          <header className="h-12 flex items-center justify-between border-b border-border px-4 bg-card shrink-0">
            <div className="flex items-center">
              <SidebarTrigger className="mr-3" />
              <span className="text-sm font-medium text-muted-foreground">LucsQuestions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-xs">
                <LogOut className="h-3.5 w-3.5" /> Sair
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 sm:p-8">
            {active ? (
              <ActivityPreview
                activity={active}
                onUpdate={updateActivity}
                onBack={handleNew}
              />
            ) : (
              <GeneratorForm onGenerate={handleGenerate} isLoading={isGenerating} />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
