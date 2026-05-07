const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");

menuToggle.addEventListener("click", () => {
  navMenu.classList.toggle("active");
});

const navLinks = document.querySelectorAll(".nav-menu a");

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("active");
  });
});

const processItems = document.querySelectorAll(".process-item");

processItems.forEach((item) => {
  const button = item.querySelector(".process-question");
  const icon = item.querySelector(".toggle-icon");

  button.addEventListener("click", () => {
    const isOpen = item.classList.contains("active");

    processItems.forEach((otherItem) => {
      otherItem.classList.remove("active");
      otherItem.querySelector(".process-question").setAttribute("aria-expanded", "false");
      otherItem.querySelector(".toggle-icon").textContent = "+";
    });

    if (!isOpen) {
      item.classList.add("active");
      button.setAttribute("aria-expanded", "true");
      icon.textContent = "−";
    }
  });
});
