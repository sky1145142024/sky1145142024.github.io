// 全局 auth 实例
let auth;

// 初始化 Firebase 认证（依赖 config.js 中的配置）
function initAuth() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase 未加载，请检查 config.js');
    return;
  }
  
  // 初始化 Firebase 应用（确保与 config.js 配置一致）
  firebase.initializeApp(config.firebase);
  auth = firebase.auth();
}

// 页面加载时初始化认证
window.addEventListener('DOMContentLoaded', initAuth);

/**
 * GitHub 登录函数（触发登录流程）
 */
function githubLogin() {
  if (!auth) {
    alert('认证服务未初始化，请刷新页面重试');
    return;
  }

  // 创建 GitHub 授权提供者
  const provider = new firebase.auth.GithubAuthProvider();
  
  // 关键：请求必要的权限（必须包含 user:email，否则 Firebase 验证失败）

  provider.addScope('read:user'); // 获取用户基本信息（头像、名称等）

  // 重定向到 GitHub 授权页
  auth.signInWithRedirect(provider)
    .catch(error => {
      console.error('登录跳转失败:', error);
      alert('登录失败：' + error.message);
    });
}

/**
 * 处理 GitHub 授权回调（登录页加载时执行）
 */
async function handleGitHubCallback() {
  if (!auth) {
    console.error('auth 实例未初始化');
    return;
  }

  try {
    // 1. 从 URL 中提取 GitHub 回调的临时 code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) {
      console.log('未检测到授权 code，可能不是回调请求');
      return;
    }

    // 2. 调用 Vercel 后端交换 access_token
    const exchangeResponse = await fetch('https://github-oauth-proxy-cyan.vercel.app/api/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ code: code })
    });

    if (!exchangeResponse.ok) {
      const errorData = await exchangeResponse.json();
      throw new Error(`后端交换失败：${errorData.error || '未知错误'}`);
    }

    const { token } = await exchangeResponse.json();
    if (!token) {
      throw new Error('未从后端获取到有效的 access_token');
    }

    // 3. 使用获取到的 Token 完成 Firebase 登录
    const credential = firebase.auth.GithubAuthProvider.credential(token);
    const userCredential = await auth.signInWithCredential(credential);
    
    // 4. 登录成功，跳转到个人中心
    window.location.href = 'dashboard.html';

  } catch (error) {
    console.error('登录回调处理失败:', error);
    // 错误分类提示
    let errorMsg = '登录失败，请重试';
    if (error.message.includes('Bad credentials')) {
      errorMsg = 'GitHub 授权信息无效，请重新授权';
    } else if (error.message.includes('未获取到 Token')) {
      errorMsg = '获取授权信息失败，请重试';
    }
    alert(errorMsg);
    // 跳回登录页重新尝试
    window.location.href = 'login.html';
  }
}

/**
 * 检查当前登录状态
 * @returns {Promise} 已登录则返回用户信息，未登录则 reject
 */
function checkAuthStatus() {
  return new Promise((resolve, reject) => {
    if (!auth) {
      reject('认证服务未初始化');
      return;
    }

    auth.onAuthStateChanged(user => {
      if (user) {
        // 用户已登录，返回用户信息
        resolve(user);
      } else {
        // 用户未登录
        reject('未登录');
      }
    });
  });
}

/**
 * 退出登录
 */
function logout() {
  if (!auth) return;
  
  auth.signOut()
    .then(() => {
      // 退出成功，跳回首页
      window.location.href = 'index.html';
    })
    .catch(error => {
      console.error('退出登录失败:', error);
      alert('退出失败：' + error.message);
    });
}

// 登录页自动处理回调（如果是从 GitHub 授权后跳转回来的）
if (window.location.pathname.includes('login.html')) {
  // 页面加载完成后处理回调
  window.addEventListener('load', handleGitHubCallback);
}

