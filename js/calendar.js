const calendarController = (() => {
  const navLinks = document.querySelectorAll('.nav-link');
  const panels = document.querySelectorAll('.view-panel');
  const calendarGrid = document.getElementById('calendarGrid');
  const calendarHeaderMonth = document.getElementById('calendarHeaderMonth');
  const selectedDateLabel = document.getElementById('selectedDateLabel');
  const selectedDayTasks = document.getElementById('selectedDayTasks');
  const prevBtn = document.getElementById('calendarPrevBtn');
  const nextBtn = document.getElementById('calendarNextBtn');

  const state = {
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    selectedDate: new Date()
  };

  function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(dateValue) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateValue + 'T00:00:00'));
  }

  function switchView(viewName) {
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.dataset.viewPanel === viewName);
    });

    navLinks.forEach(link => {
      const active = link.dataset.view === viewName;
      link.classList.toggle('active', active);
    });
  }

  function getTasksForDate(dateKey) {
    const tasks = window.taskManagerTasks || [];
    return tasks.filter(task => task.date === dateKey);
  }

  function renderSelectedDate() {
    const key = getDateKey(state.selectedDate);
    const tasksForDay = getTasksForDate(key);

    selectedDateLabel.textContent = formatDisplayDate(key);
    selectedDayTasks.innerHTML = '';

    if (!tasksForDay.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'No tasks scheduled for this day.';
      selectedDayTasks.appendChild(empty);
      return;
    }

    tasksForDay.forEach(task => {
      const item = document.createElement('li');
      item.innerHTML = `
        <span class="task-subject">${task.subject}</span>
        <span class="task-name">${task.title}</span>
      `;
      selectedDayTasks.appendChild(item);
    });
  }

  function render() {
    const label = new Intl.DateTimeFormat(undefined, {
      month: 'long',
      year: 'numeric'
    }).format(state.currentMonth);

    calendarHeaderMonth.textContent = label;

    const monthStart = new Date(
      state.currentMonth.getFullYear(),
      state.currentMonth.getMonth(),
      1
    );

    const firstVisibleDay = new Date(monthStart);
    const offset = (monthStart.getDay() + 6) % 7;
    firstVisibleDay.setDate(monthStart.getDate() - offset);

    calendarGrid.innerHTML = '';

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(firstVisibleDay);
      date.setDate(firstVisibleDay.getDate() + index);

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'calendar-day';

      if (date.getMonth() !== state.currentMonth.getMonth()) {
        cell.classList.add('muted');
      }

      if (getDateKey(date) === getDateKey(state.selectedDate)) {
        cell.classList.add('selected');
      }

      const tasksForThisDay = getTasksForDate(getDateKey(date));

      cell.innerHTML = `
        <span class="calendar-date">${date.getDate()}</span>
        ${tasksForThisDay.length ? '<span class="calendar-dot"></span>' : ''}
        <div class="calendar-task-list">
          ${tasksForThisDay.slice(0, 2).map(task => `<span>${task.title}</span>`).join('')}
        </div>
      `;

      cell.addEventListener('click', () => {
        state.selectedDate = new Date(date);
        render();
      });

      calendarGrid.appendChild(cell);
    }

    renderSelectedDate();
  }

  navLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const viewName = link.dataset.view || 'tasks';
      if (viewName === 'calendar') {
        switchView('calendar');
      } else {
        switchView('tasks');
      }
    });
  });

  prevBtn.addEventListener('click', () => {
    state.currentMonth = new Date(
      state.currentMonth.getFullYear(),
      state.currentMonth.getMonth() - 1,
      1
    );
    render();
  });

  nextBtn.addEventListener('click', () => {
    state.currentMonth = new Date(
      state.currentMonth.getFullYear(),
      state.currentMonth.getMonth() + 1,
      1
    );
    render();
  });

  switchView('tasks');
  render();

  return {
    render,
    switchView,
    state
  };
})();

window.calendarController = calendarController;
