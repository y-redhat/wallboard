// config.js - テンプレート (GitHub ActionsがSecretsで置換する)
export function loadConfig() {
    return {
        supabaseUrl: '${{ secrets.SUPABASE_URL }}',
        supabaseKey: '${{ secrets.SUPABASE_KEY }}'
    };
}

