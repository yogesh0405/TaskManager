const studyPlanList = document.getElementById('studyPlanList');
const studyPlanForm = document.getElementById('studyPlanForm');
const planTotal = document.getElementById('planTotal');
const planCompleted = document.getElementById('planCompleted');
const dashboardPage = document.getElementById('dashboardPage');
const studyPlanPage = document.getElementById('studyPlanPage');
const navLinks = document.querySelectorAll('.nav-link[data-page]');

const studyPlanItems = [
  {
    id: 101,
    title: 'Review calculus notes',
    date: '2026-08-12',
    completed: false
  },
  {
    id: 102,
    title: 'Practice vocabulary flashcards',
    date: '2026-08-13',
    completed: false
  }
];

function formatDisplayDate(value) {
  const date = new Date(value + 'T00:00:00');
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function renderStudyPlan() {
  studyPlanList.innerHTML = '';

  if (studyPlanItems.length === 0) {
    studyPlanList.innerHTML = `<div class="empty-state">
      <strong>No study items yet</strong>
      <span>Add a plan item to get started.</span>
    </div>`;
  }

  studyPlanItems.forEach(item => {
    const article = document.createElement('article');
    article.className = `plan-item${item.completed ? ' done' : ''}`;
    article.innerHTML = `
      <div class="plan-details">
        <span class="plan-title">${item.title}</span>
        <span class="plan-meta">${formatDisplayDate(item.date)}</span>
      </div>
      <div class="plan-actions">
        <button class="complete-button" data-id="${item.id}">${item.completed ? 'Undo' : 'Complete'}</button>
        <button class="delete-button" data-id="${item.id}">Delete</button>
      </div>
    `;

    studyPlanList.appendChild(article);
  });

  calculateStudyStats();
}

function calculateStudyStats() {
  const completed = studyPlanItems.filter(item => item.completed).length;
  planTotal.textContent = studyPlanItems.length;
  planCompleted.textContent = completed;
}

function toggleStudyItem(id) {
  const item = studyPlanItems.find(task => task.id === id);
  if (item) {
    item.completed = !item.completed;
    renderStudyPlan();
  }
}

function deleteStudyItem(id) {
  const index = studyPlanItems.findIndex(item => item.id === id);
  if (index !== -1) {
    studyPlanItems.splice(index, 1);
    renderStudyPlan();
  }
}

function selectPage(pageKey) {
  dashboardPage.classList.toggle('hidden', pageKey !== 'dashboard');
  studyPlanPage.classList.toggle('hidden', pageKey !== 'studyPlan');

  navLinks.forEach(link => {
    if (link.dataset.page === pageKey) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

studyPlanForm.addEventListener('submit', event => {
  event.preventDefault();

  const title = document.getElementById('studyTopic').value.trim();
  const date = document.getElementById('studyDatePlan').value;

  if (!title || !date) {
    return;
  }

  studyPlanItems.push({
    id: Date.now(),
    title,
    date,
    completed: false
  });

  studyPlanForm.reset();
  renderStudyPlan();
});

studyPlanList.addEventListener('click', event => {
  const target = event.target;
  const id = Number(target.dataset.id);

  if (target.classList.contains('complete-button')) {
    toggleStudyItem(id);
  }

  if (target.classList.contains('delete-button')) {
    deleteStudyItem(id);
  }
});

navLinks.forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const pageKey = link.dataset.page;
    if (pageKey) {
      selectPage(pageKey);
    }
  });
});

renderStudyPlan();
selectPage('dashboard');
