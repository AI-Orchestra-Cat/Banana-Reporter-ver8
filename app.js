// app_integrated.js - v8.0 統合版
// セキュア版 + 管理者機能 + CSV/メール出力 + スマホ対応

// 設定（config.jsから取得）
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

// Supabaseクライアントの初期化
let supabaseClient = null;

// グローバル変数
let currentUser = null;
let currentImageData = null;
let analysisResult = null;
let visualJudgment = null;

// カラーチャートデータ（表示用のみ - 判定ロジックはSupabaseに移行）
let COLOR_CHART_DATA = [];

// アプリ初期化
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🍌 バナナレポーター v8.0 統合版 起動');
    
    try {
        // 設定読み込み
        if (window.APP_CONFIG) {
            SUPABASE_URL = window.APP_CONFIG.SUPABASE_URL;
            SUPABASE_ANON_KEY = window.APP_CONFIG.SUPABASE_ANON_KEY;
        }
        
        // Supabase初期化
        if (typeof window.supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase初期化完了');
        } else {
            throw new Error('Supabase設定が不正です');
        }
        
        // カラーチャートデータを取得（表示用）
        await loadColorChartData();
        
        // ユーザーデータ初期化（localStorage使用）
        initializeUserData();
        
        // イベントリスナー設定
        setupEventListeners();
        
        // 管理者画面の初期化
        initAdminPage();
        
        console.log('✅ アプリ初期化完了');
        
    } catch (error) {
        console.error('❌ 初期化エラー:', error);
        alert('アプリの初期化に失敗しました。設定を確認してください。');
    }
});

// Supabaseからカラーチャートデータを取得（表示用のみ）
async function loadColorChartData() {
    try {
        const { data, error } = await supabaseClient.rpc('get_color_chart_data');
        
        if (error) throw error;
        
        COLOR_CHART_DATA = data || [];
        console.log('✅ カラーチャートデータ取得完了');
        
    } catch (error) {
        console.error('❌ カラーチャートデータ取得エラー:', error);
        // フォールバック用の基本データ
        COLOR_CHART_DATA = [
            { level: 2, name: "オールグリーン", color: "#2E7D32" },
            { level: 3, name: "ライトグリーン", color: "#4CAF50" },
            { level: 4, name: "ハーフグリーン", color: "#8BC34A" },
            { level: 5, name: "グリーンチップ", color: "#CDDC39" },
            { level: 6, name: "フルイエロー", color: "#FFEB3B" },
            { level: 7, name: "スター", color: "#FFC107" },
            { level: 8, name: "", color: "#FF9800" },
            { level: 9, name: "", color: "#795548" }
        ];
    }
}

// ユーザーデータ初期化（localStorage使用）
function initializeUserData() {
    // 店舗データ（ユーザー個別管理）
    let storeData = JSON.parse(localStorage.getItem('storeData')) || {
        'Aチェーン': ['本店', '支店1', '支店2'],
        'Bストア': ['世田谷店', '渋谷店', '新宿店'],
        'Cマーケット': ['府中店', '調布店', '国分寺店']
    };
    
    // 商品データ
    let productData = JSON.parse(localStorage.getItem('productData')) || [
        'バナナ（房）', 'バナナ（単品）'
    ];
    
    // クレーム種別データ
    let claimTypeData = JSON.parse(localStorage.getItem('claimTypeData')) || [
        '過熟', 'おされ・きず', '腐れ', '未熟', 'きぶく', 'あおぶく', 'その他'
    ];
    
    // コード名称設定
    let codeNames = JSON.parse(localStorage.getItem('bananaCodeNames')) || {
        code1: 'コード1',
        code2: 'コード2', 
        code3: 'コード3'
    };
    
    // グローバル変数に設定
    window.storeData = storeData;
    window.productData = productData;
    window.claimTypeData = claimTypeData;
    window.codeNames = codeNames;
    
    // 初期データをlocalStorageに保存
    localStorage.setItem('storeData', JSON.stringify(storeData));
    localStorage.setItem('productData', JSON.stringify(productData));
    localStorage.setItem('claimTypeData', JSON.stringify(claimTypeData));
    localStorage.setItem('bananaCodeNames', JSON.stringify(codeNames));
}

