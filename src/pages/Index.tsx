import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { HistorySidebar } from '@/components/HistorySidebar';
import { GeneratorForm } from '@/components/GeneratorForm';
import { TDPreview } from '@/components/TDPreview';
import { AuthPage } from '@/components/AuthPage';
import { ProfileSetupModal } from '@/components/ProfileSetupModal';
import { PixCheckoutModal } from '@/components/PixCheckoutModal';
import { AboutFeedback } from '@/components/AboutFeedback';
import { useTDs, type GenerateParams } from '@/hooks/useTDs';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LogOut, Sparkles, Clock3, ShieldCheck } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useAuth();
  const { profile, isAdmin, isTeacher, isPro, needsSetup, teacherPending, chooseRole, activatePro } = useProfile(user?.id);
  const { tds, active, activeId, setActiveId, generateTD, deleteTD, updateTD } = useTDs(user?.id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);

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

  const handleGenerate = async (params: GenerateParams) => {
    setIsGenerating(true);
    await generateTD(params);
    setIsGenerating(false);
  };

  const handleNew = () => setActiveId(null);

  const roleLabel = isAdmin ? 'Admin' : isTeacher ? 'Professor' : isPro ? 'Aluno PRO' : 'Aluno';

  return (
    <>
      <ProfileSetupModal open={needsSetup} userId={user.id} email={user.email ?? ''} onChoose={chooseRole} />
      <PixCheckoutModal open={pixOpen} onOpenChange={setPixOpen} onConfirmPayment={activatePro} />

      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <HistorySidebar tds={tds} activeId={activeId} onSelect={setActiveId} onDelete={deleteTD} onNew={handleNew} />

          <div className="flex-1 flex flex-col min-w-0">
            <header className="no-print h-12 flex items-center justify-between border-b border-border px-4 bg-card/80 backdrop-blur-md shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="mr-1" />
                <span className="text-sm font-semibold">DRM Quest</span>
                <Badge variant={isTeacher || isPro ? 'default' : 'secondary'} className="text-[10px]">
                  {roleLabel}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {!isTeacher && !isPro && (
                  <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => setPixOpen(true)}>
                    <Sparkles className="h-3.5 w-3.5" /> Seja PRO - R$ 24,99
                  </Button>
                )}
                {isAdmin && (
                  <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                    <Link to="/admin"><ShieldCheck className="h-3.5 w-3.5" /> Admin</Link>
                  </Button>
                )}
                <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-xs">
                  <LogOut className="h-3.5 w-3.5" /> Sair
                </Button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-12">
              {teacherPending && (
                <Card className="no-print glass-card max-w-2xl mx-auto p-4 flex items-start gap-3 border-warning/40">
                  <Clock3 className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong className="block">Acesso docente em análise</strong>
                    <span className="text-muted-foreground text-xs">
                      Recebemos sua identificação. Assim que a coordenação validar seus dados, as ferramentas de
                      professor serão liberadas automaticamente. Enquanto isso, você pode usar o modo aluno.
                    </span>
                  </div>
                </Card>
              )}

              {active ? (
                <TDPreview
                  td={active}
                  isTeacher={isTeacher}
                  isPro={isPro}
                  onUpdate={updateTD}
                  onBack={handleNew}
                  onUpgrade={() => setPixOpen(true)}
                />
              ) : (
                <>
                  <GeneratorForm
                    onGenerate={handleGenerate}
                    isLoading={isGenerating}
                    isTeacher={isTeacher}
                    isPro={isPro}
                    onUpgrade={() => setPixOpen(true)}
                  />
                  <div className="no-print">
                    <AboutFeedback userId={user.id} email={profile?.email ?? user.email ?? ''} />
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default Index;
