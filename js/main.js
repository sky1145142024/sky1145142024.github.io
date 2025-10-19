// 格式化日期函数
function formatDate(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString();
}

// 检查元素是否在视口中
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// 添加淡入动画
function fadeIn(element) {
  element.style.opacity = 0;
  let opacity = 0;
  const interval = setInterval(() => {
    if (opacity >= 1) {
      clearInterval(interval);
    }
    element.style.opacity = opacity;
    opacity += 0.1;
  }, 30);
}