// イベントリスナー設定
function setupEventListeners() {
    // ログインボタン
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    
    // 画像入力（スマホ対応）
    document.getElementById('cameraBtn')?.addEventListener('click', () => {
        const cameraInput = document.getElementById('cameraInput');
        if (cameraInput) {
            // スマホ対応：capture属性を動的に設定
            if (isMobileDevice()) {
                cameraInput.setAttribute('capture', 'environment');
            }
            cameraInput.click();
        }
    });
    
    document.getElementById('fileBtn')?.addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    document.getElementById('cameraInput')?.addEventListener('change', handleImageSelect);
    document.getElementById('fileInput')?.addEventListener('change', handleImageSelect);
    
    // 解析ボタン
    document.getElementById('analyzeBtn')?.addEventListener('click', handleAnalyze);
    
    // CSV/メール出力ボタン
    document.getElementById('exportBtn')?.addEventListener('click', exportAnalysisResultCSV);
    document.getElementById('emailBtn')?.addEventListener('click', sendEmail);
    
    // その他のボタン
    document.getElementById('resetBtn')?.addEventListener('click', resetForm);
    document.getElementById('settingsBtn')?.addEventListener('click', toggleSettings);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // 日付制限設定
    setupDateLimits();
    
    // カラーチャート表示
    displayColorChart();
    
    // フォーム要素の初期化
    initializeFormElements();
}

// モバイルデバイス判定
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 日付制限設定（未来日付を無効化）
function setupDateLimits() {
    const today = new Date().toISOString().split('T')[0];
    const deliveryDate = document.getElementById('deliveryDate');
    const captureDate = document.getElementById('captureDate');
    
    if (deliveryDate) {
        deliveryDate.max = today;
        deliveryDate.value = today;
    }
    
    if (captureDate) {
        captureDate.max = today;
        captureDate.value = today;
    }
}

// カラーチャート表示
function displayColorChart() {
    const colorChart = document.getElementById('colorChart');
    if (!colorChart || !COLOR_CHART_DATA.length) return;
    
    colorChart.innerHTML = '';
    
    COLOR_CHART_DATA.forEach(color => {
        // 円形のカラーアイテム
        const item = document.createElement('div');
        item.className = 'color-item';
        item.dataset.level = color.level;
        item.style.cssText = `
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: ${color.color};
            border: 3px solid transparent;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            position: relative;
        `;
        
        item.innerHTML = `
            <div style="text-align: center; color: white; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
                <div style="font-size: 14px;">カラー${color.level}</div>
                ${color.name ? `<div style="font-size: 10px; margin-top: 2px;">${color.name}</div>` : ''}
            </div>
        `;
        
        item.onclick = () => selectColor(color.level);
        
        colorChart.appendChild(item);
    });
}

// カラー選択
window.selectColor = function(level) {
    // 既存の選択をクリア
    document.querySelectorAll('.color-item').forEach(item => {
        item.style.border = '3px solid transparent';
        item.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        item.style.transform = 'scale(1)';
    });
    
    // 新しい選択を設定
    const selectedItem = document.querySelector(`[data-level="${level}"]`);
    if (selectedItem) {
        selectedItem.style.border = '3px solid #007bff';
        selectedItem.style.boxShadow = '0 0 10px rgba(0, 123, 255, 0.5), 0 2px 5px rgba(0,0,0,0.3)';
        selectedItem.style.transform = 'scale(1.1)';
    }
    
    // 選択状態を保存
    visualJudgment = level;
    
    // 選択テキスト更新
    const selectedColorText = document.getElementById('selectedColorText');
    if (selectedColorText) {
        const colorInfo = COLOR_CHART_DATA.find(c => c.level === level);
        const colorName = colorInfo ? (colorInfo.name || `カラー${level}`) : `カラー${level}`;
        selectedColorText.textContent = colorName;
    }
    
    // 解析ボタンを有効化
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn && currentImageData) {
        analyzeBtn.disabled = false;
    }
}

// ログイン処理
async function handleLogin() {
    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginError = document.getElementById('loginError');
    
    if (!userId || !password) {
        loginError.textContent = 'ユーザーIDとパスワードを入力してください';
        loginError.classList.remove('hidden');
        return;
    }
    
    try {
        // Supabaseで認証（登録ユーザーはSupabaseで管理）
        const { data, error } = await supabaseClient.rpc('authenticate_user', {
            p_user_id: userId,
            p_password: password
        });
        
        if (error) throw error;
        
        if (data && data.success) {
            currentUser = {
                id: userId,
                email: data.email,
                role: data.role || 'user'
            };
            
            // ログイン記録
            await recordLogin(userId);
            
            // 画面切り替え
            document.getElementById('authScreen').classList.add('hidden');
            document.getElementById('mainScreen').classList.remove('hidden');
            document.getElementById('currentUserDisplay').textContent = userId;
            
            // 管理者の場合は設定ボタンを表示
            if (currentUser.role === 'admin') {
                const settingsBtn = document.getElementById('settingsBtn');
                if (settingsBtn) {
                    settingsBtn.style.display = 'inline-block';
                }
            }
            
            loginError.classList.add('hidden');
            
        } else {
            throw new Error('認証に失敗しました');
        }
        
    } catch (error) {
        console.error('ログインエラー:', error);
        loginError.textContent = 'ログインに失敗しました。ID・パスワードを確認してください。';
        loginError.classList.remove('hidden');
    }
}

