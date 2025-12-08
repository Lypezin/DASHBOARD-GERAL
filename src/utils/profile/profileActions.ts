import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function updateUserName(userId: string, newName: string) {
    // 1. RPC Check/Update (Optional/Logging)
    try {
        const { error: rpcError } = await safeRpc('update_user_full_name', {
            p_user_id: userId,
            p_full_name: newName
        }, { timeout: 30000 });
        if (IS_DEV && rpcError) safeLog.warn('update_user_full_name RPC info:', rpcError);
    } catch (e) { /* ignore */ }

    // 2. Auth Update
    const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: newName }
    });
    if (updateError) throw updateError;

    // 3. Table Upsert
    try {
        const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({ id: userId, full_name: newName, updated_at: new Date().toISOString() }, { onConflict: 'id' });
        if (profileError && IS_DEV) safeLog.warn('user_profiles upsert error:', profileError);
    } catch (e) { /* ignore */ }

    // 4. Dispatch Event
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { full_name: newName } }));
    }
}

export async function updateUserAvatar(userId: string, file: File, currentUrl?: string | null) {
    // 1. Remove old if necessary
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

    // 3. Update Table
    const { error: dbError } = await supabase.from('user_profiles').upsert({
        id: userId, avatar_url: publicUrl, updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (dbError) {
        // Fallback to RPC
        const { error: rpcError } = await safeRpc('update_user_avatar', { p_user_id: userId, p_avatar_url: publicUrl });
        if (rpcError) throw new Error(`Failed to save avatar URL: ${rpcError.message}`);
    }

    // 4. Dispatch Event
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { avatar_url: publicUrl } }));
    }
    return publicUrl;
}

export async function removeUserAvatar(userId: string, currentUrl: string) {
    // 1. Remove file
    await removeFileFromStorage(userId, currentUrl);

    // 2. Update Table
    const { error: dbError } = await supabase.from('user_profiles').upsert({
        id: userId, avatar_url: null, updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (dbError) {
        await safeRpc('update_user_avatar', { p_user_id: userId, p_avatar_url: null });
    }

    // 3. Dispatch Event
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
