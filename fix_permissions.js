const { Client } = require('pg');

const connectionString = 'postgresql://postgres:XlyEN9fkTiJSv2JU@db.ulmobmmlkevxswxpcyza.supabase.co:5432/postgres';

async function checkIssues() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Let's grant execute access to all functions in public schema to authenticated and anon roles,
        // because sometimes CREATE OR REPLACE FUNCTION resetting could drop grants or the search_path restricts it.
        // Actually, let's just make sure get_subpracas_by_praca exists and check its definition.

        const rpcCheck = await client.query(`
            SELECT proname, proargnames, prosecdef, pg_get_functiondef(oid) as def
            FROM pg_proc 
            WHERE proname IN ('get_subpracas_by_praca', 'get_turnos_by_praca', 'get_origens_by_praca')
        `);

        console.log("Found RPCs:", rpcCheck.rows.map(r => r.proname));
        if (rpcCheck.rows.length > 0) {
            console.log("Def of one:", rpcCheck.rows[0].def.substring(0, 300));
        }

        // Fix execute permissions widely as a safety measure for Supabase public schema
        console.log("Re-granting execute to anon, authenticated...");
        await client.query(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;`);
        await client.query(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;`);

        // Check user_activity_logs RLS
        const rlsCheck = await client.query(`
            SELECT polname, polcmd, polroles, polqual, polwithcheck 
            FROM pg_policy 
            WHERE polrelid = 'public.user_activity_logs'::regclass
        `);
        console.log("RLS on user_activity_logs:");
        console.table(rlsCheck.rows);

        // We might just need to ensure the authenticated user can INSERT into user_activity_logs.
        // The error is "new row violates row-level security policy for table user_activity_logs".
        // This usually happens if the policy has a WITH CHECK like `auth.uid() = user_id`.
        // If the query was inserting with a user_id that doesn't match auth.uid(), it fails.
        // But the insert in the frontend is likely the same as before. 
        // Did the `search_path = public, extensions, auth` change anything?
        // Let's look if we touched ANY function that `user_activity_logs` uses natively during insert? Like a trigger?

        const triggerCheck = await client.query(`
            SELECT trigger_name, action_statement 
            FROM information_schema.triggers 
            WHERE event_object_table = 'user_activity_logs'
        `);
        console.log("Triggers on user_activity_logs:", triggerCheck.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkIssues();
