// 加载可接取的任务
async function loadAvailableTasks(currentUserId) {
  try {
    const tasksRef = db.collection('tasks')
      .where('status', '==', 'available')
      .where('publisherId', '!=', currentUserId)
      .orderBy('createdAt', 'desc');
      
    const snapshot = await tasksRef.get();
    const tasksList = document.getElementById('tasksList');
    
    if (snapshot.empty) {
      tasksList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fa fa-inbox text-2xl mb-2"></i>
          <p>暂无可用任务</p>
        </div>
      `;
      return;
    }
    
    tasksList.innerHTML = '';
    
    snapshot.forEach(doc => {
      const task = doc.data();
      const taskId = doc.id;
      
      // 格式化日期
      const deadline = new Date(task.deadline.seconds * 1000);
      const formattedDate = deadline.toLocaleDateString();
      
      const taskElement = document.createElement('div');
      taskElement.className = 'bg-white rounded-lg shadow-md p-6';
      taskElement.innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">${task.title}</h3>
          <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">可接取</span>
        </div>
        
        <p class="text-gray-600 mb-4">${task.description}</p>
        
        <div class="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
          <div><i class="fa fa-calendar mr-1"></i> 截止日期: ${formattedDate}</div>
          <div><i class="fa fa-user mr-1"></i> 发布者: ${task.publisherName}</div>
        </div>
        
        <div class="flex justify-end">
          <button class="accept-task-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md" 
                  data-task-id="${taskId}">
            接取任务
          </button>
        </div>
      `;
      
      tasksList.appendChild(taskElement);
    });
    
    // 为接取任务按钮添加事件监听
    document.querySelectorAll('.accept-task-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const taskId = e.target.getAttribute('data-task-id');
        await acceptTask(taskId, currentUserId);
      });
    });
    
  } catch (error) {
    console.error('Error loading tasks:', error);
    document.getElementById('tasksList').innerHTML = `
      <div class="text-center py-8 text-red-500">
        <i class="fa fa-exclamation-triangle text-2xl mb-2"></i>
        <p>加载任务失败，请重试</p>
      </div>
    `;
  }
}

// 接取任务
async function acceptTask(taskId, userId) {
  try {
    const user = await auth.currentUser;
    const taskRef = db.collection('tasks').doc(taskId);
    
    // 检查任务状态
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists || taskDoc.data().status !== 'available') {
      alert('该任务已被接取或不存在');
      return;
    }
    
    // 更新任务状态
    await taskRef.update({
      status: 'inProgress',
      assigneeId: userId,
      assigneeName: user.displayName,
      assigneeAvatar: user.photoURL,
      acceptedAt: new Date()
    });
    
    alert('任务接取成功！');
    window.location.href = 'dashboard.html';
    
  } catch (error) {
    console.error('Error accepting task:', error);
    alert('接取任务失败，请重试');
  }
}