// ログイン記録
async function recordLogin(userId) {
    try {
        await supabaseClient.rpc('record_login', {
            p_user_id: userId,
            p_ip_address: 'unknown',
            p_user_agent: navigator.userAgent
        });
    } catch (error) {
        console.error('ログイン記録エラー:', error);
    }
}

// 画像選択処理
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 前回の選択をクリア
    event.target.value = '';
    
    // 前回のデータをクリア
    clearPreviousData();
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentImageData = e.target.result;
        displayImagePreview(e.target.result);
        
        // 解析ボタンの状態更新
        updateAnalyzeButton();
    };
    reader.readAsDataURL(file);
}

// 前回データクリア
function clearPreviousData() {
    analysisResult = null;
    visualJudgment = null;
    
    // フォームクリア
    document.getElementById('chainName').value = '';
    document.getElementById('storeName').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('claimType').value = '';
    document.getElementById('commentText').value = '';
    document.getElementById('code1').value = '';
    document.getElementById('code2').value = '';
    document.getElementById('code3').value = '';
    
    // 日付を今日に設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('deliveryDate').value = today;
    document.getElementById('captureDate').value = today;
    
    // カラー選択をクリア
    document.querySelectorAll('.color-item').forEach(item => {
        item.style.border = '2px solid transparent';
        item.style.boxShadow = 'none';
        item.style.transform = 'scale(1)';
    });
    
    document.getElementById('selectedColorText').textContent = '未選択';
    
    // 結果カード非表示
    document.getElementById('resultCard').classList.add('hidden');
    
    // エクスポートボタン無効化
    document.getElementById('exportBtn').disabled = true;
    document.getElementById('emailBtn').disabled = true;
}

// 画像プレビュー表示
function displayImagePreview(imageSrc) {
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = `<img src="${imageSrc}" style="max-width: 100%; max-height: 300px; border-radius: 8px;">`;
}

// 解析ボタン状態更新
function updateAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.disabled = !(currentImageData && visualJudgment);
    }
}

// メイン解析処理（HSV解析をクライアントで実行し、判定をSupabaseで実行）
async function handleAnalyze() {
    if (!currentImageData || !visualJudgment) {
        alert('画像を選択し、目視選択を行ってから解析してください');
        return;
    }
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    const originalText = analyzeBtn.textContent;
    
    try {
        analyzeBtn.textContent = '🔍 解析中...';
        analyzeBtn.disabled = true;
        
        // クライアントサイドでHSV解析実行
        const hsvData = await performClientSideHSVAnalysis(currentImageData);
        
        // Supabaseで判定実行（企業秘密はサーバーサイド）
        const { data, error } = await supabaseClient.rpc('analyze_banana_color', {
            p_user_id: currentUser.id,
            p_image_hsv_data: hsvData
        });
        
        if (error) throw error;
        
        analysisResult = data;
        
        // 結果表示
        displayAnalysisResult(analysisResult);
        
        // エクスポートボタン有効化
        enableExportButtons();
        
    } catch (error) {
        console.error('解析エラー:', error);
        alert('解析に失敗しました: ' + error.message);
    } finally {
        analyzeBtn.textContent = originalText;
        analyzeBtn.disabled = false;
    }
}

// クライアントサイドHSV解析（基本的な画像処理のみ）
async function performClientSideHSVAnalysis(imageData) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // スマホ画像対応：最大サイズを制限
                const MAX_SIZE = 1000;
                let width = img.width;
                let height = img.height;
                
                if (width > MAX_SIZE || height > MAX_SIZE) {
                    const scale = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                    width = Math.floor(width * scale);
                    height = Math.floor(height * scale);
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;
                
                // 基本的なピクセル情報のみを収集（判定ロジックはSupabaseで実行）
                const colorCounts = {
                    '緑系': 0,
                    '黄緑系': 0,
                    '黄色系': 0,
                    '斑点系': 0,
                    '褐色系': 0
                };
                
                let totalPixels = 0;
                const sampleStep = 4;
                
                for (let i = 0; i < pixels.length; i += 4 * sampleStep) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    const a = pixels[i + 3];
                    
                    if (a < 128) continue;
                    
                    totalPixels++;
                    
                    // 簡易的な色分類（詳細はSupabaseで実行）
                    const hsv = rgbToHsv(r, g, b);
                    
                    // 大まかな色分類のみ
                    if (hsv.h >= 60 && hsv.h <= 180 && hsv.s >= 30) {
                        colorCounts['緑系']++;
                    } else if (hsv.h >= 30 && hsv.h <= 80 && hsv.s >= 40) {
                        colorCounts['黄色系']++;
                    } else if (hsv.h >= 15 && hsv.h <= 45 && hsv.s >= 50) {
                        colorCounts['斑点系']++;
                    } else if (hsv.h >= 0 && hsv.h <= 30 && hsv.s >= 30) {
                        colorCounts['褐色系']++;
                    } else {
                        colorCounts['黄緑系']++;
                    }
                }
                
                resolve({
                    totalPixels: totalPixels,
                    colorCounts: colorCounts,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
        img.src = imageData;
    });
}

