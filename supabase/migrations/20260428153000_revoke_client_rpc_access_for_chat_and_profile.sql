revoke execute on function public.toggle_chat_reaction(uuid, text) from anon;
revoke execute on function public.toggle_chat_reaction(uuid, text) from authenticated;

revoke execute on function public.update_user_avatar(uuid, text) from anon;
revoke execute on function public.update_user_avatar(uuid, text) from authenticated;

revoke execute on function public.update_user_full_name(uuid, text) from anon;
revoke execute on function public.update_user_full_name(uuid, text) from authenticated;
