// total-counter
const counterText = document.querySelector(".total-counter");
let count = 0;

document.addEventListener("component-loaded", (e) => {
  count += e.detail.count;
  console.log(e.target.tagName, "→", e.detail.count, "| Total:", count);
  counterText.textContent = `${count} UI Elemente implementiert`;
});