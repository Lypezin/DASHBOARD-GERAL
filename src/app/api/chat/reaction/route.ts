import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

function isUuidLike(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return NextResponse.json({ error: 'Usuario nao autenticado.' }, { status: 401 });
        }

        const body = await request.json().catch(() => null);
        const messageId = typeof body?.messageId === 'string' ? body.messageId : '';
        const emoji = typeof body?.emoji === 'string' ? body.emoji.trim() : '';

        if (!isUuidLike(messageId) || !emoji) {
            return NextResponse.json({ error: 'Payload invalido para reacao.' }, { status: 400 });
        }

        const admin = createServiceRoleClient();
        const { data: message, error: messageError } = await admin
            .from('chat_messages')
            .select('id, from_user, to_user, reactions')
            .eq('id', messageId)
            .single();

        if (messageError || !message) {
            return NextResponse.json({ error: 'Mensagem nao encontrada.' }, { status: 404 });
        }

        if (message.from_user !== userData.user.id && message.to_user !== userData.user.id) {
            return NextResponse.json({ error: 'Voce nao pode reagir a esta mensagem.' }, { status: 403 });
        }

        const nextReactions = {
            ...(message.reactions && typeof message.reactions === 'object' ? message.reactions : {}),
            [userData.user.id]: emoji,
        };

        const { error: updateError } = await admin
            .from('chat_messages')
            .update({ reactions: nextReactions })
            .eq('id', messageId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, reactions: nextReactions });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao salvar reacao.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
