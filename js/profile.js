// Profile Management

const profileModal = document.getElementById('profileModal');
const profileMenuLink = document.querySelector('.nav-link[data-view="profile"]');
const closeProfileButton = document.getElementById('closeProfile');
const editProfileBtn = document.getElementById('editProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Sample student profile data
let studentProfile = {
    name: 'John Doe',
    email: 'john.doe@university.edu',
    studentId: 'STU-2026-0847',
    course: 'Computer Science'
};

// Open Profile Modal
function openProfileModal() {
    profileModal.classList.add('open');
    updateProfileStats();
}

// expose for nav routing
window.openProfileModal = openProfileModal;

// Close Profile Modal
function closeProfileModal() {
    profileModal.classList.remove('open');
}

// Update Profile Info
function updateProfileInfo() {
    document.getElementById('profileName').textContent = studentProfile.name;
    document.getElementById('profileEmail').textContent = studentProfile.email;
    document.getElementById('profileId').textContent = studentProfile.studentId;
    document.getElementById('profileCourse').textContent = studentProfile.course;
}

// Update Profile Stats from Tasks
function updateProfileStats() {
    // Get tasks from localStorage or global tasks array
    const tasksData = typeof tasks !== 'undefined' ? tasks : [];

    const totalTasks = tasksData.length;
    const completedTasks = tasksData.filter(task => task.done).length;
    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    document.getElementById('profileTasksCount').textContent = totalTasks;
    document.getElementById('profileCompletedCount').textContent = completedTasks;
    document.getElementById('profileCompletionRate').textContent = completionRate + '%';
}

// Edit Profile (placeholder)
function editProfile() {
    alert('Edit profile functionality coming soon!');
}

// Logout (placeholder)
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        alert('Logout functionality coming soon!');
    }
}

// Event Listeners
profileMenuLink.addEventListener('click', (e) => {
    e.preventDefault();
    openProfileModal();
});

closeProfileButton.addEventListener('click', closeProfileModal);

// Close modal when clicking outside
profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        closeProfileModal();
    }
});

editProfileBtn.addEventListener('click', editProfile);
logoutBtn.addEventListener('click', logout);

// Initialize
updateProfileInfo();
