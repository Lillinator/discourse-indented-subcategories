import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.0.0", (api) => {
  const site = api.container.lookup("service:site");
  console.log("Indent Subcategories: Initializer loaded.");

  const executeIndentationLogic = () => {
    try {
      if (!site?.categories) {
        console.log("Indent Subcategories: No site categories found, returning.");
        return;
      }

      const categoryMap = new Map(site.categories.map(c => [c.id, c]));
      console.log("Indent Subcategories: Category map created, size:", categoryMap.size);

      // This selector is now confirmed to be present *if the hamburger menu is open*
      const sidebarSection = document.querySelector('.sidebar-section[data-section-name="categories"]');
      if (!sidebarSection) {
        console.log("Indent Subcategories: Sidebar section not found after hamburger menu opened, returning.");
        return;
      }
      console.log("Indent Subcategories: Sidebar section found.");

      const depths = new Map();
      
      categoryMap.forEach((category, categoryId) => {
        if (!category.parent_category_id) return;

        let depth = 0;
        let currentId = categoryId;
        const visited = new Set();

        while (currentId && depth < 10) {
          if (visited.has(currentId)) break;
          visited.add(currentId);

          const cat = categoryMap.get(currentId);
          if (!cat?.parent_category_id) break;

          depth++;
          currentId = cat.parent_category_id;
        }

        if (depth > 0) {
          depths.set(categoryId, depth);
        }
      });
      console.log("Indent Subcategories: Depths map generated, entries:", depths.size, [...depths.entries()]);

      // Remove old style tag if exists
      const oldStyle = document.getElementById('subcategory-indent-styles');
      if (oldStyle) {
        oldStyle.remove();
        console.log("Indent Subcategories: Removed old style tag.");
      }

      // Create new style tag with specific rules
      const styleTag = document.createElement('style');
      styleTag.id = 'subcategory-indent-styles';
      
      let css = '';
      depths.forEach((depth, categoryId) => {
        css += `.sidebar-section-link-wrapper[data-category-id="${categoryId}"] .sidebar-section-link { --subcategory-depth: ${depth}; }\n`;
      });
      
      styleTag.textContent = css;
      console.log("Indent Subcategories: Generated CSS content:", css);
      
      document.head.appendChild(styleTag);
      console.log("Indent Subcategories: Style tag appended to head.");
      
    } catch (e) {
      console.error("Indent Subcategories error:", e);
    }
  };

  // --- Conditional Logic based on Viewport ---

  // For larger viewports (desktop/tablet), the sidebar is part of the initial DOM.
  // We can use api.onPageChange and requestAnimationFrame as before.
  if (window.innerWidth > 900) {
    api.onPageChange(() => {
      console.log("Indent Subcategories: Large viewport detected, applying requestAnimationFrame.");
      requestAnimationFrame(executeIndentationLogic);
    });
    // This return ensures the MutationObserver setup below is only for small viewports.
    return;
  }

  // For small viewports, we need to detect when the hamburger menu opens.
  // The `hamburger-dropdown-wrapper` is the key indicator.
  console.log("Indent Subcategories: Small viewport detected (innerWidth <= 900). Setting up MutationObserver.");

  let isMenuOpen = false; // Track the menu state to avoid re-running on every mutation

  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        // Check for added nodes
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('hamburger-dropdown-wrapper')) {
            if (!isMenuOpen) { // Only run if menu wasn't previously open
              isMenuOpen = true;
              console.log("Indent Subcategories: hamburger-dropdown-wrapper added to DOM. Executing logic with a small delay.");
              // A small delay is still good here to ensure all internal Ember components
              // within the hamburger menu have finished rendering their content.
              setTimeout(executeIndentationLogic, 100); 
            }
            // No need to continue checking addedNodes if we found it
            break;
          }
        }

        // Check for removed nodes (when the menu closes)
        for (const node of mutation.removedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('hamburger-dropdown-wrapper')) {
            if (isMenuOpen) {
              isMenuOpen = false;
              console.log("Indent Subcategories: hamburger-dropdown-wrapper removed from DOM.");
              // Optionally clean up styles if you want, but they'll be overwritten on next open
              const oldStyle = document.getElementById('subcategory-indent-styles');
              if (oldStyle) oldStyle.remove();
            }
            break;
          }
        }
      }
    }
  });

  // Start observing the body for changes in its children.
  // `childList: true` detects when direct children are added/removed.
  // `subtree: true` is crucial because `hamburger-dropdown-wrapper` might not be a direct child of `body`
  // but could be nested within a high-level application container.
  observer.observe(document.body, { childList: true, subtree: true });

  // Additionally, handle the case where the mobile menu might be open on initial load
  // (e.g., if navigating directly to a URL with it open, or if it persists across navigations).
  // A slight delay here in case it's rendered by other scripts immediately after API initializer loads.
  setTimeout(() => {
    const initialHamburgerWrapper = document.querySelector('.hamburger-dropdown-wrapper');
    if (initialHamburgerWrapper && !isMenuOpen) {
      console.log("Indent Subcategories: hamburger-dropdown-wrapper found on initial check. Executing logic.");
      isMenuOpen = true; // Mark as open
      executeIndentationLogic();
    }
  }, 500); // A longer initial check to ensure all initial rendering has settled.
});
