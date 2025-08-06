import { Skeleton } from "./skeleton"

// Skeleton para o avatar
export function AvatarSkeleton() {
  return (
    <div className="px-6 text-center">
      <div className="mx-auto">
        <Skeleton className="h-20 w-20 rounded-full mx-auto" />
      </div>
      
      {/* Nome do usuário */}
      <div className="mt-3">
        <Skeleton className="h-5 w-32 mx-auto" />
      </div>
      
      {/* Data de cadastro */}
      <div className="mt-1">
        <Skeleton className="h-4 w-28 mx-auto" />
      </div>
    </div>
  )
}

// Skeleton para formulário de perfil
export function ProfileFormSkeleton() {
  return (
    <div className="space-y-4">
      {/* Campo Nome */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      {/* Campo Email */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

// Skeleton para formulário de senha
export function PasswordFormSkeleton() {
  return (
    <div className="space-y-4">
      {/* Senha atual */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      {/* Nova senha */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
        {/* Indicador de força da senha */}
        <div className="space-y-2">
          <Skeleton className="h-2 w-full" />
          <div className="flex space-x-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
      
      {/* Confirmar senha */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

// Skeleton completo para o modal
export function EditProfileSkeleton() {
  return (
    <div className="px-6 pt-6 pb-6">
      {/* Tabs skeleton */}
      <div className="flex justify-center mb-6">
        <Skeleton className="h-10 w-80 rounded-full" />
      </div>
      
      {/* Avatar skeleton */}
      <div className="flex justify-center mb-6">
        <AvatarSkeleton />
      </div>
      
      {/* Form skeleton */}
      <ProfileFormSkeleton />
    </div>
  )
}