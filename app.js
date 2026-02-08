import { getSupabaseClient, checkAuth } from './auth.js';

let supabase;

// XSS対策
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 初期化
export async function initApp() {
    supabase = getSupabaseClient();
    await checkAuth();
    setupEventListeners();
}

// イベントリスナー設定
function setupEventListeners() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        });
    }
}

// 読み込む
export async function loadPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
                *,
                comments(count)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="no-posts">投稿がありません</div>';
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="post-item">
                <h3 class="post-title">${escapeHtml(post.title || '無題')}</h3>
                <div class="post-content">${escapeHtml(post.content || '').replace(/\n/g, '<br>')}</div>
                <div class="post-meta">
                    <span>${new Date(post.created_at).toLocaleString('ja-JP')}</span>
                    <span>💬 コメント: ${post.comments[0]?.count || 0}</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('投稿読み込みエラー:', error);
        container.innerHTML = '<div class="message-error">投稿の読み込みに失敗しました</div>';
    }
}

if (window.location.pathname.includes('post.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        supabase = getSupabaseClient();
        const user = await checkAuth();
        
        // 未ログインならログインページへ
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        const form = document.getElementById('post-form');
        const messageDiv = document.getElementById('form-message');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('post-title').value.trim();
            const content = document.getElementById('post-content').value.trim();
            
            // 入力検証
            if (!title || !content) {
                showMessage('タイトルと本文は必須です', 'error');
                return;
            }
            
            if (title.length > 100) {
                showMessage('タイトルは100文字以内で入力してください', 'error');
                return;
            }
            
            try {
                const { data, error } = await supabase
                    .from('posts')
                    .insert([
                        {
                            title: escapeHtml(title),
                            content: escapeHtml(content),
                            user_id: user.id
                        }
                    ])
                    .select();
                
                if (error) throw error;
                
                showMessage('投稿が成功しました！', 'success');
                form.reset();
                
                // 3秒後に一覧ページへ
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            } catch (error) {
                console.error('投稿エラー:', error);
                showMessage('投稿に失敗しました: ' + error.message, 'error');
            }
        });
        
        function showMessage(text, type) {
            messageDiv.textContent = text;
            messageDiv.className = `message-${type}`;
            messageDiv.style.display = 'block';
        }
    });
}
