import logoSensoAI from '@/assets/logo_sensoai.svg';

export default function Logo() {
  return (
    <div className="flex items-center">
      <img 
        src={logoSensoAI} 
        alt="Senso AI" 
        className="h-8 w-auto"
      />
    </div>
  );
}