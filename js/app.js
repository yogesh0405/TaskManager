const tasks = [
  {
    id: 1,
    title: 'Read Biology Notes',
    subject: 'Biology',
    date: '2026-08-12',
    priority: 'High',
    done: false
  },
  {
    id: 2,
    title: 'Complete Math Assignment',
    subject: 'Mathematics',
    date: '2026-08-14',
    priority: 'Medium',
    done: false
  },
  {
    id: 3,
    title: 'Prepare History Essay',
    subject: 'History',
    date: '2026-08-15',
    priority: 'Low',
    done: true
  }
];

const taskList = document.getElementById('tasksList');
const modal = document.getElementById('taskModal');
const openTaskFormButton = document.getElementById('openTaskForm');
const closeModalButton = document.getElementById('closeModal');
const cancelTaskButton = document.getElementById('cancelTask');
const taskForm = document.getElementById('taskForm');
const calendarDates = document.getElementById('calendarDates');
const calendarMonthLabel = document.getElementById('calendarMonthLabel');
const prevMonthButton = document.getElementById('prevMonthBtn');
const nextMonthButton = document.getElementById('nextMonthBtn');

window.taskManagerTasks = tasks;

const calendarState = {
  currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  selectedDate: new Date()
};

function formatDate(dateValue) {
  const date = new Date(dateValue + 'T00:00:00');
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDate(firstDate, secondDate) {
  return getDateKey(firstDate) === getDateKey(secondDate);
}

function renderCalendar() {
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric'
  }).format(calendarState.currentMonth);

  calendarMonthLabel.textContent = monthLabel;

  const monthStart = new Date(
    calendarState.currentMonth.getFullYear(),
    calendarState.currentMonth.getMonth(),
    1
  );

  const firstVisibleDay = new Date(monthStart);
  const offset = (monthStart.getDay() + 6) % 7;
  firstVisibleDay.setDate(monthStart.getDate() - offset);

  calendarDates.innerHTML = '';

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(firstVisibleDay);
    date.setDate(firstVisibleDay.getDate() + index);

    const dateButton = document.createElement('button');
    dateButton.type = 'button';
    dateButton.className = 'date-button';
    dateButton.textContent = date.getDate();

    if (date.getMonth() !== calendarState.currentMonth.getMonth()) {
      dateButton.classList.add('muted');
    }

    if (isSameDate(date, calendarState.selectedDate)) {
      dateButton.classList.add('active');
    }

    const hasTaskOnDate = tasks.some(task => task.date === getDateKey(date));
    if (hasTaskOnDate) {
      dateButton.classList.add('has-task');
    }

    dateButton.addEventListener('click', () => {
      calendarState.selectedDate = new Date(date);
      renderCalendar();
    });

    calendarDates.appendChild(dateButton);
  }
}

function calculateStats() {
  const activeTasks = tasks.filter(task => !task.done).length;
  const completedTasks = tasks.filter(task => task.done).length;

  document.getElementById('totalTasks').textContent = tasks.length;
  document.getElementById('activeTasks').textContent = activeTasks;
  document.getElementById('completedTasks').textContent = completedTasks;

  const percentage = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
  document.getElementById('progressFill').style.width = percentage + '%';
  document.getElementById('progressText').textContent = percentage + '%';

  const nextTask = tasks.find(task => !task.done) || tasks[0];
  if (nextTask) {
    document.getElementById('nextTaskTitle').textContent = nextTask.title;
    document.getElementById('nextTaskMeta').textContent = nextTask.subject + ' • ' + formatDate(nextTask.date);
  } else {
    document.getElementById('nextTaskTitle').textContent = 'No active task';
    document.getElementById('nextTaskMeta').textContent = 'Add your next study task';
  }
}

function renderTasks() {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskList.innerHTML = `<div class="empty-state">
      <strong>No tasks yet</strong>
      <span>Add your first class task to begin.</span>
    </div>`;
    calculateStats();
    return;
  }

  tasks.forEach(task => {
    const article = document.createElement('article');
    article.className = 'task-item' + (task.done ? ' done' : '');

    const priorityClass = task.priority.toLowerCase();

    article.innerHTML = `
      <div class="left-side">
        <button class="checkbox ${task.done ? 'checked' : ''}" aria-label="Mark task completed">
          <span class="checkmark">✓</span>
        </button>
        <div>
          <div class="task-title">${task.title}</div>
          <span class="task-subject">${task.subject}</span>
          <span class="task-date">Due ${formatDate(task.date)}</span>
        </div>
      </div>
      <div class="task-actions">
        <span class="priority-badge ${priorityClass}">${task.priority}</span>
        <button class="delete-button delete-task">Delete</button>
      </div>
    `;

    const checkbox = article.querySelector('.checkbox');
    checkbox.addEventListener('click', () => {
      task.done = !task.done;
      renderTasks();
    });

    const deleteButton = article.querySelector('.delete-task');
    deleteButton.addEventListener('click', () => {
      const index = tasks.findIndex(item => item.id === task.id);
      if (index !== -1) {
        tasks.splice(index, 1);
        renderTasks();
      }
    });

    taskList.appendChild(article);
  });

  calculateStats();
  if (window.calendarController && typeof window.calendarController.render === 'function') {
    window.calendarController.render();
  }
}

function openModal() {
  modal.classList.add('open');
}

function closeModal() {
  modal.classList.remove('open');
}

openTaskFormButton.addEventListener('click', openModal);
closeModalButton.addEventListener('click', closeModal);
cancelTaskButton.addEventListener('click', closeModal);

modal.addEventListener('click', event => {
  if (event.target === modal) {
    closeModal();
  }
});

taskForm.addEventListener('submit', event => {
  event.preventDefault();

  const title = document.getElementById('taskTitle').value.trim();
  const subject = document.getElementById('taskSubject').value.trim();
  const date = document.getElementById('taskDate').value;
  const priority = document.getElementById('taskPriority').value;

  if (!title || !subject || !date) {
    return;
  }

  tasks.push({
    id: Date.now(),
    title,
    subject,
    date,
    priority,
    done: false
  });

  taskForm.reset();
  closeModal();
  renderTasks();
  window.taskManagerTasks = tasks;
});

function setupDate() {
  const date = new Date();
  const day = date.toLocaleDateString(undefined, { weekday: 'long' });
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  const dayNumber = date.getDate();

  document.getElementById('todayDay').textContent = day;
  document.getElementById('todayDate').textContent = `${dayNumber} ${month}`;
}

prevMonthButton.addEventListener('click', () => {
  calendarState.currentMonth = new Date(
    calendarState.currentMonth.getFullYear(),
    calendarState.currentMonth.getMonth() - 1,
    1
  );
  renderCalendar();
});

nextMonthButton.addEventListener('click', () => {
  calendarState.currentMonth = new Date(
    calendarState.currentMonth.getFullYear(),
    calendarState.currentMonth.getMonth() + 1,
    1
  );
  renderCalendar();
});

setupDate();
renderCalendar();
renderTasks();
