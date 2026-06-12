import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { HistorySidebar } from '@/components/HistorySidebar';
import { GeneratorForm } from '@/components/GeneratorForm';
import { TDPreview } from '@/components/TDPreview';
import { AuthPage } from '@/components/AuthPage';
import { ProfileSetupModal } from '@/components/ProfileSetupModal';
import { useTDs, type GenerateParams } from '@/hooks/useTDs';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useAuth();
  const { profile, loading: profileLoading, selectRole } = useProfile(user?.id);
  const { tds, active, activeId, setActiveId, generateTD, deleteTD, updateTD } = useTDs(user?.id);
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

  const needsRole = !profileLoading && (!profile || !profile.role);
  const role = profile?.role ?? 'Aluno';

  const handleGenerate = async (params: GenerateParams) => {
    setIsGenerating(true);
    await generateTD(params);
    setIsGenerating(false);
  };

  const handleNew = () => setActiveId(null);

  return (
    <>
      <ProfileSetupModal open={needsRole} onSelect={selectRole} />
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <HistorySidebar
            tds={tds}
            activeId={activeId}
            onSelect={setActiveId}
            onDelete={deleteTD}
            onNew={handleNew}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <header className="no-print h-12 flex items-center justify-between border-b border-border px-4 bg-card shrink-0">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="mr-1" />
                <span className="text-sm font-medium text-muted-foreground">LucsQuestions</span>
                {profile?.role && (
                  <Badge variant={role === 'Professor' ? 'default' : 'secondary'} className="text-[10px]">
                    {role}
                  </Badge>
                )}
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
                <TDPreview td={active} onUpdate={updateTD} onBack={handleNew} />
              ) : (
                <GeneratorForm onGenerate={handleGenerate} isLoading={isGenerating} role={role} />
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default Index;