// RGB→HSV変換（基本的な色空間変換のみ）
function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    
    const s = max === 0 ? 0 : Math.round((delta / max) * 100);
    const v = Math.round(max * 100);
    
    return { h, s, v };
}

// 解析結果表示
function displayAnalysisResult(result) {
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    
    if (!resultCard || !resultContent || !result) return;
    
    const detectedColor = COLOR_CHART_DATA.find(c => c.level === result.detectedLevel);
    const colorName = detectedColor ? (detectedColor.name || `カラー${result.detectedLevel}`) : `カラー${result.detectedLevel}`;
    const colorColor = detectedColor ? detectedColor.color : '#666';
    
    const manualColor = COLOR_CHART_DATA.find(c => c.level === visualJudgment);
    const manualColorName = manualColor ? (manualColor.name || `カラー${visualJudgment}`) : `カラー${visualJudgment}`;
    
    const matchResult = result.detectedLevel === visualJudgment ? '✅ 一致' : '❌ 不一致';
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h4 style="color: #333; margin-bottom: 15px;">📊 解析結果</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 15px; border-radius: 8px; border-left: 4px solid ${colorColor};">
                    <div style="font-weight: bold; color: #333; margin-bottom: 5px;">🤖 自動解析結果</div>
                    <div style="font-size: 18px; font-weight: bold; color: ${colorColor};">${colorName}</div>
                </div>
                
                <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 5px;">👁️ 目視選択</div>
                    <div style="font-size: 18px; font-weight: bold; color: #2196f3;">${manualColorName}</div>
                </div>
            </div>
            
            <div style="text-align: center; padding: 15px; background: ${result.detectedLevel === visualJudgment ? '#d4edda' : '#f8d7da'}; border-radius: 8px; margin-bottom: 20px;">
                <div style="font-size: 18px; font-weight: bold; color: ${result.detectedLevel === visualJudgment ? '#155724' : '#721c24'};">
                    ${matchResult}
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <div style="font-weight: bold; margin-bottom: 10px;">📈 解析統計</div>
                <div style="font-size: 14px; color: #6c757d;">
                    総ピクセル数: ${result.totalPixels?.toLocaleString() || 'N/A'}<br>
                    解析日時: ${new Date().toLocaleString()}
                </div>
            </div>
        </div>
    `;
    
    resultContent.innerHTML = html;
    resultCard.classList.remove('hidden');
}

// エクスポートボタン有効化
function enableExportButtons() {
    document.getElementById('exportBtn').disabled = false;
    document.getElementById('emailBtn').disabled = false;
}

// CSV出力（完全版）
window.exportAnalysisResultCSV = function() {
    if (!analysisResult) {
        alert('解析を実行してからCSV出力してください');
        return;
    }
    
    try {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-');
        
        // フォーム情報取得
        const formData = {
            'チェーン名': document.getElementById('chainName')?.value || '',
            '店舗名': document.getElementById('storeName')?.value || '',
            '商品名': document.getElementById('productName')?.value || '',
            'クレーム種別': document.getElementById('claimType')?.value || '',
            '納品日': document.getElementById('deliveryDate')?.value || '',
            '撮影日': document.getElementById('captureDate')?.value || '',
            'コメント': document.getElementById('commentText')?.value || '',
            [window.codeNames?.code1 || 'コード1']: document.getElementById('code1')?.value || '',
            [window.codeNames?.code2 || 'コード2']: document.getElementById('code2')?.value || '',
            [window.codeNames?.code3 || 'コード3']: document.getElementById('code3')?.value || ''
        };
        
        // 解析情報
        const analysisData = {
            '解析日時': now.toLocaleString(),
            '総ピクセル数': analysisResult.totalPixels || 0,
            '目視選択カラー': `カラー${visualJudgment}`,
            '自動解析カラー': `カラー${analysisResult.detectedLevel}`,
            '一致結果': analysisResult.detectedLevel === visualJudgment ? '一致' : '不一致'
        };
        
        // CSV生成
        const headers = [...Object.keys(formData), ...Object.keys(analysisData)];
        const values = [...Object.values(formData), ...Object.values(analysisData)];
        
        // CSVデータを生成（エスケープ処理付き）
        const escapeCSV = (val) => {
            if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        };
        
        const csvContent = '\ufeff' + [
            headers.map(escapeCSV).join(','),
            values.map(escapeCSV).join(',')
        ].join('\n');
        
        // ダウンロード
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `banana_analysis_${timestamp}_${formData['チェーン名']}_${formData['店舗名']}_カラー${analysisResult.detectedLevel}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
        alert('✅ 解析結果をCSVでエクスポートしました');
        
    } catch (error) {
        console.error('CSV出力エラー:', error);
        alert('❌ CSV出力に失敗しました');
    }
}

