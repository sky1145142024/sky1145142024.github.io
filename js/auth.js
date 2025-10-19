// 全新的 js/auth.js（彻底解决 auth 重复声明问题）
// 用立即执行函数包裹，避免全局变量污染
(function(window) {
  // 内部变量，不直接暴露到全局，避免冲突
  let internalAuth;

  // 初始化 Firebase 认证
  function initAuth() {
    if (typeof firebase === 'undefined') {
      console.error('请先加载 Firebase 脚本');
      return;
    }
    // 确保 Firebase 只初始化一次
    if (!firebase.apps.length) {
      firebase.initializeApp(config.firebase);
    }
    internalAuth = firebase.auth();
  }

  // GitHub 登录（暴露到全局）
  function githubLogin() {
    if (!internalAuth) {
      alert('登录服务未准备好，请刷新页面');
      return;
    }
    const provider = new firebase.auth.GithubAuthProvider();
    provider.addScope('read:user'); // 仅请求公开资料
    internalAuth.signInWithRedirect(provider);
  }

  // 处理登录回调
  async function handleGitHubCallback() {
    if (!internalAuth) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (!code) return;

      // 调用后端交换 Token
      const res = await fetch('https://github-oauth-proxy-cyan.vercel.app/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const { token } = await res.json();
      if (!token) throw new Error('未获取到 Token');

      // 登录 Firebase
      const credential = firebase.auth.GithubAuthProvider.credential(token);
      const { user } = await internalAuth.signInWithCredential(credential);

      // 获取 GitHub 资料并更新
      const githubUser = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${token}` }
      }).then(r => r.json());

      await user.updateProfile({
        displayName: githubUser.login,
        photoURL: githubUser.avatar_url
      });

      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('登录失败:', err);
      alert('登录失败，请重试');
      window.location.href = 'login.html';
    }
  }

  // 检查登录状态
  function checkAuthStatus() {
    return new Promise((resolve, reject) => {
      if (!internalAuth) return reject('未初始化');
      internalAuth.onAuthStateChanged(user => user ? resolve(user) : reject('未登录'));
    });
  }

  // 退出登录
  function logout() {
    if (internalAuth) {
      internalAuth.signOut().then(() => window.location.href = 'index.html');
    }
  }

  // 页面加载时初始化
  window.addEventListener('DOMContentLoaded', initAuth);

  // 登录页自动处理回调
  if (window.location.pathname.includes('login.html')) {
    window.addEventListener('load', handleGitHubCallback);
  }

  // 只暴露需要的函数到全局，避免变量冲突
  window.authUtils = {
    githubLogin,
    checkAuthStatus,
    logout
  };

})(window);
