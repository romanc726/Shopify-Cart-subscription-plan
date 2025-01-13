class CartRemoveButton extends HTMLElement {
    constructor() {
      super();
  
      this.addEventListener("click", (event) => {
        event.preventDefault();
  
        // Check if the clicked button contains the "toggle-selling-plan" class
        if (
          this.classList.contains("cart-toggle-selling-plan") |
          this.classList.contains("toggle-selling-plan")
        ) {
          console.log("Dropdown button click detected, skipping updateQuantity");
          return; // Skip the updateQuantity if the class is present
        }
  
        const cartItems =
          this.closest("cart-items") || this.closest("cart-drawer-items");
        if (cartItems) {
          cartItems.updateQuantity(this.dataset.index, 0);
        }
      });
    }
  }
  
  customElements.define("cart-remove-button", CartRemoveButton);
  
  class CartItems extends HTMLElement {
    constructor() {
      super();
      this.lineItemStatusElement =
        document.getElementById("shopping-cart-line-item-status") ||
        document.getElementById("CartDrawer-LineItemStatus");
  
      const debouncedOnChange = debounce((event) => {
        this.onChange(event);
      }, ON_CHANGE_DEBOUNCE_TIMER);
  
      this.addEventListener("change", debouncedOnChange.bind(this));
    }
  
    cartUpdateUnsubscriber = undefined;
  
    connectedCallback() {
      this.cartUpdateUnsubscriber = subscribe(
        PUB_SUB_EVENTS.cartUpdate,
        (event) => {
          if (event.source === "cart-items") {
            return;
          }
          this.onCartUpdate();
        }
      );
    }
  
    disconnectedCallback() {
      if (this.cartUpdateUnsubscriber) {
        this.cartUpdateUnsubscriber();
      }
    }
  
    onChange(event) {
      // Ignore change events triggered by selling-plan-dropdown
      if (
        event.target.classList.contains("cart-selling-plan-dropdown") |
        event.target.classList.contains("selling-plan-dropdown")
      ) {
        console.log("Dropdown change detected, skipping updateQuantity");
        return;
      }
      this.updateQuantity(
        event.target.dataset.index,
        event.target.value,
        document.activeElement.getAttribute("name")
      );
    }
  
    onCartUpdate() {
      fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, "text/html");
          const sourceQty = html.querySelector("cart-items");
          console.log("sourceQty: ", sourceQty);
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  
    getSectionsToRender() {
      return [
        {
          id: "main-cart-items",
          section: document.getElementById("main-cart-items").dataset.id,
          selector: ".cart-js-contents",
        },
        {
          id: "cart-icon-bubble",
          section: "cart-icon-bubble",
          selector: ".shopify-section",
        },
        {
          id: "cart-live-region-text",
          section: "cart-live-region-text",
          selector: ".shopify-section",
        },
        {
          id: "main-cart-footer",
          section: document.getElementById("main-cart-footer").dataset.id,
          selector: ".js-contents",
        },
      ];
    }
  
    updateQuantity(line, quantity, name) {
      this.enableLoading(line);
      const body = JSON.stringify({
        line,
        quantity,
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname,
      });
  
      fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          const parsedState = JSON.parse(state);
          const quantityElement =
            document.getElementById(`Quantity-${line}`) ||
            document.getElementById(`Drawer-quantity-${line}`);
          const items = document.querySelectorAll(".cart-item");
  
          if (parsedState.errors) {
            quantityElement.value = quantityElement.getAttribute("value");
            this.updateLiveRegions(line, parsedState.errors);
            return;
          }
          console.log("updateQuantity: ", parsedState);
          this.classList.toggle("is-empty", parsedState.item_count === 0);
          const cartDrawerWrapper = document.querySelector("cart-drawer");
          const cartFooter = document.getElementById("main-cart-footer");
  
          if (cartFooter)
            cartFooter.classList.toggle("is-empty", parsedState.item_count === 0);
          if (cartDrawerWrapper)
            cartDrawerWrapper.classList.toggle(
              "is-empty",
              parsedState.item_count === 0
            );
  
          this.getSectionsToRender().forEach((section) => {
            const elementToReplace =
              document
                .getElementById(section.id)
                .querySelector(section.selector) ||
              document.getElementById(section.id);
            elementToReplace.innerHTML = this.getSectionInnerHTML(
              parsedState.sections[section.section],
              section.selector
            );
          });
          const updatedValue = parsedState.items[line - 1]
            ? parsedState.items[line - 1].quantity
            : undefined;
          console.log("updatedValue: ", updatedValue);
          
          let message = "";
          if (
            items.length === parsedState.items.length &&
            updatedValue !== parseInt(quantityElement.value)
          ) {
            if (typeof updatedValue === "undefined") {
              message = window.cartStrings.error;
            } else {
              message = window.cartStrings.quantityError.replace(
                "[quantity]",
                updatedValue
              );
            }
          }
          this.updateLiveRegions(line, message);
  
          const lineItem =
            document.getElementById(`CartItem-${line}`) ||
            document.getElementById(`CartDrawer-Item-${line}`);
          if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
            cartDrawerWrapper
              ? trapFocus(
                  cartDrawerWrapper,
                  lineItem.querySelector(`[name="${name}"]`)
                )
              : lineItem.querySelector(`[name="${name}"]`).focus();
          } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
            trapFocus(
              cartDrawerWrapper.querySelector(".drawer__inner-empty"),
              cartDrawerWrapper.querySelector("a")
            );
          } else if (document.querySelector(".cart-item") && cartDrawerWrapper) {
            trapFocus(
              cartDrawerWrapper,
              document.querySelector(".cart-item__name")
            );
          }
          console.log("Line-Item: ", lineItem);
          publish(PUB_SUB_EVENTS.cartUpdate, { source: "cart-items" });
          
          
        })
        .catch(() => {
          this.querySelectorAll(".loading-overlay").forEach((overlay) =>
            overlay.classList.add("hidden")
          );
          const errors =
            document.getElementById("cart-errors") ||
            document.getElementById("CartDrawer-CartErrors");
          errors.textContent = window.cartStrings.error;
        })
        .finally(() => {
          this.disableLoading(line);
        });
    }
  
    updateLiveRegions(line, message) {
      const lineItemError =
        document.getElementById(`Line-item-error-${line}`) ||
        document.getElementById(`CartDrawer-LineItemError-${line}`);
      if (lineItemError)
        lineItemError.querySelector(".cart-item__error-text").innerHTML = message;
  
      this.lineItemStatusElement.setAttribute("aria-hidden", true);
  
      const cartStatus =
        document.getElementById("cart-live-region-text") ||
        document.getElementById("CartDrawer-LiveRegionText");
      cartStatus.setAttribute("aria-hidden", false);
  
      setTimeout(() => {
        cartStatus.setAttribute("aria-hidden", true);
      }, 1000);
    }
  
    getSectionInnerHTML(html, selector) {
      return new DOMParser()
        .parseFromString(html, "text/html")
        .querySelector(selector).innerHTML;
    }
  
    enableLoading(line) {
      const mainCartItems =
        document.getElementById("main-cart-items") ||
        document.getElementById("CartDrawer-CartItems");
      mainCartItems.classList.add("cart__items--disabled");
  
      const cartItemElements = this.querySelectorAll(
        `#CartItem-${line} .loading-overlay`
      );
      const cartDrawerItemElements = this.querySelectorAll(
        `#CartDrawer-Item-${line} .loading-overlay`
      );
  
      [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) =>
        overlay.classList.remove("hidden")
      );
  
      document.activeElement.blur();
      this.lineItemStatusElement.setAttribute("aria-hidden", false);
    }
  
    disableLoading(line) {
      const mainCartItems =
        document.getElementById("main-cart-items") ||
        document.getElementById("CartDrawer-CartItems");
      mainCartItems.classList.remove("cart__items--disabled");
  
      const cartItemElements = this.querySelectorAll(
        `#CartItem-${line} .loading-overlay`
      );
      const cartDrawerItemElements = this.querySelectorAll(
        `#CartDrawer-Item-${line} .loading-overlay`
      );
  
      cartItemElements.forEach((overlay) => overlay.classList.add("hidden"));
      cartDrawerItemElements.forEach((overlay) =>
        overlay.classList.add("hidden")
      );
    }
  }
  
  customElements.define("cart-items", CartItems);
  
  document.addEventListener("DOMContentLoaded", function () {
    // Event listener for toggle buttons
    function triggerBTN() {
      document
        .querySelectorAll(".cart-toggle-selling-plan")
        .forEach((button1) => {
          button1.addEventListener("click", function () {
            const lineItemId = this.getAttribute("data-line-item-id");
            const dropdown = document.querySelector(
              `.cart-selling-plan-dropdown[data-line-item-id="${lineItemId}"]`
            );
  
            if (!dropdown) return; // Guard clause if dropdown is not found
            // Show the dropdown and hide the button
            this.classList.add("hidden");
            dropdown.classList.remove("hidden");
  
            // Focus the dropdown
            dropdown.focus();
            // Event listener for the dropdown change
            const dropdowns = document.querySelectorAll(
              ".cart-selling-plan-dropdown"
            );
  
            dropdowns.forEach((dropdown) => {
              let initialValue = dropdown.value; // Store the initial value of the dropdown
  
              dropdown.addEventListener("change", (event) => {
                const sellingPlanId =
                  event.target.value === "none" ? null : event.target.value;
                const lineItemId = event.target.getAttribute("data-line-item-id");
                const button = document.querySelector(
                  `.cart-toggle-selling-plan[data-line-item-id="${lineItemId}"]`
                );
  
                if (!button) return; // Guard clause if button is not found
  
                const selectedOption =
                  event.target.value === "none"
                    ? "One-Time Only"
                    : "Subscribe & Keep 25%";
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
                    // Fetch the updated cart section
                    fetch(`${routes.cart_url}?section_id=main-cart-items`)
                      .then((response) => response.text())
                      .then((responseText) => {
                        const html = new DOMParser().parseFromString(
                          responseText,
                          "text/html"
                        );
                        const updatedCartContent =
                          html.querySelector(".cart-js-contents");
                        const cartItemsContainer =
                          document.querySelector(".cart-js-contents");
                        if (cartItemsContainer && updatedCartContent) {
                          cartItemsContainer.innerHTML =
                            updatedCartContent.innerHTML;
                        }
  
                        // Hide the dropdown and show the button
                        dropdown.classList.add("hidden");
                        button.classList.remove("hidden");
                        triggerBTN();
                        // if(triggerCartDrawerBTN) {
                        //   triggerCartDrawerBTN();
                        // }
                      })
                      .catch((error) =>
                        console.error("Error fetching updated cart:", error)
                      );
                    // Fetch the updated cart drawer section
                    fetch(`${routes.cart_url}?section_id=cart-drawer`)
                      .then((response) => response.text())
                      .then((responseText) => {
                        const html = new DOMParser().parseFromString(
                          responseText,
                          "text/html"
                        );
                        const updatedCartContent = html.querySelector(
                          ".cart-drawer-js-contents"
                        );
                        const cartItemsContainer = document.querySelector(
                          ".cart-drawer-js-contents"
                        );
                        if (cartItemsContainer && updatedCartContent) {
                          cartItemsContainer.innerHTML =
                            updatedCartContent.innerHTML;
                        }
                      })
                      .catch((error) =>
                        console.error("Error fetching updated cart:", error)
                      );
                  })
                  .catch((error) => console.error("Error updating cart:", error));
  
                // Update the initial value after the change
                initialValue = event.target.value;
              });
            });
          });
        });
    }
    triggerBTN();
  });
  
  if (!customElements.get("cart-note")) {
    customElements.define(
      "cart-note",
      class CartNote extends HTMLElement {
        constructor() {
          super();
  
          this.addEventListener(
            "change",
            debounce((event) => {
              const body = JSON.stringify({ note: event.target.value });
              fetch(`${routes.cart_update_url}`, {
                ...fetchConfig(),
                ...{ body },
              });
            }, ON_CHANGE_DEBOUNCE_TIMER)
          );
        }
      }
    );
  }
  