// 全局 auth 实例
let auth;

// 初始化 Firebase 认证
function initAuth() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase 未加载，请检查 config.js');
    return;
  }
  firebase.initializeApp(config.firebase);
  auth = firebase.auth();
}

// 页面加载时初始化
window.addEventListener('DOMContentLoaded', initAuth);

/**
 * GitHub 登录（不请求邮箱权限）
 */
function githubLogin() {
  if (!auth) {
    alert('认证服务未初始化，请刷新页面重试');
    return;
  }

  const provider = new firebase.auth.GithubAuthProvider();
  // 只请求基本资料权限（无需邮箱）
  provider.addScope('read:user'); // 获取用户名、头像等公开信息
  auth.signInWithRedirect(provider);
}

/**
 * 处理 GitHub 授权回调（核心修改：不依赖邮箱）
 */
async function handleGitHubCallback() {
  if (!auth) return;

  try {
    // 1. 从 URL 提取临时 code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) return;

    // 2. 调用后端交换 Token
    const exchangeResponse = await fetch('https://github-oauth-proxy-cyan.vercel.app/api/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!exchangeResponse.ok) {
      const error = await exchangeResponse.json();
      throw new Error(`后端错误：${error.error}`);
    }
    const { token } = await exchangeResponse.json();
    if (!token) throw new Error('未获取到 Token');

    // 3. 用 Token 登录 Firebase
    const credential = firebase.auth.GithubAuthProvider.credential(token);
    const { user } = await auth.signInWithCredential(credential);

    // 4. 手动获取 GitHub 公开资料并更新到 Firebase（关键：不依赖邮箱）
    const githubUserRes = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `token ${token}` }
    });
    const githubUser = await githubUserRes.json();

    // 更新 Firebase 用户信息（用户名、头像）
    await user.updateProfile({
      displayName: githubUser.login || 'GitHub 用户', // GitHub 用户名
      photoURL: githubUser.avatar_url || 'https://via.placeholder.com/150' // GitHub 头像
    });

    // 5. 登录成功，跳转到个人中心
    window.location.href = 'dashboard.html';

  } catch (error) {
    console.error('登录失败:', error);
    alert('登录失败，请重试');
    window.location.href = 'login.html';
  }
}

/**
 * 检查登录状态（用于个人中心页面）
 */
function checkAuthStatus() {
  return new Promise((resolve, reject) => {
    if (!auth) return reject('认证未初始化');
    auth.onAuthStateChanged(user => user ? resolve(user) : reject('未登录'));
  });
}

/**
 * 退出登录
 */
function logout() {
  if (auth) {
    auth.signOut().then(() => window.location.href = 'index.html');
  }
}

// 登录页自动处理回调
if (window.location.pathname.includes('login.html')) {
  window.addEventListener('load', handleGitHubCallback);
}