// メール送信（完全版）
window.sendEmail = function() {
    if (!analysisResult) {
        alert('解析を実行してからメール送信してください');
        return;
    }
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const mailCount = getTodayMailCount() + 1;
    const uniqueCode = `${currentUser.id}${dateStr}${String(mailCount).padStart(3, '0')}`;
    
    incrementMailCount();
    
    const subject = `バナナ品質レポート_${uniqueCode}`;
    const chainName = document.getElementById('chainName')?.value || '';
    const storeName = document.getElementById('storeName')?.value || '';
    
    const body = `バナナ品質レポート
    
【基本情報】
チェーン名: ${chainName}
店舗名: ${storeName}
解析日時: ${new Date().toLocaleString()}

【解析結果】
目視選択: カラー${visualJudgment}
自動解析: カラー${analysisResult.detectedLevel}
判定結果: ${analysisResult.detectedLevel === visualJudgment ? '一致' : '不一致'}

※CSVファイルと画像を添付してください`;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
}

// メール送信回数管理
function getTodayMailCount() {
    const today = new Date().toISOString().slice(0, 10);
    const key = `mailCount_${currentUser.id}_${today}`;
    return parseInt(localStorage.getItem(key) || '0');
}

function incrementMailCount() {
    const today = new Date().toISOString().slice(0, 10);
    const key = `mailCount_${currentUser.id}_${today}`;
    const count = getTodayMailCount();
    localStorage.setItem(key, (count + 1).toString());
    return count + 1;
}

// 管理者画面初期化
function initAdminPage() {
    // 管理者機能の初期化
    const adminSettingsSection = document.getElementById('adminSettingsSection');
    if (adminSettingsSection && currentUser?.role === 'admin') {
        adminSettingsSection.style.display = 'block';
        
        // 管理者用統計表示
        loadAdminStatistics();
    }
}

// 管理者統計情報の読み込み
async function loadAdminStatistics() {
    if (currentUser?.role !== 'admin') return;
    
    try {
        // ユーザー管理情報を取得
        const { data: userStats, error } = await supabaseClient.rpc('get_admin_user_management');
        
        if (!error && userStats) {
            displayAdminStatistics(userStats);
        }
    } catch (error) {
        console.error('管理者統計取得エラー:', error);
    }
}

