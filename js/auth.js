// 检查用户是否已登录
function checkAuthStatus() {
  return new Promise((resolve, reject) => {
    // 使用兼容版 Firebase API（对应 -compat 库）
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        resolve(user); // 已登录，返回用户信息
      } else {
        reject(new Error('用户未登录')); // 未登录，返回错误
      }
    });
  });
}

// GitHub 登录函数（核心，供登录按钮调用）
function githubLogin() {
  // 从 config 中获取 GitHub 应用配置
  const clientId = config.github.clientId;
  const redirectUri = config.github.redirectUri;
  
  // 构建 GitHub 授权 URL（请求用户邮箱权限）
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  
  // 跳转到 GitHub 授权页面
  window.location.href = githubAuthUrl;
}

// 处理 GitHub 登录回调（在 login.html 中调用）
async function handleGitHubCallback() {
  // 从 URL 中获取 GitHub 返回的临时 code
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    try {
      // 显示加载状态（需在 login.html 中有 id 为 loading 的元素）
      document.getElementById('loading').classList.remove('hidden');
      
      // 调用 Vercel 函数交换 Token（替换为你的函数 URL）
      const response = await fetch('https://github-oauth-proxy-cyan.vercel.app/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code })
      });
      
      const data = await response.json();
      
      if (data.token) {
        // 使用 GitHub Token 登录 Firebase
        const credential = firebase.auth.GithubAuthProvider.credential(data.token);
        await firebase.auth().signInWithCredential(credential);
        
        // 登录成功，跳转到个人中心
        window.location.href = 'dashboard.html';
      } else {
        throw new Error('未获取到 Token');
      }
    } catch (error) {
      console.error('登录失败:', error);
      alert('登录失败，请重试');
      // 隐藏加载状态，允许用户重新尝试
      document.getElementById('loading').classList.add('hidden');
    }
  }
}

// 退出登录函数
async function logout() {
  try {
    await firebase.auth().signOut();
    // 退出后跳转到首页
    window.location.href = 'index.html';
  } catch (error) {
    console.error('退出登录失败:', error);
    alert('退出失败，请重试');
  }
}
