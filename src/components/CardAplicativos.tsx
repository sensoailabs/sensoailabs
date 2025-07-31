import type { LucideIcon } from 'lucide-react';

interface Tag {
  label: string;
  type: 'primary' | 'secondary';
}

interface CardAplicativosProps {
  icon: LucideIcon;
  iconBgColor?: string;
  categoria: string;
  categoriaColor?: string;
  titulo: string;
  descricao: string;
  tags: Tag[];
  tagsExtras?: number;
  imagemSrc?: string;
  imagemAlt?: string;
  backgroundGradient?: string;
  tagsPrimaryColor?: string;
  tagsPrimaryBgColor?: string;
}

export function CardAplicativos({
  icon: Icon,
  iconBgColor = '#4E67FF',
  categoria,
  categoriaColor = '#4E67FF',
  titulo,
  descricao,
  tags,
  tagsExtras = 0,
  imagemSrc,
  imagemAlt,
  backgroundGradient,
  tagsPrimaryColor,
  tagsPrimaryBgColor
}: CardAplicativosProps) {
  // Define cores das tags baseadas na categoria se não fornecidas
  const primaryTagColor = tagsPrimaryColor || categoriaColor;
  const primaryTagBgColor = tagsPrimaryBgColor || `${categoriaColor}20`; // 20% de opacidade
  
  // Define gradiente baseado na cor da categoria se não fornecido
  const defaultGradient = `linear-gradient(180deg, #FFF 62.85%, ${categoriaColor}15 100%)`;
  const cardBackground = backgroundGradient || defaultGradient;

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden w-full max-w-[296px]">
      <div className="p-5">
        {/* Ícone e Categoria */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: iconBgColor }}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-semibold" style={{ color: categoriaColor }}>
            {categoria.toUpperCase()}
          </span>
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
              className="px-3 py-1 text-[10px] font-semibold rounded-[6px] flex-shrink-0"
              style={tag.type === 'primary' ? {
                backgroundColor: primaryTagBgColor,
                color: primaryTagColor
              } : {
                backgroundColor: '#f3f4f6',
                color: '#6b7280'
              }}
            >
              {tag.label}
            </span>
          ))}
          {tagsExtras > 0 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-[6px] flex-shrink-0">
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