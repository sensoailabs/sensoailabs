import logotipo from '@/assets/logotipo.png';

export default function Logo() {
  return (
    <div className="flex items-center">
      <img 
        src={logotipo} 
        alt="Senso AI" 
        className="h-8 w-8 rounded-full object-cover"
      />
    </div>
  );
}