// 管理者統計表示
function displayAdminStatistics(stats) {
    const container = document.getElementById('adminStatsContainer');
    if (!container) return;
    
    let html = `
        <div style="background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4>📊 システム利用統計</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
    `;
    
    if (Array.isArray(stats)) {
        stats.forEach(user => {
            html += `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                    <div style="font-weight: bold; color: #333;">${user.user_id}</div>
                    <div style="font-size: 14px; color: #6c757d; margin-top: 5px;">
                        今日: ${user.today_logins || 0}回 / ${user.max_daily_logins || 50}回<br>
                        今月: ${user.month_logins || 0}回 / ${user.max_monthly_logins || 1000}回<br>
                        状態: ${user.is_blocked ? '❌ ブロック中' : '✅ アクティブ'}
                    </div>
                </div>
            `;
        });
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// フォームリセット
function resetForm() {
    if (confirm('フォームをリセットしますか？\n入力内容がすべて削除されます。')) {
        clearPreviousData();
        currentImageData = null;
        
        // 画像プレビューもクリア
        document.getElementById('imagePreview').innerHTML = '<div class="image-placeholder">画像が選択されていません</div>';
        
        // 解析ボタン無効化
        document.getElementById('analyzeBtn').disabled = true;
    }
}

// 設定画面表示/非表示
function toggleSettings() {
    const settingsPanel = document.getElementById('colorAnalysisSettings');
    if (settingsPanel) {
        settingsPanel.classList.toggle('hidden');
        
        // 設定画面を表示する場合は、ユーザーデータ管理画面を表示
        if (!settingsPanel.classList.contains('hidden')) {
            displayUserDataManagement();
            
            // 管理者の場合は管理者機能も表示
            if (currentUser?.role === 'admin') {
                loadAdminStatistics();
            }
        }
    }
}

// ユーザーデータ管理画面表示
function displayUserDataManagement() {
    // マスタデータ管理セクションのみ表示（カラー設定は除外）
    displayMasterDataManagement();
    displayCodeNameManagement();
}

// マスタデータ管理表示
function displayMasterDataManagement() {
    displayChainMaster();
    displayStoreMaster();
    displayProductMaster();
    displayClaimTypeMaster();
}

// チェーン名マスタ表示
function displayChainMaster() {
    const container = document.getElementById('chainMasterContainer');
    if (!container) return;
    
    const chains = Object.keys(window.storeData || {});
    
    let html = `
        <div style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
            <div style="margin-bottom: 10px;">
                <input type="text" id="newChainInput" placeholder="新しいチェーン名" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px;">
                <button class="btn btn-primary btn-sm" onclick="addNewChain()">追加</button>
            </div>
            <div id="chainTagsContainer">
    `;
    
    chains.forEach(chain => {
        html += `
            <span style="display: inline-block; background: #e9ecef; padding: 5px 10px; margin: 2px; border-radius: 15px; font-size: 12px;">
                ${chain}
                <button onclick="removeChain('${chain}')" style="margin-left: 5px; background: none; border: none; color: #dc3545; cursor: pointer;">×</button>
            </span>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    updateChainOptions();
}

// 新しいチェーン追加
window.addNewChain = function() {
    const input = document.getElementById('newChainInput');
    const newChain = input.value.trim();
    
    if (!newChain) {
        alert('チェーン名を入力してください');
        return;
    }
    
    if (window.storeData[newChain]) {
        alert('このチェーン名は既に存在します');
        return;
    }
    
    window.storeData[newChain] = [];
    input.value = '';
    
    localStorage.setItem('storeData', JSON.stringify(window.storeData));
    displayChainMaster();
}

// チェーン削除
window.removeChain = function(chainName) {
    if (confirm(`「${chainName}」を削除しますか？\n関連する店舗も削除されます。`)) {
        delete window.storeData[chainName];
        localStorage.setItem('storeData', JSON.stringify(window.storeData));
        displayChainMaster();
        displayStoreMaster();
    }
}

// チェーン選択肢更新
function updateChainOptions() {
    const chainSelect = document.getElementById('chainName');
    if (!chainSelect) return;
    
    const currentValue = chainSelect.value;
    chainSelect.innerHTML = '<option value="">選択してください</option>';
    
    Object.keys(window.storeData || {}).forEach(chain => {
        const option = document.createElement('option');
        option.value = chain;
        option.textContent = chain;
        chainSelect.appendChild(option);
    });
    
    if (currentValue && window.storeData[currentValue]) {
        chainSelect.value = currentValue;
    }
    
    updateStoreOptions();
}

// 店舗マスタ表示
function displayStoreMaster() {
    const container = document.getElementById('storeMasterContainer');
    if (!container) return;
    
    const chains = Object.keys(window.storeData || {});
    
    let html = `
        <div style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
            <div style="margin-bottom: 10px;">
                <select id="storeChainSelect" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px;">
                    <option value="">チェーンを選択</option>
    `;
    
    chains.forEach(chain => {
        html += `<option value="${chain}">${chain}</option>`;
    });
    
    html += `
                </select>
                <input type="text" id="newStoreInput" placeholder="店舗名" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px;">
                <button class="btn btn-primary btn-sm" onclick="addNewStore()">追加</button>
            </div>
            <div id="storeTagsContainer">
    `;
    
    Object.entries(window.storeData || {}).forEach(([chain, stores]) => {
        if (stores.length > 0) {
            html += `<div style="margin-bottom: 10px;"><strong>${chain}:</strong><br>`;
            stores.forEach(store => {
                html += `
                    <span style="display: inline-block; background: #d1ecf1; padding: 4px 8px; margin: 2px; border-radius: 12px; font-size: 11px;">
                        ${store}
                        <button onclick="removeStore('${chain}', '${store}')" style="margin-left: 5px; background: none; border: none; color: #dc3545; cursor: pointer;">×</button>
                    </span>
                `;
            });
            html += '</div>';
        }
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// 新しい店舗追加
window.addNewStore = function() {
    const chainSelect = document.getElementById('storeChainSelect');
    const storeInput = document.getElementById('newStoreInput');
    const selectedChain = chainSelect.value;
    const newStore = storeInput.value.trim();
    
    if (!selectedChain) {
        alert('チェーンを選択してください');
        return;
    }
    
    if (!newStore) {
        alert('店舗名を入力してください');
        return;
    }
    
    if (!window.storeData[selectedChain]) {
        window.storeData[selectedChain] = [];
    }
    
    if (window.storeData[selectedChain].includes(newStore)) {
        alert('この店舗名は既に存在します');
        return;
    }
    
    window.storeData[selectedChain].push(newStore);
    storeInput.value = '';
    
    localStorage.setItem('storeData', JSON.stringify(window.storeData));
    displayStoreMaster();
    updateStoreOptions();
}

// 店舗削除
window.removeStore = function(chainName, storeName) {
    if (confirm(`「${storeName}」を削除しますか？`)) {
        window.storeData[chainName] = window.storeData[chainName].filter(store => store !== storeName);
        localStorage.setItem('storeData', JSON.stringify(window.storeData));
        displayStoreMaster();
        updateStoreOptions();
    }
}

// 店舗選択肢更新
function updateStoreOptions() {
    const chainSelect = document.getElementById('chainName');
    const storeSelect = document.getElementById('storeName');
    
    if (!chainSelect || !storeSelect) return;
    
    const selectedChain = chainSelect.value;
    storeSelect.innerHTML = '<option value="">チェーンを先に選択してください</option>';
    
    if (selectedChain && window.storeData[selectedChain]) {
        storeSelect.innerHTML = '<option value="">選択してください</option>';
        window.storeData[selectedChain].forEach(store => {
            const option = document.createElement('option');
            option.value = store;
            option.textContent = store;
            storeSelect.appendChild(option);
        });
    }
}

// 商品マスタ表示
function displayProductMaster() {
    const container = document.getElementById('productMasterContainer');
    if (!container) return;
    
    const products = window.productData || [];
    
    let html = `
        <div style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
            <div style="margin-bottom: 10px;">
                <input type="text" id="newProductInput" placeholder="新しい商品名" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px;">
                <button class="btn btn-primary btn-sm" onclick="addNewProduct()">追加</button>
            </div>
            <div>
    `;
    
    products.forEach(product => {
        html += `
            <span style="display: inline-block; background: #fff3cd; padding: 5px 10px; margin: 2px; border-radius: 15px; font-size: 12px;">
                ${product}
                <button onclick="removeProduct('${product}')" style="margin-left: 5px; background: none; border: none; color: #dc3545; cursor: pointer;">×</button>
            </span>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    updateProductOptions();
}

// 新しい商品追加
window.addNewProduct = function() {
    const input = document.getElementById('newProductInput');
    const newProduct = input.value.trim();
    
    if (!newProduct) {
        alert('商品名を入力してください');
        return;
    }
    
    if (window.productData.includes(newProduct)) {
        alert('この商品名は既に存在します');
        return;
    }
    
    window.productData.push(newProduct);
    input.value = '';
    
    localStorage.setItem('productData', JSON.stringify(window.productData));
    displayProductMaster();
}

// 商品削除
window.removeProduct = function(productName) {
    if (confirm(`「${productName}」を削除しますか？`)) {
        window.productData = window.productData.filter(product => product !== productName);
        localStorage.setItem('productData', JSON.stringify(window.productData));
        displayProductMaster();
        updateProductOptions();
    }
}

// 商品選択肢更新
function updateProductOptions() {
    const productSelect = document.getElementById('productName');
    if (!productSelect) return;
    
    const currentValue = productSelect.value;
    productSelect.innerHTML = '<option value="">選択してください</option>';
    
    window.productData.forEach(product => {
        const option = document.createElement('option');
        option.value = product;
        option.textContent = product;
        productSelect.appendChild(option);
    });
    
    if (currentValue && window.productData.includes(currentValue)) {
        productSelect.value = currentValue;
    }
}

// クレーム種別マスタ表示
function displayClaimTypeMaster() {
    const container = document.getElementById('claimTypeMasterContainer');
    if (!container) return;
    
    const claimTypes = window.claimTypeData || [];
    
    let html = `
        <div style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
            <div style="margin-bottom: 10px;">
                <input type="text" id="newClaimTypeInput" placeholder="新しいクレーム種別" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px;">
                <button class="btn btn-primary btn-sm" onclick="addNewClaimType()">追加</button>
            </div>
            <div>
    `;
    
    claimTypes.forEach(claimType => {
        html += `
            <span style="display: inline-block; background: #f8d7da; padding: 5px 10px; margin: 2px; border-radius: 15px; font-size: 12px;">
                ${claimType}
                <button onclick="removeClaimType('${claimType}')" style="margin-left: 5px; background: none; border: none; color: #dc3545; cursor: pointer;">×</button>
            </span>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    updateClaimTypeOptions();
}

// 新しいクレーム種別追加
window.addNewClaimType = function() {
    const input = document.getElementById('newClaimTypeInput');
    const newClaimType = input.value.trim();
    
    if (!newClaimType) {
        alert('クレーム種別を入力してください');
        return;
    }
    
    if (window.claimTypeData.includes(newClaimType)) {
        alert('このクレーム種別は既に存在します');
        return;
    }
    
    window.claimTypeData.push(newClaimType);
    input.value = '';
    
    localStorage.setItem('claimTypeData', JSON.stringify(window.claimTypeData));
    displayClaimTypeMaster();
}

// クレーム種別削除
window.removeClaimType = function(claimType) {
    if (confirm(`「${claimType}」を削除しますか？`)) {
        window.claimTypeData = window.claimTypeData.filter(type => type !== claimType);
        localStorage.setItem('claimTypeData', JSON.stringify(window.claimTypeData));
        displayClaimTypeMaster();
        updateClaimTypeOptions();
    }
}

// クレーム種別選択肢更新
function updateClaimTypeOptions() {
    const claimTypeSelect = document.getElementById('claimType');
    if (!claimTypeSelect) return;
    
    const currentValue = claimTypeSelect.value;
    claimTypeSelect.innerHTML = '<option value="">選択してください</option>';
    
    window.claimTypeData.forEach(claimType => {
        const option = document.createElement('option');
        option.value = claimType;
        option.textContent = claimType;
        claimTypeSelect.appendChild(option);
    });
    
    if (currentValue && window.claimTypeData.includes(currentValue)) {
        claimTypeSelect.value = currentValue;
    }
}

// コード名称管理表示
function displayCodeNameManagement() {
    // 既にHTMLに実装済みのため、現在の値で初期化
    const code1NameInput = document.getElementById('code1Name');
    const code2NameInput = document.getElementById('code2Name');
    const code3NameInput = document.getElementById('code3Name');
    
    if (code1NameInput) code1NameInput.value = window.codeNames.code1 || 'コード1';
    if (code2NameInput) code2NameInput.value = window.codeNames.code2 || 'コード2';
    if (code3NameInput) code3NameInput.value = window.codeNames.code3 || 'コード3';
    
    updateCodeLabels();
}

// コード名称更新
window.updateCodeName = function(codeNumber) {
    const nameInput = document.getElementById(`code${codeNumber}Name`);
    if (nameInput) {
        const newName = nameInput.value.trim() || `コード${codeNumber}`;
        window.codeNames[`code${codeNumber}`] = newName;
        updateCodeLabels();
    }
}

// コード名称保存
window.saveCodeNames = function() {
    try {
        localStorage.setItem('bananaCodeNames', JSON.stringify(window.codeNames));
        updateCodeLabels();
        alert('✅ コード名称を保存しました');
    } catch (error) {
        console.error('コード名称保存エラー:', error);
        alert('❌ 保存に失敗しました');
    }
}

// コードラベル更新
function updateCodeLabels() {
    const labels = ['code1Label', 'code2Label', 'code3Label'];
    labels.forEach((labelId, index) => {
        const label = document.getElementById(labelId);
        if (label) {
            const codeKey = `code${index + 1}`;
            label.textContent = window.codeNames[codeKey] || `コード${index + 1}`;
        }
    });
}

// フォーム要素初期化
function initializeFormElements() {
    // チェーン選択変更時のイベント
    const chainSelect = document.getElementById('chainName');
    if (chainSelect) {
        chainSelect.addEventListener('change', updateStoreOptions);
    }
    
    // 初期選択肢設定
    updateChainOptions();
    updateStoreOptions();
    updateProductOptions();
    updateClaimTypeOptions();
    updateCodeLabels();
}

// ログアウト
function handleLogout() {
    if (confirm('ログアウトしますか？')) {
        currentUser = null;
        currentImageData = null;
        analysisResult = null;
        visualJudgment = null;
        
        // 画面切り替え
        document.getElementById('mainScreen').classList.add('hidden');
        document.getElementById('authScreen').classList.remove('hidden');
        
        // フォームクリア
        document.getElementById('userId').value = '';
        document.getElementById('password').value = '';
        document.getElementById('loginError').classList.add('hidden');
        
        console.log('ログアウト完了');
    }
}

// マスタデータセクション開閉
window.toggleMasterDataSection = function() {
    const content = document.getElementById('masterDataContent');
    const icon = document.getElementById('masterDataToggleIcon');
    
    if (content && icon) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.textContent = '▼';
        } else {
            content.style.display = 'none';
            icon.textContent = '▶';
        }
    }
}

// 🔒 セキュリティ注意：以下の機能はSupabaseに移行済みのためコメントアウト
// COLOR_SETTINGS, COLOR_JUDGMENT_RULES, BANANA_COLOR_RANGESの管理機能は
// 企業秘密保護のため、Supabase関数として実装済み

console.log('🔒 バナナレポーター v8.0 統合版 読み込み完了');
console.log('⚡ 核心技術はSupabase関数で保護されています');
console.log('✅ 管理者機能・CSV/メール出力・スマホ対応を統合');
