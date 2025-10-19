async function handleGitHubCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (code) {
    try {
      // 替换为你的 Vercel 函数 URL
      const response = await fetch('https://github-oauth-proxy-cyan.vercel.app/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // 必须加，否则后端解析不了
        body: JSON.stringify({ code: code })
      });
      const data = await response.json();
      if (data.token) {
        // 用 Firebase 关联 GitHub Token，完成登录
        const credential = firebase.auth.GithubAuthProvider.credential(data.token);
        await auth.signInWithCredential(credential);
        window.location.href = 'dashboard.html'; // 登录成功跳个人中心
      }
    } catch (error) {
      console.error('登录失败：', error);
      alert('登录失败，请重试');
    }
  }
}
