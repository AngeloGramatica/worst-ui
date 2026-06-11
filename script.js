// total-counter
const counterText = document.querySelector(".total-counter");
let count = 0;

document.addEventListener("component-loaded", (e) => {
  countUIs(e.detail.count);
});

document.addEventListener("navigation-loaded", (e) => {
  countUIs(1);
});

function countUIs(anzahl) {
  count += anzahl;
  counterText.textContent = `${count} UI Elemente implementiert`;
}
