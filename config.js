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
    SUPABASE_URL: 'https://gcfomvzqevcpemjxbnsq.supabase.co',
    
    // Supabase Anon Key（公開可能なキー）
    // 取得場所：Supabaseダッシュボード > Settings > API > Project API keys > anon public
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZm9tdnpxZXZjcGVtanhibnNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzY3MDcsImV4cCI6MjA3MDkxMjcwN30.7ELi7xIrGz4GLpVCL-g6k0QWJL2bswfp2VK_aFNPcqc',
    
    // Edge Function URL（将来使用する場合）
    // 現在は空文字列のままで問題ありません
    EDGE_FUNCTION_URL: ''
};

// 設定値の検証（オプション）
if (window.APP_CONFIG.SUPABASE_URL === 'https://gcfomvzqevcpemjxbnsq.supabase.co') {
    console.warn('⚠️ config.js の設定が完了していません。config.template.js を参考に設定してください。');
}
