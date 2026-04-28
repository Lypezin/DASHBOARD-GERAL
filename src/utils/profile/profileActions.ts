import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

async function postProfileUpdate(path: string, payload: Record<string, unknown>) {
    const response = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Falha ao atualizar perfil.');
    }
}

export async function updateUserName(userId: string, newName: string) {
    await postProfileUpdate('/api/profile/name', {
        userId,
        fullName: newName,
    });

    const { error: updateError } = await supabase.auth.updateUser({ data: { full_name: newName } });
    if (updateError && IS_DEV) {
        safeLog.warn('Falha ao refletir full_name na sessao atual:', updateError);
    }

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { full_name: newName } }));
    }
}

export async function updateUserAvatar(userId: string, file: File, currentUrl?: string | null) {
    if (currentUrl) {
        try {
            await removeFileFromStorage(userId, currentUrl);
        } catch (e) { if (IS_DEV) safeLog.warn('Failed to remove old avatar', e); }
    }

    // 2. Upload new
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
        if (uploadError.message?.includes('Bucket not found')) throw new Error('Bucket "avatars" not found.');
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

    await postProfileUpdate('/api/profile/avatar', {
        userId,
        avatarUrl: publicUrl,
    });

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { avatar_url: publicUrl } }));
    }
    return publicUrl;
}

export async function removeUserAvatar(userId: string, currentUrl: string) {
    await removeFileFromStorage(userId, currentUrl);

    await postProfileUpdate('/api/profile/avatar', {
        userId,
        avatarUrl: null,
    });

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { avatar_url: null } }));
    }
}

async function removeFileFromStorage(userId: string, url: string) {
    let filePath = '';
    if (url.includes('/avatars/')) {
        const parts = url.split('/avatars/');
        if (parts.length > 1) filePath = parts[1];
    } else {
        const parts = url.split('/');
        filePath = `${userId}/${parts[parts.length - 1]}`;
    }
    if (filePath) await supabase.storage.from('avatars').remove([filePath]);
}
