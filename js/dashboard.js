// 加载我发布的任务
async function loadPublishedTasks(userId) {
  try {
    const tasksRef = db.collection('tasks')
      .where('publisherId', '==', userId)
      .orderBy('createdAt', 'desc');
      
    const snapshot = await tasksRef.get();
    const tasksList = document.getElementById('publishedTasksList');
    
    if (snapshot.empty) {
      tasksList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fa fa-pencil text-2xl mb-2"></i>
          <p>你还没有发布任何任务</p>
          <a href="create-task.html" class="text-blue-600 hover:underline mt-2 inline-block">发布第一个任务</a>
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
      
      // 任务状态标签
      let statusLabel = '';
      switch(task.status) {
        case 'available':
          statusLabel = '<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">待接取</span>';
          break;
        case 'inProgress':
          statusLabel = `<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          进行中 (由 ${task.assigneeName} 接取)
                        </span>`;
          break;
        case 'completed':
          statusLabel = '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">已完成</span>';
          break;
      }
      
      const taskElement = document.createElement('div');
      taskElement.className = 'bg-white rounded-lg shadow-md p-6';
      taskElement.innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">${task.title}</h3>
          ${statusLabel}
        </div>
        
        <p class="text-gray-600 mb-4">${task.description}</p>
        
        <div class="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
          <div><i class="fa fa-calendar mr-1"></i> 截止日期: ${formattedDate}</div>
        </div>
        
        <div class="flex justify-end gap-2">
          ${task.status === 'available' ? `
            <button class="delete-task-btn bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md" 
                    data-task-id="${taskId}">
              删除任务
            </button>
          ` : ''}
          
          ${task.status === 'inProgress' ? `
            <button class="complete-task-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md" 
                    data-task-id="${taskId}">
              标记为已完成
            </button>
          ` : ''}
        </div>
      `;
      
      tasksList.appendChild(taskElement);
    });
    
    // 为删除任务按钮添加事件监听
    document.querySelectorAll('.delete-task-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const taskId = e.target.getAttribute('data-task-id');
        if (confirm('确定要删除这个任务吗？')) {
          await deleteTask(taskId);
        }
      });
    });
    
    // 为标记完成按钮添加事件监听
    document.querySelectorAll('.complete-task-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const taskId = e.target.getAttribute('data-task-id');
        await markTaskAsCompleted(taskId);
      });
    });
    
  } catch (error) {
    console.error('Error loading published tasks:', error);
    document.getElementById('publishedTasksList').innerHTML = `
      <div class="text-center py-8 text-red-500">
        <i class="fa fa-exclamation-triangle text-2xl mb-2"></i>
        <p>加载任务失败，请重试</p>
      </div>
    `;
  }
}

// 加载我接取的任务
async function loadAcceptedTasks(userId) {
  try {
    const tasksRef = db.collection('tasks')
      .where('assigneeId', '==', userId)
      .orderBy('acceptedAt', 'desc');
      
    const snapshot = await tasksRef.get();
    const tasksList = document.getElementById('acceptedTasksList');
    
    if (snapshot.empty) {
      tasksList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fa fa-hand-pointer-o text-2xl mb-2"></i>
          <p>你还没有接取任何任务</p>
          <a href="tasks.html" class="text-blue-600 hover:underline mt-2 inline-block">浏览可接取的任务</a>
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
      
      // 任务状态标签
      let statusLabel = '';
      switch(task.status) {
        case 'inProgress':
          statusLabel = '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">进行中</span>';
          break;
        case 'completed':
          statusLabel = '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">已完成</span>';
          break;
      }
      
      const taskElement = document.createElement('div');
      taskElement.className = 'bg-white rounded-lg shadow-md p-6';
      taskElement.innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">${task.title}</h3>
          ${statusLabel}
        </div>
        
        <p class="text-gray-600 mb-4">${task.description}</p>
        
        <div class="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
          <div><i class="fa fa-calendar mr-1"></i> 截止日期: ${formattedDate}</div>
          <div><i class="fa fa-user mr-1"></i> 发布者: ${task.publisherName}</div>
        </div>
        
        <div class="flex justify-end">
          ${task.status === 'inProgress' ? `
            <button class="submit-task-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md" 
                    data-task-id="${taskId}">
              提交完成
            </button>
          ` : ''}
        </div>
      `;
      
      tasksList.appendChild(taskElement);
    });
    
    // 为提交完成按钮添加事件监听
    document.querySelectorAll('.submit-task-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const taskId = e.target.getAttribute('data-task-id');
        if (confirm('确定已完成该任务吗？')) {
          await submitTaskCompletion(taskId);
        }
      });
    });
    
  } catch (error) {
    console.error('Error loading accepted tasks:', error);
    document.getElementById('acceptedTasksList').innerHTML = `
      <div class="text-center py-8 text-red-500">
        <i class="fa fa-exclamation-triangle text-2xl mb-2"></i>
        <p>加载任务失败，请重试</p>
      </div>
    `;
  }
}

// 删除任务
async function deleteTask(taskId) {
  try {
    await db.collection('tasks').doc(taskId).delete();
    loadPublishedTasks(auth.currentUser.uid);
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('删除任务失败，请重试');
  }
}

// 标记任务为已完成（发布者操作）
async function markTaskAsCompleted(taskId) {
  try {
    await db.collection('tasks').doc(taskId).update({
      status: 'completed',
      completedAt: new Date()
    });
    loadPublishedTasks(auth.currentUser.uid);
  } catch (error) {
    console.error('Error marking task as completed:', error);
    alert('操作失败，请重试');
  }
}

// 提交任务完成（接取者操作）
async function submitTaskCompletion(taskId) {
  try {
    await db.collection('tasks').doc(taskId).update({
      status: 'pendingApproval',
      submittedAt: new Date()
    });
    loadAcceptedTasks(auth.currentUser.uid);
    alert('已提交完成，请等待发布者确认');
  } catch (error) {
    console.error('Error submitting task completion:', error);
    alert('操作失败，请重试');
  }
}
