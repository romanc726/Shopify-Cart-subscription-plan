document.querySelectorAll('.selling-plan-dropdown').forEach(dropdown => {
    dropdown.addEventListener('change', function () {
        const lineItemId = this.dataset.lineItemId;
        const sellingPlanId = this.value; // "one_time" or subscription plan ID

        // Update cart via Shopify AJAX API
        fetch('/cart/change.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: lineItemId,
                selling_plan: sellingPlanId === 'one_time' ? null : sellingPlanId,
            }),
        })
            .then(response => response.json())
            .then(data => {
                // Update the cart UI dynamically
                console.log('Cart updated:', data);
                updateCartUI(data);
            })
            .catch(error => console.error('Error updating cart:', error));
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const planSelectors = document.querySelectorAll(".selling-plan-selector");

    planSelectors.forEach((selector) => {
        selector.addEventListener("change", (event) => {
            const selectedPlanId = event.target.value;
            const lineItemId = event.target.dataset.lineItemId;

            // Update the cart with the new selling plan
            fetch('/cart/change.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: lineItemId,
                    selling_plan: selectedPlanId !== "0" ? selectedPlanId : null,
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log("Cart updated:", data);
                    location.reload(); // Optional: reload to reflect changes
                })
                .catch((error) => console.error("Error updating cart:", error));
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const dropdowns = document.querySelectorAll(".selling-plan-dropdown");

    dropdowns.forEach((dropdown) => {
        dropdown.addEventListener("change", (event) => {
            const sellingPlanId = event.target.value === "none" ? null : event.target.value;
            const lineItemId = event.target.getAttribute("data-line-item-id");

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
                    // location.reload(); // Reload to reflect changes visually
                })
                .catch((error) => console.error("Error updating cart:", error));
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const dropdowns = document.querySelectorAll(".selling-plan-dropdown");
  
    dropdowns.forEach((dropdown) => {
      dropdown.addEventListener("change", (event) => {
        const sellingPlanId =
          event.target.value === "none" ? null : event.target.value;
        const lineItemId = event.target.getAttribute("data-line-item-id");
  
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
            fetch(`${routes.cart_url}?section_id=main-cart-items`)
              .then((response) => response.text())
              .then((responseText) => {
                const html = new DOMParser().parseFromString(
                  responseText,
                  "text/html"
                );
                const updatedCartContent = html.querySelector(".js-contents");
  
                // Update only the cart items section
                const cartItemsContainer = document.querySelector(".js-contents");
                if (cartItemsContainer && updatedCartContent) {
                  cartItemsContainer.innerHTML = updatedCartContent.innerHTML;
                }
              })
              .catch((error) =>
                console.error("Error fetching updated cart:", error)
              );
          })
          .catch((error) => console.error("Error updating cart:", error));
      });
    });
  });

// document.addEventListener("DOMContentLoaded", function () {
//     // Event listener for toggle buttons
//     document.querySelectorAll('.toggle-selling-plan').forEach(button => {
//         button.addEventListener('click', function () {
//             const lineItemId = this.getAttribute('data-line-item-id');
//             const dropdown = document.querySelector(
//                 `.selling-plan-dropdown[data-line-item-id="${lineItemId}"]`
//             );

//             // Show the dropdown and hide the button
//             this.classList.add('hidden');
//             dropdown.classList.remove('hidden');
//         });
//     });
//     // Event listener for the dropdown
//     const dropdowns = document.querySelectorAll(".selling-plan-dropdown");

//     dropdowns.forEach((dropdown) => {
//         dropdown.addEventListener("change", (event) => {
//             const sellingPlanId = event.target.value === "none" ? null : event.target.value;
//             const lineItemId = event.target.getAttribute("data-line-item-id");
//             const button = document.querySelector(
//                 `.toggle-selling-plan[data-line-item-id="${lineItemId}"]`
//             );
//             const selectedOption = this.value === 'none' ? 'One-Time Only' : 'Subscribe & Keep 25%';
//             button.textContent = selectedOption;

//             // Send the update request to the server
//             fetch("/cart/change.js", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     id: lineItemId,
//                     selling_plan: sellingPlanId,
//                 }),
//             })
//                 .then((response) => response.json())
//                 .then((cart) => {
//                     console.log("Cart updated:", cart);

//                     // Fetch the updated cart section
//                     fetch(`${routes.cart_url}?section_id=main-cart-items`)
//                         .then((response) => response.text())
//                         .then((responseText) => {
//                             const html = new DOMParser().parseFromString(responseText, "text/html");
//                             const updatedCartContent = html.querySelector(".js-contents");

//                             // Update only the cart items section
//                             const cartItemsContainer = document.querySelector(".js-contents");
//                             if (cartItemsContainer && updatedCartContent) {
//                                 cartItemsContainer.innerHTML = updatedCartContent.innerHTML;
//                             }
//                             // Hide the dropdown and show the button
//                             this.classList.add('hidden');
//                             button.classList.remove('hidden');
//                         })
//                         .catch((error) => console.error("Error fetching updated cart:", error));
//                 })
//                 .catch((error) => console.error("Error updating cart:", error));
//         });
//     });
// });


document.addEventListener("DOMContentLoaded", function () {
    // Event listener for toggle buttons
    document.querySelectorAll('.toggle-selling-plan').forEach(button => {
        button.addEventListener('click', function () {
            let lineItemId = this.getAttribute('data-line-item-id');
            let dropdown = document.querySelector(
                `.selling-plan-dropdown[data-line-item-id="${lineItemId}"]`
            );

            // Show the dropdown and hide the button
            button.classList.add('hidden');
            dropdown.classList.remove('hidden');
        });
    });

    // Event listener for the dropdown
    let dropdowns = document.querySelectorAll(".selling-plan-dropdown");

    dropdowns.forEach((dropdown) => {
        dropdown.addEventListener("change", (event) => {
            let sellingPlanId = event.target.value === "none" ? null : event.target.value;
            let lineItemId = event.target.getAttribute("data-line-item-id");
            let button = document.querySelector(
                `.toggle-selling-plan[data-line-item-id="${lineItemId}"]`
            );

            let selectedOption = event.target.value === 'none' ? 'One-Time Only' : 'Subscribe & Keep 25%';
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
                    fetch(`${routes.cart_url}?section_id=main-cart-items`)
                        .then((response) => response.text())
                        .then((responseText) => {
                            let html = new DOMParser().parseFromString(responseText, "text/html");
                            let updatedCartContent = html.querySelector(".js-contents");

                            // Update only the cart items section
                            let cartItemsContainer = document.querySelector(".js-contents");
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
        });
    });
});
