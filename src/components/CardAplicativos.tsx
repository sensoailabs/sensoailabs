import type { LucideIcon } from 'lucide-react';

interface Tag {
  label: string;
  type: 'primary' | 'secondary';
}

interface CardAplicativosProps {
  icon?: LucideIcon;
  iconSrc?: string;
  iconBgColor?: string;
  titulo: string;
  descricao: string;
  tags: Tag[];
  tagsExtras?: number;
  imagemSrc?: string;
  imagemAlt?: string;
}

export function CardAplicativos({
  icon: Icon,
  iconSrc,
  iconBgColor = '#4E67FF',
  titulo,
  descricao,
  tags,
  tagsExtras = 0,
  imagemSrc,
  imagemAlt
}: CardAplicativosProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden w-full max-w-[296px]">
      <div className="p-5">
        {/* Ícone */}
        <div className="flex justify-start mb-4">
          <div className="w-[60px] h-[60px] rounded-lg flex items-center justify-center overflow-hidden">
            {iconSrc ? (
              <img 
                src={iconSrc} 
                alt="App Icon" 
                className="w-full h-full object-cover"
              />
            ) : Icon ? (
              <div className="w-full h-full rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBgColor }}>
                <Icon className="w-8 h-8 text-white" />
              </div>
            ) : null}
          </div>
        </div>
        
        {/* Título */}
        <h3 className="text-[16px] font-bold text-black mb-2">
          {titulo}
        </h3>
        
        {/* Descrição */}
        <p className="text-[12px] text-[#818181] mb-4 line-clamp-2">
          {descricao}
        </p>
        
        {/* Tags */}
        <div className="flex gap-1 overflow-x-auto whitespace-nowrap pb-0 hide-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {tags.map((tag, index) => (
          <span 
            key={index}
            className="px-3 py-1 text-[11px] font-semibold rounded-[6px] flex-shrink-0 bg-gray-100 text-gray-600"
          >
            {tag.label}
          </span>
          ))}
          {tagsExtras > 0 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-[6px] flex-shrink-0">
              +{tagsExtras}
            </span>
          )}
        </div>
        
        {/* Imagem */}
        {imagemSrc && (
          <img 
            src={imagemSrc} 
            alt={imagemAlt || titulo} 
            className="w-full object-cover mt-4" 
          />
        )}
      </div>
    </div>
  );
}