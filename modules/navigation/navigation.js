//Wir erzeugen ein HTML Element...
const link = document.createElement("link");

//...und bauen die einzelnen Prperties zusammen
link.rel = "stylesheet";
link.href = new URL("./navigation.css", import.meta.url).href;

//...und fügen es dem Head hinzu
document.head.appendChild(link);

//Hier bauen wir uns unser eigenes HTML Element
class MyNavigation extends HTMLElement {
  //connectedCallback wir aufgerufen sobald das Element ins DOM eingefügt wird
  async connectedCallback() {
    //Wir laden alles als was in navigation.html geschrieben steht in das HTML dieser Klass
    //bzw. der Instanz, sodass es dann ins index.html eingebunden werden kann.
    //import.meta.url gibt den Pfad zurück
    const res = await fetch(new URL("./navigation.html", import.meta.url));
    this.innerHTML = await res.text();

    this.init();

    //Hier schiessen wir einen eigenen Event ähnlich einem "click-Event" ab. Jeder
    //der sich darauf registriert hat, kann ihn abfangen und verarbeiten.
    this.dispatchEvent(
      new CustomEvent("navigation-loaded", {
        bubbles: true,
      }),
    );
  }

  init() {
    const menuButton = this.querySelector(".button-menu");
    const nav = this.querySelector("nav");
    const navLinks = this.querySelectorAll(".nav-link");

    //isOpen bleibt solange am Leben, wie der EventListener existiert. Er bildet eine
    //"Closure" und fängt die Variable ein
    let isOpen = false;

    menuButton.addEventListener("click", () => {
      isOpen = !isOpen;
      menuButton.classList.toggle("is-open", isOpen);
      menuButton.textContent = isOpen ? "Close Menu" : "Open Menu"
      nav.classList.toggle("is-open", isOpen);
    });

    navLinks.forEach((link)=>{
      link.addEventListener("click", () => {
        isOpen=false;
        menuButton.classList.remove("is-open");
        nav.classList.remove("is-open");
        menuButton.textContent = isOpen ? "Close Menu" : "Open Menu";
      })
    })
  }
}

//Damit wir im index.html einen Tag haben, den wir einsetzen können, müssen wir hier
//unsere MyNavigation noch mit einem CustomElement verbinden. Der Tag heisst dann
//my-nav. Die Namenskonvention für Custom Elements besagt, dass es einen Bindestrich
//im Tag geben muss.
customElements.define("my-nav", MyNavigation);
