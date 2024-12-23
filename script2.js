const openButton = document.getElementById('open-sidebar-button');
const closeButton = document.getElementById('close-sidebar-button');
const navbar = document.getElementById('navbar');
const overlay = document.getElementById('overlay');

const media = window.matchMedia("(max-width: 700px)");

media.addEventListener('change', (e) => updateNavbar(e));

function updateNavbar(e) {
  const isMobile = e.matches;
  if (isMobile) {
    navbar.setAttribute('inert', '');
  } else {
    // desktop device
    navbar.removeAttribute('inert');
  }
}

function openSidebar() {
  navbar.classList.add('show');
  openButton.setAttribute('aria-expanded', 'true');
  navbar.removeAttribute('inert');
  overlay.style.display = 'block';
}

function closeSidebar() {
  navbar.classList.remove('show');
  openButton.setAttribute('aria-expanded', 'false');
  navbar.setAttribute('inert', '');
  overlay.style.display = 'none';
}

// For Bookmark Links
const navLinks = document.querySelectorAll('nav a');
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    closeSidebar();
  });
});

updateNavbar(media);