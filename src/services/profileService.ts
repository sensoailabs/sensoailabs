import { supabase } from '@/lib/supabase'
import { authService } from './authService'

export interface UserProfile {
  id: string
  name: string
  email: string
  profile?: string
  photo_url?: string
  created_at: string
  updated_at: string
  last_login?: string
  is_active: boolean
}

export interface UpdateUserProfile {
  name?: string
  email?: string
  photo_url?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

class ProfileService {
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      // Usar authService para obter dados completos do usuário
      const userData = await authService.getUserData()
      
      if (!userData) {
        return null
      }

      return userData as UserProfile
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error)
      return null
    }
  }

  async updateProfile(userId: string, updates: UpdateUserProfile): Promise<boolean> {
    try {
      // Obter dados do usuário para pegar o numeric_id
      const userData = await authService.getUserData();
      
      if (!userData || !userData.numeric_id) {
        console.error('Erro: numeric_id não encontrado para o usuário');
        return false;
      }

      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.numeric_id);

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
  }

  async uploadAvatar(file: File, userId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro ao fazer upload da imagem:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      return null;
    }
  }

  async changePassword(userId: string, passwordData: ChangePasswordData): Promise<void> {
    try {
      // Verificar senha atual reautenticando o usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error('Usuário não autenticado');
      }

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });

      if (reauthError) {
        throw new Error('Senha atual incorreta');
      }

      // Atualizar senha usando Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        console.error('Erro ao alterar senha:', updateError);
        throw new Error('Erro ao alterar senha');
      }

      // Obter dados do usuário para pegar o numeric_id
      const userData = await authService.getUserData();
      
      if (userData && userData.numeric_id) {
        // Atualizar timestamp na tabela users
        await supabase
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', userData.numeric_id);
      }

    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }
  }

  async deleteAvatar(userId: string): Promise<boolean> {
    try {
      // Obter dados do usuário para pegar o numeric_id
      const userData = await authService.getUserData();
      
      if (!userData || !userData.numeric_id) {
        console.error('Erro: numeric_id não encontrado para o usuário');
        return false;
      }

      // Buscar a URL atual da foto
      const { data: user } = await supabase
        .from('users')
        .select('photo_url')
        .eq('id', userData.numeric_id)
        .single();

      if (user?.photo_url) {
        // Extrair o caminho do arquivo da URL
        const url = new URL(user.photo_url);
        const filePath = url.pathname.split('/storage/v1/object/public/avatars/')[1];
        
        if (filePath) {
          await supabase.storage
            .from('avatars')
            .remove([`avatars/${filePath}`]);
        }
      }

      // Remover a URL da foto do banco
      const { error } = await supabase
        .from('users')
        .update({ 
          photo_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.numeric_id);

      if (error) {
        console.error('Erro ao remover foto do perfil:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar avatar:', error);
      return false;
    }
  }
}

export const profileService = new ProfileService();