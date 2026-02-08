// auth.js - 認証関連の処理
import { loadConfig } from './config.js';

let supabase;
let currentUser = null;

export function getSupabaseClient() {
    if (!supabase) {
        const config = loadConfig();
        supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
    }
    return supabase;
}




export async function checkAuth() {
    try {
        const supabase = getSupabaseClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        currentUser = session?.user || null;
        updateUI();
        
        return currentUser;
    } catch (error) {
        console.error('認証チェックエラー:', error);
        return null;
    }
}


function updateUI() {
    const userEmail = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');
    const loginBtn = document.getElementById('login-btn');
    const newPostLink = document.getElementById('new-post-link');
    
    if (userEmail) {
        userEmail.textContent = currentUser ? 
            `ユーザー: ${escapeHtml(currentUser.email)}` : 
            '未ログイン';
    }
    
    if (logoutBtn) logoutBtn.style.display = currentUser ? 'inline-block' : 'none';
    if (loginBtn) loginBtn.style.display = currentUser ? 'none' : 'inline-block';
    if (newPostLink) newPostLink.style.display = currentUser ? 'inline-block' : 'none';
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        supabase = getSupabaseClient();
        
        const form = document.getElementById('auth-form');
        const messageDiv = document.getElementById('auth-message');
        const signupBtn = document.getElementById('signup-btn');
        const loginBtn = document.getElementById('login-btn');
        
        let currentAction = 'signup';
        
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentAction = 'signup';
            signupBtn.style.background = '#3498db';
            loginBtn.style.background = '#95a5a6';
        });
        
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentAction = 'login';
            loginBtn.style.background = '#2ecc71';
            signupBtn.style.background = '#95a5a6';
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            // 入力検証
            if (!email || !password) {
                showMessage('メールアドレスとパスワードを入力してください', 'error');
                return;
            }
            
            if (password.length < 6) {
                showMessage('パスワードは6文字以上で入力してください', 'error');
                return;
            }
            
            try {
                let result;
                
                if (currentAction === 'signup') {
                    result = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            emailRedirectTo: window.location.origin + '/index.html'
                        }
                    });
                } else {
                    result = await supabase.auth.signInWithPassword({
                        email,
                        password
                    });
                }
                
                if (result.error) throw result.error;
                
                showMessage(
                    currentAction === 'signup' ? 
                    '登録完了しました！確認メールを送信しました。' :
                    'ログイン成功！',
                    'success'
                );
                
                // 2秒後に掲示板ページへ
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            } catch (error) {
                console.error('認証エラー:', error);
                showMessage(`エラー: ${error.message}`, 'error');
            }
        });
        
        function showMessage(text, type) {
            messageDiv.textContent = text;
            messageDiv.className = `message-${type}`;
            messageDiv.style.display = 'block';
        }
    });
}
