"use client"

import { useId, useState, useEffect, useCallback } from "react"
import { ImagePlusIcon, EyeIcon, EyeOffIcon, Loader2 } from "lucide-react"

// import { useCharacterLimit } from "@/hooks/use-character-limit"
import { useFileUpload } from "@/hooks/use-file-upload"
// import { useForm } from "@/hooks/useForm"
import { useGlobalNotification } from "@/contexts/NotificationContext"
import { validatePassword as validatePasswordUtil, validatePasswordConfirmation } from "@/utils/validation"
import { profileService } from "@/services/profileService"
import type { UserProfile } from "@/services/profileService"
import { EmailInput } from "@/components/ui/email-input"
import { PasswordInput } from "@/components/ui/password-input"
import { useUser } from "@/contexts/UserContext"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AvatarSkeleton, ProfileFormSkeleton, PasswordFormSkeleton } from "@/components/ui/profile-skeleton"

interface EditProfileDialogProps {
  children: React.ReactNode
}

function EditProfileDialog({ children }: EditProfileDialogProps) {
  const id = useId()
  const { refreshUserData } = useUser()
  const { showNotification } = useGlobalNotification()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    bio: ''
  })

  // Estados de erro para validação
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Função para validar campos em tempo real
  const validateFieldInput = useCallback((field: string, value: string) => {
    let error = ''
    
    switch (field) {
      case 'newPassword':
        if (value) {
          const validation = validatePasswordUtil(value)
          error = validation.isValid ? '' : validation.errors[0] || 'Senha inválida'
        }
        break
      case 'confirmPassword':
        error = validatePasswordConfirmation(formData.newPassword, value)
        break
      case 'currentPassword':
        // Se está tentando alterar senha, senha atual é obrigatória
        if ((formData.newPassword || formData.confirmPassword) && !value) {
          error = 'Digite sua senha atual para alterar a senha'
        }
        break
    }
    
    setErrors(prev => ({ ...prev, [field]: error }))
    return error === ''
  }, [formData.newPassword, formData.confirmPassword])

  // Função para atualizar dados do formulário
  const handleInputChangeForm = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  // const maxLength = 180
  // const { handleChange: handleBioChange } = useCharacterLimit({
  //   maxLength,
  //   initialValue: formData.bio,
  // })

  // Carregar dados do usuário quando o dialog abrir
  useEffect(() => {
    if (isOpen) {
      loadUserData()
    }
  }, [isOpen])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const userData = await profileService.getCurrentUser()
      if (userData) {
        setUser(userData)
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          bio: '' // Adicionar campo bio na tabela se necessário
        })
        // Limpar erros ao carregar dados
        setErrors({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
      showNotification({
        type: 'error',
        title: 'Erro ao carregar dados',
        message: 'Não foi possível carregar seus dados. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }



  // Função otimizada para salvar perfil
  const handleSave = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // Validações para alteração de senha usando utilitários centralizados
      if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
        // Se qualquer campo de senha foi preenchido, todos são obrigatórios
        if (!formData.currentPassword) {
          setErrors(prev => ({ ...prev, currentPassword: 'Digite sua senha atual para alterar a senha' }))
          showNotification({
            type: 'error',
            title: 'Senha atual obrigatória',
            message: 'Para alterar sua senha, você precisa informar a senha atual.'
          })
          return
        }
        
        if (!formData.newPassword) {
          setErrors(prev => ({ ...prev, newPassword: 'Digite a nova senha' }))
          showNotification({
            type: 'error',
            title: 'Nova senha obrigatória',
            message: 'Digite uma nova senha para continuar.'
          })
          return
        }
        
        if (!formData.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: 'Confirme a nova senha' }))
          showNotification({
            type: 'error',
            title: 'Confirmação obrigatória',
            message: 'Confirme sua nova senha para continuar.'
          })
          return
        }

        // Validar nova senha usando utilitário centralizado
        const passwordValidation = validatePasswordUtil(formData.newPassword)
        if (!passwordValidation.isValid) {
          setErrors(prev => ({ ...prev, newPassword: passwordValidation.errors[0] || 'Senha inválida' }))
          showNotification({
            type: 'error',
            title: 'Senha inválida',
            message: passwordValidation.errors[0] || 'A nova senha não atende aos critérios de segurança.'
          })
          return
        }
        
        // Validar confirmação de senha
        const confirmError = validatePasswordConfirmation(formData.newPassword, formData.confirmPassword)
        if (confirmError) {
          setErrors(prev => ({ ...prev, confirmPassword: confirmError }))
          showNotification({
            type: 'error',
            title: 'Senhas não coincidem',
            message: 'A confirmação da senha não confere com a nova senha.'
          })
          return
        }

        // Verificar se a nova senha é diferente da atual
        if (formData.newPassword === formData.currentPassword) {
          setErrors(prev => ({ ...prev, newPassword: 'A nova senha deve ser diferente da senha atual' }))
          showNotification({
            type: 'error',
            title: 'Senha igual à atual',
            message: 'A nova senha deve ser diferente da sua senha atual.'
          })
          return
        }
      }

      // Controlar quais atualizações foram feitas
      let updatedItems: string[] = []

      // Atualizar dados básicos do perfil
      const profileUpdates: any = {}
      if (formData.name !== user.name) {
        profileUpdates.name = formData.name
        updatedItems.push('nome')
      }
      if (formData.email !== user.email) {
        profileUpdates.email = formData.email
        updatedItems.push('email')
      }

      // Se há uma nova foto selecionada, fazer upload primeiro
      if (selectedFile) {
        const photoUrl = await profileService.uploadAvatar(selectedFile, user.id)
        if (photoUrl) {
          profileUpdates.photo_url = photoUrl
          updatedItems.push('foto do perfil')
        } else {
          showNotification({
            type: 'error',
            title: 'Erro no upload',
            message: 'Erro ao fazer upload da foto. Tente novamente.'
          })
          return
        }
      }

      if (Object.keys(profileUpdates).length > 0) {
        await profileService.updateProfile(user.id, profileUpdates)
      }

      // Alterar senha se todos os campos foram preenchidos
      if (formData.newPassword && formData.currentPassword && formData.confirmPassword) {
        try {
          await profileService.changePassword(user.id, {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword
          })
          updatedItems.push('senha')
        } catch (err: any) {
          const message = (err && err.message) ? String(err.message) : 'Erro ao alterar senha'
          if (message.toLowerCase().includes('senha atual incorreta')) {
            setErrors(prev => ({ ...prev, currentPassword: 'Senha atual incorreta' }))
            showNotification({
              type: 'error',
              title: 'Senha atual incorreta',
              message: 'A senha atual digitada não confere. Tente novamente.'
            })
            setLoading(false)
            return
          }
          // Outros erros
          showNotification({
            type: 'error',
            title: 'Erro ao alterar senha',
            message: message
          })
          setLoading(false)
          return
        }
      }

      // Mostrar notificação específica baseada no que foi atualizado
      if (updatedItems.length > 0) {
        const itemsText = updatedItems.length === 1 
          ? updatedItems[0] 
          : updatedItems.slice(0, -1).join(', ') + ' e ' + updatedItems[updatedItems.length - 1]
        
        showNotification({
          type: 'success',
          title: 'Perfil atualizado!',
          message: `Seu ${itemsText} foi atualizado com sucesso.`
        })
      } else {
        showNotification({
          type: 'success',
          title: 'Tudo certo!',
          message: 'Nenhuma alteração foi detectada.'
        })
      }
      // Atualizar dados no contexto
      await refreshUserData()
      setSelectedFile(null) // Limpar arquivo selecionado
      // Limpar campos de senha e erros
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
      setErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      showNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao atualizar perfil. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }, [user, formData, selectedFile, refreshUserData, showNotification])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg rounded-xl [&>button:last-child]:top-3.5">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 text-base">
            Meu perfil
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Faça alterações no seu perfil aqui. Você pode alterar sua foto e definir informações pessoais.
        </DialogDescription>
        <div className="overflow-y-auto">
          <div className="px-6 pt-6 pb-6">
            <Tabs defaultValue="profile" className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="grid w-80 grid-cols-2 rounded-full bg-muted p-1">
                  <TabsTrigger value="profile" className="rounded-full transition-all duration-300 ease-in-out data-[state=active]:bg-background data-[state=active]:shadow-sm">Editar perfil</TabsTrigger>
                  <TabsTrigger value="password" className="rounded-full transition-all duration-300 ease-in-out data-[state=active]:bg-background data-[state=active]:shadow-sm">Senha</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="profile" className="space-y-4 animate-in fade-in-50 duration-300">
                {loading ? (
                  <>
                    <div className="flex justify-center">
                      <AvatarSkeleton />
                    </div>
                    <ProfileFormSkeleton />
                  </>
                ) : (
                  <>
                    <div className="flex justify-center">
                        <Avatar 
                          user={user} 
                          onFileSelect={setSelectedFile}
                          selectedFile={selectedFile}
                        />
                     </div>
                    
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                      <div className="space-y-2">
                        <Label htmlFor={`${id}-name`}>Nome e sobrenome</Label>
                        <Input
                          id={`${id}-name`}
                          placeholder="Seu nome e sobrenome"
                          value={formData.name}
                          onChange={(e) => handleInputChangeForm('name', e.target.value)}
                          type="text"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2 pb-4">
                        <Label htmlFor={`${id}-email`}>Email</Label>
                        <EmailInput
                          id={`${id}-email`}
                          placeholder="usuario"
                          value={formData.email.replace('@sensoramadesign.com.br', '')}
                          onChange={(value) => handleInputChangeForm('email', value)}
                          disabled
                        />
                      </div>
                    </form>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="password" className="space-y-4 animate-in fade-in-50 duration-300">
                {loading ? (
                  <PasswordFormSkeleton />
                ) : (
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-3 pb-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${id}-current-password`}>Senha atual</Label>
                        <div className="relative">
                          <Input
                            id={`${id}-current-password`}
                            placeholder="Digite sua senha atual"
                            value={formData.currentPassword}
                            onChange={(e) => {
                              handleInputChangeForm('currentPassword', e.target.value)
                              validateFieldInput('currentPassword', e.target.value)
                            }}
                            type={showPassword ? "text" : "password"}
                            className={`pr-10 ${errors.currentPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <EyeIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        {errors.currentPassword && (
                          <p className="text-sm text-red-500">{errors.currentPassword}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <PasswordInput
                          id={`${id}-new-password`}
                          label="Nova senha"
                          placeholder="Digite sua nova senha"
                          value={formData.newPassword}
                          onChange={(value) => {
                            handleInputChangeForm('newPassword', value)
                            validateFieldInput('newPassword', value)
                          }}
                          error={errors.newPassword}
                          showStrengthIndicator={true}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${id}-confirm-password`}>Confirmar nova senha</Label>
                        <div className="relative">
                          <Input
                            id={`${id}-confirm-password`}
                            placeholder="Confirme sua nova senha"
                            value={formData.confirmPassword}
                            onChange={(e) => {
                              handleInputChangeForm('confirmPassword', e.target.value)
                              validateFieldInput('confirmPassword', e.target.value)
                            }}
                            type={showConfirmPassword ? "text" : "password"}
                            className={`pr-10 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <EyeIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading} className="rounded-full">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={loading} className="rounded-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
      

    </Dialog>
  )
}

function Avatar({ user, onFileSelect, selectedFile }: { 
  user: UserProfile | null
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
}) {
  const [, { openFileDialog, getInputProps }] = useFileUpload({
    accept: "image/*",
    initialFiles: [],
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const currentImage = previewImage || user?.photo_url || null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Criar preview imediato
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Passar arquivo para o componente pai
    onFileSelect(file)
  }

  // Limpar preview quando não há arquivo selecionado
  useEffect(() => {
    if (!selectedFile) {
      setPreviewImage(null)
    }
  }, [selectedFile])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="px-6 text-center">
      <div className="border-background bg-muted relative flex size-20 items-center justify-center overflow-hidden rounded-full border-4 shadow-xs shadow-black/10 mx-auto">
        {currentImage ? (
          <img
            src={currentImage}
            className="size-full object-cover"
            width={80}
            height={80}
            alt="Foto do perfil"
          />
        ) : (
          <div className="flex items-center justify-center size-full bg-primary text-primary-foreground text-lg font-medium">
            {user?.name ? getInitials(user.name) : 'U'}
          </div>
        )}
        <button
          type="button"
          className="focus-visible:border-ring focus-visible:ring-ring/50 absolute flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
          onClick={openFileDialog}
          aria-label="Alterar foto do perfil"
        >
          <ImagePlusIcon size={16} aria-hidden="true" />
        </button>
        <input
          {...getInputProps()}
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Enviar foto do perfil"
        />
      </div>
      
      {/* Nome do usuário */}
      <div className="mt-3">
        <h3 className="text-base font-medium text-foreground">
          {user?.name || 'Usuário'}
        </h3>
      </div>
      
      {/* Data de cadastro */}
      <div className="mt-1">
        <p className="text-sm text-muted-foreground">
          Membro desde {user?.created_at ? formatDate(user.created_at) : '--'}
        </p>
      </div>
    </div>
  )
}

export default EditProfileDialog
export { EditProfileDialog }