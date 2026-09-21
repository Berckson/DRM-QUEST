import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { HistorySidebar } from '@/components/HistorySidebar';
import { GeneratorForm } from '@/components/GeneratorForm';
import { TDPreview } from '@/components/TDPreview';
import { AuthPage } from '@/components/AuthPage';
import { ProfileSetupModal } from '@/components/ProfileSetupModal';
import { PixCheckoutModal } from '@/components/PixCheckoutModal';
import { AboutFeedback } from '@/components/AboutFeedback';
import { EnemSimulados } from '@/components/EnemSimulados';
import { ExamMode } from '@/components/ExamMode';
import { RedacaoPanel } from '@/components/RedacaoPanel';
import { useTDs, type GenerateParams } from '@/hooks/useTDs';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useProRequest } from '@/hooks/useProRequest';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LogOut, Sparkles, Clock3, ShieldCheck, Wand2, GraduationCap, PenLine } from 'lucide-react';
import type { TD, EnemArea } from '@/types/td';

const Index = () => {
  const { user, loading: authLoading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useAuth();
  const { profile, isAdmin, isTeacher, isPro, needsSetup, teacherPending, chooseRole } = useProfile(user?.id);
  const { tds, active, activeId, setActiveId, generateTD, deleteTD, updateTD } = useTDs(user?.id);
  const { request: proRequest, submit: submitProRequest } = useProRequest(user?.id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [tab, setTab] = useState('gerador');
  const [examTd, setExamTd] = useState<TD | null>(null);
  const [loadingAreaId, setLoadingAreaId] = useState<string | null>(null);

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

  const handleNew = () => {
    setActiveId(null);
    setExamTd(null);
  };

  const handleRequestPro = async (pixKey: string) =>
    submitProRequest({
      fullName: profile?.full_name ?? user.email ?? 'Aluno',
      email: profile?.email ?? user.email ?? '',
      pixKey,
    });

  const handleStartExam = async (area: EnemArea, count: number) => {
    setLoadingAreaId(area.id);
    const td = await generateTD({
      topic: area.topic,
      source: 'Vestibulares Reais/ENEM',
      mode: 'web',
      questionCount: count,
      difficultyFocus: 'mixed',
      subject: area.title,
      teacher: '',
      school: '',
      className: '',
      answerKeyMode: 'simple',
      authorRole: 'Aluno',
    });
    setLoadingAreaId(null);
    if (td) {
      setActiveId(null);
      setExamTd(td);
    }
  };

  const roleLabel = isAdmin ? 'Admin' : isTeacher ? 'Professor' : isPro ? 'Aluno PRO' : 'Aluno';

  return (
    <>
      <ProfileSetupModal open={needsSetup} userId={user.id} email={user.email ?? ''} onChoose={chooseRole} />
      <PixCheckoutModal
        open={pixOpen}
        onOpenChange={setPixOpen}
        onRequestPro={handleRequestPro}
        request={proRequest}
      />

      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <HistorySidebar tds={tds} activeId={activeId} onSelect={(id) => { setExamTd(null); setActiveId(id); }} onDelete={deleteTD} onNew={handleNew} />

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
                    <Sparkles className="h-3.5 w-3.5" />
                    {proRequest?.status === 'PENDENTE' ? 'PRO em análise' : 'Seja PRO - R$ 24,99'}
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

              {!isTeacher && proRequest?.status === 'PENDENTE' && (
                <Card className="no-print glass-card max-w-2xl mx-auto p-4 flex items-start gap-3 border-warning/40">
                  <Clock3 className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong className="block">Pagamento PRO aguardando confirmação</strong>
                    <span className="text-muted-foreground text-xs">
                      A administração está conferindo seu Pix. Assim que for aprovado, o acesso PRO aparece
                      automaticamente nesta conta.
                    </span>
                  </div>
                </Card>
              )}

              {examTd ? (
                <ExamMode
                  td={examTd}
                  isPro={isPro}
                  onExit={() => setExamTd(null)}
                  onUpgrade={() => setPixOpen(true)}
                />
              ) : active ? (
                <TDPreview
                  td={active}
                  isTeacher={isTeacher}
                  isPro={isPro}
                  onUpdate={updateTD}
                  onBack={handleNew}
                  onUpgrade={() => setPixOpen(true)}
                />
              ) : isTeacher ? (
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
              ) : (
                <Tabs value={tab} onValueChange={setTab} className="space-y-8">
                  <TabsList className="mx-auto grid w-full max-w-lg grid-cols-3">
                    <TabsTrigger value="gerador" className="gap-1.5 text-xs sm:text-sm">
                      <Wand2 className="h-3.5 w-3.5" /> Gerador
                    </TabsTrigger>
                    <TabsTrigger value="simulados" className="gap-1.5 text-xs sm:text-sm">
                      <GraduationCap className="h-3.5 w-3.5" /> Simulados ENEM
                    </TabsTrigger>
                    <TabsTrigger value="redacao" className="gap-1.5 text-xs sm:text-sm">
                      <PenLine className="h-3.5 w-3.5" /> Redação
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="gerador" className="space-y-12 mt-0">
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
                  </TabsContent>

                  <TabsContent value="simulados" className="mt-0">
                    <EnemSimulados
                      isPro={isPro}
                      isLoading={!!loadingAreaId}
                      loadingAreaId={loadingAreaId}
                      onStart={handleStartExam}
                      onUpgrade={() => setPixOpen(true)}
                    />
                  </TabsContent>

                  <TabsContent value="redacao" className="mt-0">
                    <RedacaoPanel />
                  </TabsContent>
                </Tabs>
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default Index;
