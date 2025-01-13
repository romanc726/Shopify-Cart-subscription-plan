class CartDrawer extends HTMLElement {
    constructor() {
      super();
      this.addEventListener("keyup", (evt) => evt.code === "Escape" && this.close());
      this.querySelector("#CartDrawer-Overlay").addEventListener("click", this.close.bind(this));
      this.setHeaderCartIconAccessibility();
      this.addButtonClickListener();  // Added listener for buttons
    }
  
    setHeaderCartIconAccessibility() {
      const cartLink = document.querySelector("#cart-icon-bubble");
      cartLink.setAttribute("role", "button");
      cartLink.setAttribute("aria-haspopup", "dialog");
      cartLink.addEventListener("click", (event) => {
        event.preventDefault();
        this.open(cartLink);
      });
      cartLink.addEventListener("keydown", (event) => {
        if (event.code.toUpperCase() === "SPACE") {
          event.preventDefault();
          this.open(cartLink);
        }
      });
    }
  
    open(triggeredBy) {
      if (triggeredBy) this.setActiveElement(triggeredBy);
      const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
      if (cartDrawerNote && !cartDrawerNote.hasAttribute("role"))
        this.setSummaryAccessibility(cartDrawerNote);
  
      setTimeout(() => {
        this.classList.add("animate", "active");
        this.handleSellingPlanToggle(); // Ensure selling plan toggle handling when cart is opened
      });
  
      this.addEventListener(
        "transitionend",
        () => {
          const containerToTrapFocusOn = this.classList.contains("is-empty")
            ? this.querySelector(".drawer__inner-empty")
            : document.getElementById("CartDrawer");
          const focusElement =
            this.querySelector(".drawer__inner") || this.querySelector(".drawer__close");
          trapFocus(containerToTrapFocusOn, focusElement);
        },
        { once: true }
      );
  
      document.body.classList.add("overflow-hidden");
  
      // Observe cart content changes and reapply event listeners
      const cartDrawerContent = this.querySelector('tbody');
      if (cartDrawerContent) {
        this.observeCartChanges(cartDrawerContent);
      }
    }
  
    close() {
      this.classList.remove("active");
      removeTrapFocus(this.activeElement);
      document.body.classList.remove("overflow-hidden");
    }
  
    setSummaryAccessibility(cartDrawerNote) {
      cartDrawerNote.setAttribute("role", "button");
      cartDrawerNote.setAttribute("aria-expanded", "false");
  
      if (cartDrawerNote.nextElementSibling.getAttribute("id")) {
        cartDrawerNote.setAttribute("aria-controls", cartDrawerNote.nextElementSibling.id);
      }
  
      cartDrawerNote.addEventListener("click", (event) => {
        event.currentTarget.setAttribute(
          "aria-expanded",
          !event.currentTarget.closest("details").hasAttribute("open")
        );
      });
  
      cartDrawerNote.parentElement.addEventListener("keyup", onKeyUpEscape);
    }
  
    renderContents(parsedState) {
      this.querySelector(".drawer__inner").classList.contains("is-empty") &&
        this.querySelector(".drawer__inner").classList.remove("is-empty");
      this.productId = parsedState.id;
      this.getSectionsToRender().forEach((section) => {
        const sectionElement = section.selector
          ? document.querySelector(section.selector)
          : document.getElementById(section.id);
        sectionElement.innerHTML = this.getSectionInnerHTML(
          parsedState.sections[section.id],
          section.selector
        );
      });
  
      setTimeout(() => {
        this.querySelector("#CartDrawer-Overlay").addEventListener(
          "click",
          this.close.bind(this)
        );
        this.open();
      });
    }
  
    getSectionInnerHTML(html, selector = ".shopify-section") {
      return new DOMParser()
        .parseFromString(html, "text/html")
        .querySelector(selector).innerHTML;
    }
  
    getSectionsToRender() {
      return [
        {
          id: "cart-drawer",
          selector: "#CartDrawer",
        },
        {
          id: "cart-icon-bubble",
        },
      ];
    }
  
    getSectionDOM(html, selector = ".shopify-section") {
      return new DOMParser()
        .parseFromString(html, "text/html")
        .querySelector(selector);
    }
  
    setActiveElement(element) {
      this.activeElement = element;
    }
  
    // Move handleSellingPlanToggle into the class
    handleSellingPlanToggle() {
      const buttons = document.querySelectorAll('.toggle-selling-plan');
      buttons.forEach(button => {
        button.removeEventListener('click', this.toggleSellingPlan); // Remove previous listeners
        button.addEventListener('click', this.toggleSellingPlan.bind(this)); // Reattach event listener
      });
  
      // Event listener for the dropdown
      const dropdowns = document.querySelectorAll(".selling-plan-dropdown");
      dropdowns.forEach((dropdown) => {
        let initialValue = dropdown.value;  // Store the initial value of the dropdown
  
        dropdown.addEventListener("change", (event) => {
          const sellingPlanId = event.target.value === "none" ? null : event.target.value;
          const lineItemId = event.target.getAttribute("data-line-item-id");
          const button = document.querySelector(
            `.toggle-selling-plan[data-line-item-id="${lineItemId}"]`
          );
  
          // Only proceed if the value has actually changed
          if (event.target.value !== initialValue) {
            const selectedOption = event.target.value === 'none' ? 'One-Time Only' : 'Subscribe & Keep 25%';
            button.textContent = selectedOption;
  
            // Send the update request to the server
            fetch("/cart/change.js", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: lineItemId,
                selling_plan: sellingPlanId,
              }),
            })
            .then((response) => response.json())
            .then((cart) => {
              console.log("Cart updated:", cart);
  
              // Fetch the updated cart section
              fetch(`${routes.cart_url}?section_id=cart-drawer`)
                .then((response) => response.text())
                .then((responseText) => {
                  const html = new DOMParser().parseFromString(responseText, "text/html");
                  const updatedCartContent = html.querySelector(".cart-drawer-js-contents");
  
                  // Update only the cart items section
                  const cartItemsContainer = document.querySelector(".cart-drawer-js-contents");
                  if (cartItemsContainer && updatedCartContent) {
                    cartItemsContainer.innerHTML = updatedCartContent.innerHTML;
                  }
  
                  // Hide the dropdown and show the button
                  dropdown.classList.add('hidden');
                  button.classList.remove('hidden');
                })
                .catch((error) => console.error("Error fetching updated cart:", error));
            })
            .catch((error) => console.error("Error updating cart:", error));
  
            // Update the initial value after the change
            initialValue = event.target.value;
          }
        });
      });
    }
  
    // MutationObserver to watch for changes in the cart drawer (e.g., quantity changes)
    observeCartChanges(cartDrawerContent) {
      const observer = new MutationObserver(() => {
        console.log('Cart content changed, reapplying event listeners');
        this.handleSellingPlanToggle();  // Reapply event listeners after cart update
      });
  
      observer.observe(cartDrawerContent, {
        childList: true, // Observe direct children
        subtree: true,   // Observe all descendants
      });
    }
  
    toggleSellingPlan(event) {
      const lineItemId = event.target.getAttribute('data-line-item-id');
      const dropdown = document.querySelector(`.selling-plan-dropdown[data-line-item-id="${lineItemId}"]`);
  
      // Show the dropdown and hide the button
      event.target.classList.add('hidden');
      dropdown.classList.remove('hidden');
    }
  
    // Add button click listener to trigger handleSellingPlanToggle
    addButtonClickListener() {
      const buttons = this.querySelectorAll('button');
      buttons.forEach(button => {
        button.addEventListener('click', () => {
          setTimeout(() => {
            console.log("addEventListener test: ", button);
          this.handleSellingPlanToggle(); // Re-call the handleSellingPlanToggle on every button click
      }, 2000);
        });
      });
    }
  }
  
  customElements.define("cart-drawer", CartDrawer);
  
  class CartDrawerItems extends CartItems {
    getSectionsToRender() {
      return [
        {
          id: 'CartDrawer',
          section: 'cart-drawer',
          selector: '.drawer__inner'
        },
        {
          id: 'cart-icon-bubble',
          section: 'cart-icon-bubble',
          selector: '.shopify-section'
        }
      ];
    }
  }
  
  customElements.define('cart-drawer-items', CartDrawerItems);
  