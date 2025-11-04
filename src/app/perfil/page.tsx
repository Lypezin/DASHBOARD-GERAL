'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  avatar_url?: string | null;
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase.rpc('get_current_user_profile') as { data: UserProfile | null; error: any };
      
      if (profileError) throw profileError;

      if (!profile?.is_approved) {
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      setUser(profile);
      
      // Buscar avatar_url da tabela de perfil se existir
      if (profile?.id) {
        try {
          const { data: profileData, error: profileDataError } = await supabase
            .from('user_profiles')
            .select('avatar_url')
            .eq('id', profile.id)
            .single();
          
          // Se não houver erro e tiver avatar_url, usar
          if (!profileDataError && profileData?.avatar_url) {
            setUser(prev => prev ? { ...prev, avatar_url: profileData.avatar_url } : null);
            setPreviewUrl(profileData.avatar_url);
          } else if (profileDataError) {
            // Se der erro 400 ou a tabela não existir, apenas logar (não é crítico)
            console.warn('Não foi possível buscar avatar_url:', profileDataError);
            // Não definir erro aqui, pois o perfil pode não ter foto ainda
          }
        } catch (err) {
          // Ignorar erros ao buscar avatar_url (pode ser que a tabela não exista ainda)
          console.warn('Erro ao buscar avatar_url:', err);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setError('Erro ao carregar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user) {
      setError('Por favor, selecione uma imagem.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Usuário não autenticado');

      // Remover foto antiga se existir
      if (user.avatar_url) {
        try {
          let oldFilePath = '';
          if (user.avatar_url.includes('/avatars/')) {
            const urlParts = user.avatar_url.split('/avatars/');
            if (urlParts.length > 1) {
              // O caminho dentro do bucket não deve incluir "avatars/"
              // A URL completa é: .../storage/v1/object/public/avatars/{user_id}/{filename}
              // Então precisamos apenas de {user_id}/{filename}
              oldFilePath = urlParts[1];
            }
          } else {
            // Se não conseguir extrair, tentar extrair o nome do arquivo da URL
            const urlParts = user.avatar_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            // Se não tiver o user_id no caminho, usar o ID do usuário atual
            oldFilePath = `${authUser.id}/${fileName}`;
          }
          
          if (oldFilePath) {
            await supabase.storage
              .from('avatars')
              .remove([oldFilePath]);
          }
        } catch (err) {
          // Continuar mesmo se não conseguir remover a foto antiga
          console.warn('Não foi possível remover foto antiga:', err);
        }
      }

      // Criar nome único para o arquivo
      // IMPORTANTE: Quando usamos .from('avatars'), o caminho NÃO deve incluir "avatars/"
      // Estrutura: {user_id}/{timestamp}.{ext}
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${authUser.id}/${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
          throw new Error('O bucket "avatars" não existe no Supabase Storage. Por favor, crie o bucket seguindo as instruções no arquivo CRIAR_PERFIL_FOTO.sql');
        }
        throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`);
      }

      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar perfil do usuário
      // Primeiro, verificar se a tabela user_profiles existe e tem a coluna avatar_url
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authUser.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (updateError) {
        // Se não conseguir atualizar na tabela, tentar atualizar via RPC
        const { error: rpcError } = await supabase.rpc('update_user_avatar', {
          p_user_id: authUser.id,
          p_avatar_url: publicUrl
        });

        if (rpcError) {
          console.warn('Erro ao atualizar avatar via RPC:', rpcError);
          // Mesmo assim, atualizar o estado local para mostrar a imagem
          setUser(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
          setSuccess('Foto atualizada com sucesso! (Nota: pode levar alguns minutos para aparecer em todos os lugares)');
        } else {
          setSuccess('Foto atualizada com sucesso!');
          setUser(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
          setPreviewUrl(publicUrl);
        }
      } else {
        setSuccess('Foto atualizada com sucesso!');
        setUser(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
        setPreviewUrl(publicUrl);
      }

      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Erro ao fazer upload:', err);
      setError(err.message || 'Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.avatar_url) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Usuário não autenticado');

      // Extrair caminho do arquivo da URL
      // A URL pode estar em diferentes formatos, então vamos tentar extrair o caminho
      // IMPORTANTE: Quando usamos .from('avatars'), o caminho NÃO deve incluir "avatars/"
      let filePath = '';
      if (user.avatar_url.includes('/avatars/')) {
        const urlParts = user.avatar_url.split('/avatars/');
        if (urlParts.length > 1) {
          // O caminho dentro do bucket não deve incluir "avatars/"
          filePath = urlParts[1];
        }
      } else {
        // Se não conseguir extrair, tentar extrair o nome do arquivo da URL
        const urlParts = user.avatar_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        // Se não tiver o user_id no caminho, usar o ID do usuário atual
        filePath = `${authUser.id}/${fileName}`;
      }

      // Remover do storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) {
        console.warn('Erro ao remover arquivo do storage:', deleteError);
      }

      // Atualizar perfil
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authUser.id,
          avatar_url: null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (updateError) {
        const { error: rpcError } = await supabase.rpc('update_user_avatar', {
          p_user_id: authUser.id,
          p_avatar_url: null
        });

        if (rpcError) {
          console.warn('Erro ao remover avatar via RPC:', rpcError);
        }
      }

      setUser(prev => prev ? { ...prev, avatar_url: null } : null);
      setPreviewUrl(null);
      setSuccess('Foto removida com sucesso!');
    } catch (err: any) {
      console.error('Erro ao remover foto:', err);
      setError(err.message || 'Erro ao remover foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-300">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayUrl = previewUrl || user.avatar_url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
          >
            <span>←</span>
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>

        {/* Card Principal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header do Card */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Meu Perfil</h1>
            <p className="text-blue-100 mt-1">Gerencie suas informações e foto de perfil</p>
          </div>

          {/* Conteúdo */}
          <div className="p-6 sm:p-8">
            {/* Mensagens de Erro/Sucesso */}
            {error && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                <p className="font-semibold">⚠️ Erro</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                <p className="font-semibold">✅ Sucesso</p>
                <p className="text-sm mt-1">{success}</p>
              </div>
            )}

            {/* Informações do Usuário */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Informações da Conta</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo
                  </label>
                  <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white">
                    {user.full_name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    E-mail
                  </label>
                  <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white">
                    {user.email}
                  </div>
                </div>
                {user.is_admin && (
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                      <span>⭐</span>
                      <span>Administrador</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Upload de Foto */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Foto de Perfil</h2>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Preview da Foto */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg">
                      {displayUrl ? (
                        <img
                          src={displayUrl}
                          alt="Foto de perfil"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl sm:text-5xl text-white">👤</span>
                      )}
                    </div>
                    {displayUrl && (
                      <button
                        onClick={handleRemovePhoto}
                        disabled={uploading}
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remover foto"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Controles de Upload */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Selecionar Imagem
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer dark:file:bg-blue-500 dark:hover:file:bg-blue-600"
                      disabled={uploading}
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
                    </p>
                  </div>

                  {previewUrl && previewUrl !== user.avatar_url && (
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <span>📤</span>
                          <span>Salvar Foto</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

