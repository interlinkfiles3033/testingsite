function toggleTheme() {
    const body = document.body;
    const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.classList.toggle('dark-mode', newTheme === 'dark');
    body.classList.toggle('light-mode', newTheme === 'light');
    localStorage.setItem('theme', newTheme);
}

// Apply the saved theme on page load
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.classList.toggle('dark-mode', savedTheme === 'dark');
document.body.classList.toggle('light-mode', savedTheme === 'light');