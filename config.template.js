// config.template.js - Supabase設定テンプレート
// ========================================
// 使用方法：
// 1. このファイルをconfig.jsという名前でコピーしてください
// 2. 下記の値をあなたのSupabaseプロジェクトの値に置き換えてください
// 3. config.jsは.gitignoreに含まれているため、Gitにはアップロードされません
// ========================================

window.APP_CONFIG = {
    // Supabase プロジェクトURL
    // 取得場所：Supabaseダッシュボード > Settings > API > Project URL
    SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',
    
    // Supabase Anon Key（公開可能なキー）
    // 取得場所：Supabaseダッシュボード > Settings > API > Project API keys > anon public
    SUPABASE_ANON_KEY: 'YOUR_ANON_KEY_HERE',
    
    // Edge Function URL（将来使用する場合）
    // 現在は空文字列のままで問題ありません
    EDGE_FUNCTION_URL: ''
};

// 設定値の検証（オプション）
if (window.APP_CONFIG.SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co') {
    console.warn('⚠️ config.js の設定が完了していません。config.template.js を参考に設定してください。');
}