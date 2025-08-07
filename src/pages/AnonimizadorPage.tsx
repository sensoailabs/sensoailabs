import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import backgroundImage from '@/assets/background.png';
// import iconAppAnonimizador from '@/assets/_icons-modulos/icon-app-anonimizador.png';
import onDevImage from '@/assets/_banners/on-dev.png';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AnonimizadorPage() {
  const [open, setOpen] = useState(false);
  const step = 1;
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(true);
  }, []);

  const stepContent = [
    {
      title: 'Bem-vindo ao Anonimizador',
      description:
        'Este módulo está em desenvolvimento. Em breve você poderá anonimizar dados sensíveis em telas e documentos de forma simples e segura.',
    },
  ];

  const totalSteps = stepContent.length;

  // Mantido para futura expansão do onboarding com múltiplos passos
  // function handleContinue() {
  //   if (step < totalSteps) {
  //     setStep(step + 1);
  //   }
  // }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background com imagem - cobrindo toda a tela */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-40 z-0"
        style={{backgroundImage: `url(${backgroundImage})`}}
      >
        {/* Overlay com efeito vidro */}
        <div className="absolute inset-0 bg-[#D9D9D9]/15 backdrop-blur-[12px]"></div>
      </div>

      <Header />


      {/* Onboarding Modal */}
      <Dialog open={open}>
        <DialogContent
          className="gap-0 p-0 [&>button:last-child]:hidden"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="p-2">
            <img
              className="w-full rounded-md"
              src={onDevImage}
              width={382}
              height={216}
              alt="Em desenvolvimento"
            />
          </div>
          <div className="space-y-6 px-6 pt-3 pb-6">
            <DialogHeader>
              <DialogTitle>{stepContent[step - 1].title}</DialogTitle>
              <DialogDescription>
                {stepContent[step - 1].description}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex justify-center space-x-1.5 max-sm:order-1">
                {[...Array(totalSteps)].map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'bg-primary size-1.5 rounded-full',
                      index + 1 === step ? 'bg-primary' : 'opacity-20'
                    )}
                  />
                ))}
              </div>
              <DialogFooter>
                {step < totalSteps ? null : (
                  <Button className="group" type="button" onClick={() => navigate('/home')}>
                    Voltar para a página inicial
                    <ArrowRightIcon
                      className="-me-1 opacity-60 transition-transform group-hover:translate-x-0.5"
                      size={16}
                      aria-hidden="true"
                    />
                  </Button>
                )}
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


