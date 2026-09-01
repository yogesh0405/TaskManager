const completedController = (() => {
  const completedList = document.getElementById('completedList');
  const completedCount = document.getElementById('completedCount');
  const completedMeta = document.getElementById('completedMeta');
  const panels = document.querySelectorAll('.view-panel');

  function render() {
    const tasks = window.taskManagerTasks || [];
    const completed = tasks.filter(t => t.done === true || t.done === 'true');

    completedList.innerHTML = '';

    if (completed.length === 0) {
      completedList.innerHTML = `<div class="empty-state"><strong>No completed tasks</strong><span>Finish tasks to see them here.</span></div>`;
      completedCount.textContent = '0';
      completedMeta.textContent = 'No completed tasks yet.';
      return;
    }

    completed.forEach(task => {
      const article = document.createElement('article');
      article.className = 'task-item done';
      article.innerHTML = `
        <div class="left-side">
          <div>
            <div class="task-title">${task.title}</div>
            <span class="task-subject">${task.subject || ''}</span>
            <span class="task-date">Due ${new Date(task.date + 'T00:00:00').toLocaleDateString()}</span>
          </div>
        </div>
        <div class="task-actions">
          <span class="priority-badge">${task.priority || ''}</span>
          <button class="delete-button delete-task" data-id="${task.id}">Delete</button>
        </div>
      `;

      const deleteBtn = article.querySelector('.delete-task');
      deleteBtn.addEventListener('click', () => {
        const idx = (window.taskManagerTasks || []).findIndex(t => t.id === task.id);
        if (idx !== -1) {
          window.taskManagerTasks.splice(idx, 1);
          render();
          if (window.renderTasks) window.renderTasks();
          if (window.renderStudyPlan) window.renderStudyPlan && window.renderStudyPlan();
        }
      });

      completedList.appendChild(article);
    });

    completedCount.textContent = String(completed.length);
    completedMeta.textContent = `${completed.length} task${completed.length > 1 ? 's' : ''} completed`;
  }

  function switchView(viewName) {
    panels.forEach(panel => panel.classList.toggle('active', panel.dataset.viewPanel === viewName));
    // ensure render when shown
    if (viewName === 'completed') render();
  }

  // expose
  return { render, switchView };
})();

window.completedController = completedController;
