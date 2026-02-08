// config.js - 環境設定（GitHub Secrets用）
export function loadConfig() {
    
    return {
        supabaseUrl: 'https://figycpclqkoarpkkvwxz.supabase.co',
        supabaseKey: window.SUPABASE_KEY || 'sb_publishable_j9KTa-6LI8llwinlZJI9ww_0NnAq714'
    };
}

