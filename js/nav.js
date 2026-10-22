// Central navigation router for sidebar links
const allNavLinks = document.querySelectorAll('.nav-link');
allNavLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('nav.js: nav link clicked', link.dataset);
    const page = link.dataset.page;
    const view = link.dataset.view;

    // Defer active-state assignment to end of event loop so it overrides other handlers
    setTimeout(() => {
      document.querySelectorAll('.nav-link.active').forEach(n => n.classList.remove('active'));
      link.classList.add('active');
    }, 0);

    if (page && window.pageController && typeof window.pageController.selectPage === 'function') {
      window.pageController.selectPage(page);
      return;
    }

    if (view) {
      if (view === 'calendar' && window.calendarController && typeof window.calendarController.switchView === 'function') {
        window.calendarController.switchView('calendar');
        return;
      }

      if (view === 'completed' && window.completedController && typeof window.completedController.switchView === 'function') {
        window.completedController.switchView('completed');
        return;
      }

      if (view === 'profile' && typeof window.openProfileModal === 'function') {
        window.openProfileModal();
        return;
      }

      if (view === 'completed') {
        // No dedicated completed panel: show dashboard and log.
        if (window.pageController && typeof window.pageController.selectPage === 'function') {
          window.pageController.selectPage('dashboard');
        }
        console.log('nav: requested completed view (no dedicated panel)');
        return;
      }
    }

    // Ensure nav active state aligns with visible panel after handlers run
    setTimeout(() => {
      const activePanel = document.querySelector('.view-panel.active');
      document.querySelectorAll('.nav-link.active').forEach(n => n.classList.remove('active'));
      if (!activePanel) return;
      const view = activePanel.dataset.viewPanel;
      if (view === 'tasks') {
        const p = document.querySelector('.nav-link[data-page="dashboard"]');
        if (p) p.classList.add('active');
      } else if (view === 'studyPlan') {
        const p = document.querySelector('.nav-link[data-page="studyPlan"]');
        if (p) p.classList.add('active');
      } else if (view === 'calendar') {
        const p = document.querySelector('.nav-link[data-view="calendar"]');
        if (p) p.classList.add('active');
      }
    }, 50);
  });
});
