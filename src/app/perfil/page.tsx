'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  avatar_url?: string | null;
  created_at?: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [memberSince, setMemberSince] = useState<string | null>(null);

  const checkUser = useCallback(async () => {
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

      // Se o perfil não tiver full_name ou estiver vazio, buscar de user_metadata
      let fullName = profile.full_name;
      if (!fullName || fullName.trim() === '') {
        fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.fullName || authUser.email?.split('@')[0] || 'Usuário';
      }

      // Atualizar o perfil com o nome correto
      const updatedProfile = { ...profile, full_name: fullName };

      setUser(updatedProfile);
      setEditedName(fullName);
      
      // Buscar created_at do auth.users (já temos o authUser da linha 38)
      let userCreatedAt: string | null = null;
      if (authUser?.created_at) {
        userCreatedAt = authUser.created_at;
        setMemberSince(authUser.created_at);
      }
      
      // Buscar avatar_url da tabela de perfil se existir
      if (profile?.id) {
        try {
          if (IS_DEV) console.log('🔍 Buscando avatar_url para usuário:', profile.id);
          
          const { data: profileData, error: profileDataError } = await supabase
            .from('user_profiles')
            .select('avatar_url, id, updated_at, created_at')
            .eq('id', profile.id)
            .single();
          
          // Se não tiver created_at do auth, usar do profile
          if (!userCreatedAt && profileData?.created_at) {
            setMemberSince(profileData.created_at);
          }
          
          if (IS_DEV) console.log('📥 Resultado da busca:', { profileData, profileDataError });
          
          // Se não houver erro e tiver avatar_url, usar
          if (!profileDataError && profileData?.avatar_url) {
            if (IS_DEV) console.log('✅ Avatar encontrado:', profileData.avatar_url);
            setUser(prev => prev ? { ...prev, avatar_url: profileData.avatar_url } : null);
            setPreviewUrl(profileData.avatar_url);
          } else if (profileDataError) {
            // Se der erro, logar detalhes
            if (IS_DEV) {
              console.warn('⚠️ Não foi possível buscar avatar_url:', {
                error: profileDataError,
                code: profileDataError.code,
                message: profileDataError.message,
                details: profileDataError.details,
                hint: profileDataError.hint
              });
            }
            
            // Se o erro for porque não existe registro, criar um registro vazio
            if (profileDataError.code === 'PGRST116') {
              if (IS_DEV) console.log('📝 Registro não existe, criando registro vazio...');
              try {
                const { error: createError } = await supabase
                  .from('user_profiles')
                  .insert({
                    id: profile.id,
                    avatar_url: null,
                    updated_at: new Date().toISOString()
                  });
                
                if (createError) {
                  if (IS_DEV) console.warn('⚠️ Erro ao criar registro vazio:', createError);
                } else {
                  if (IS_DEV) console.log('✅ Registro vazio criado com sucesso');
                }
              } catch (err) {
                if (IS_DEV) console.warn('⚠️ Erro ao criar registro:', err);
              }
            }
          } else if (profileData && !profileData.avatar_url) {
            if (IS_DEV) console.log('ℹ️ Usuário não tem avatar ainda');
          }
        } catch (err) {
          // Ignorar erros ao buscar avatar_url (pode ser que a tabela não exista ainda)
          if (IS_DEV) console.warn('⚠️ Erro ao buscar avatar_url:', err);
        }
      }
    } catch (err) {
      safeLog.error('Erro ao carregar perfil:', err);
      setError('Erro ao carregar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

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
          if (IS_DEV) console.warn('Não foi possível remover foto antiga:', err);
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

      if (IS_DEV) {
        console.log('🔍 URL pública gerada:', publicUrl);
        console.log('🔍 FilePath:', filePath);
      }

      // Atualizar perfil do usuário
      // IMPORTANTE: Incluir apenas as colunas que existem na tabela
      // Não incluir colunas como 'email' que podem ter constraints
      const { data: upsertData, error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authUser.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select();

      if (IS_DEV) console.log('💾 Resultado do upsert:', { upsertData, updateError });

      if (updateError) {
        if (IS_DEV) console.error('❌ Erro no upsert direto:', updateError);
        
        // Se não conseguir atualizar na tabela, tentar atualizar via RPC
        const { error: rpcError } = await supabase.rpc('update_user_avatar', {
          p_user_id: authUser.id,
          p_avatar_url: publicUrl
        });

        if (rpcError) {
          if (IS_DEV) console.error('❌ Erro ao atualizar avatar via RPC:', rpcError);
          throw new Error(`Erro ao salvar URL da foto: ${rpcError.message}`);
        } else {
          if (IS_DEV) console.log('✅ Avatar atualizado via RPC com sucesso');
        }
      } else {
        if (IS_DEV) console.log('✅ Avatar atualizado na tabela com sucesso');
        
        // Verificar se o registro foi criado/atualizado
        if (IS_DEV && upsertData && upsertData.length > 0) {
          console.log('✅ Dados confirmados na tabela:', upsertData[0]);
        }
      }

      // Atualizar estado local
      setSuccess('Foto atualizada com sucesso!');
      setUser(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setPreviewUrl(publicUrl);

      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      safeLog.error('Erro ao fazer upload:', err);
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
        if (IS_DEV) console.warn('Erro ao remover arquivo do storage:', deleteError);
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
          if (IS_DEV) console.warn('Erro ao remover avatar via RPC:', rpcError);
        }
      }

      setUser(prev => prev ? { ...prev, avatar_url: null } : null);
      setPreviewUrl(null);
      setSuccess('Foto removida com sucesso!');
    } catch (err: any) {
      safeLog.error('Erro ao remover foto:', err);
      setError(err.message || 'Erro ao remover foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) {
      setError('O nome não pode estar vazio.');
      return;
    }

    if (editedName.trim() === user.full_name) {
      setIsEditingName(false);
      return;
    }

    setSavingName(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Usuário não autenticado');

      const trimmedName = editedName.trim();
      if (!trimmedName) {
        throw new Error('O nome não pode estar vazio');
      }

      // Primeiro, tentar atualizar via RPC (se existir)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('update_user_full_name', {
          p_user_id: authUser.id,
          p_full_name: trimmedName
        }) as { data: { success?: boolean; error?: string } | null; error: any };

        if (!rpcError && rpcData && (rpcData as any).success) {
          // RPC funcionou, continuar
          if (IS_DEV) console.log('✅ Nome atualizado via RPC');
        } else if (rpcError) {
          // Se a função não existir ou der erro, continuar com auth.updateUser
          if (IS_DEV) console.warn('Função update_user_full_name não disponível ou erro:', rpcError);
        }
      } catch (err) {
        // Ignorar erros de RPC e continuar com auth.updateUser
        if (IS_DEV) console.warn('Erro ao atualizar nome via RPC:', err);
      }

      // Sempre atualizar também no Supabase Auth (user_metadata) como fallback
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...authUser.user_metadata,
          full_name: trimmedName
        }
      });

      if (updateError) throw updateError;

      // Atualizar também na tabela user_profiles diretamente (se existir)
      try {
        const { error: profileUpdateError } = await supabase
          .from('user_profiles')
          .upsert({
            id: authUser.id,
            full_name: trimmedName,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (profileUpdateError && IS_DEV) {
          console.warn('Erro ao atualizar user_profiles:', profileUpdateError);
        }
      } catch (err) {
        // Ignorar se a tabela não existir
        if (IS_DEV) console.warn('Erro ao atualizar user_profiles:', err);
      }

      // Recarregar o perfil para garantir que está atualizado
      await checkUser();

      setSuccess('Nome atualizado com sucesso!');
      setIsEditingName(false);
    } catch (err: any) {
      safeLog.error('Erro ao atualizar nome:', err);
      setError(err.message || 'Erro ao atualizar nome. Tente novamente.');
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditedName(user?.full_name || '');
    setIsEditingName(false);
    setError(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
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
                  {isEditingName ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        disabled={savingName}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
                        placeholder="Digite seu nome"
                        maxLength={100}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveName}
                          disabled={savingName || !editedName.trim()}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                        >
                          {savingName ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              <span>Salvando...</span>
                            </>
                          ) : (
                            <>
                              <span>✓</span>
                              <span>Salvar</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCancelEditName}
                          disabled={savingName}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white">
                        {user.full_name}
                      </div>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        title="Editar nome"
                      >
                        <span>✏️</span>
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    E-mail
                  </label>
                  <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white">
                    {user.email}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    O e-mail não pode ser alterado
                  </p>
                </div>
                {memberSince && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Membro desde
                    </label>
                    <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 px-4 py-3 text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span className="font-medium">{formatDate(memberSince)}</span>
                      </div>
                    </div>
                  </div>
                )}
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

            {/* Configurações de Tema */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Aparência</h2>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Tema</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Alterar entre tema claro e escuro
                    </p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="relative inline-flex h-8 w-14 items-center rounded-full bg-slate-300 dark:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    role="switch"
                    aria-checked={theme === 'dark'}
                    aria-label="Alternar tema"
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                        theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    >
                      <span className="absolute inset-0 flex items-center justify-center">
                        {theme === 'dark' ? '🌙' : '☀️'}
                      </span>
                    </span>
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span>Tema atual:</span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">
                    {theme === 'dark' ? '🌙 Escuro' : '☀️ Claro'}
                  </span>
                </div>
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
                        <Image
                          src={displayUrl}
                          alt="Foto de perfil"
                          width={160}
                          height={160}
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

