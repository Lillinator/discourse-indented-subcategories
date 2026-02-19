import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.0.0", (api) => {
  const site = api.container.lookup("service:site");

  const executeIndentationLogic = () => {
    try {
      if (!site?.categories) {
        return;
      }

      const categoryMap = new Map(site.categories.map(c => [c.id, c]));

      const sidebarSection = document.querySelector('.sidebar-section[data-section-name="categories"]');
      if (!sidebarSection) {
        return;
      }

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

      const oldStyle = document.getElementById('subcategory-indent-styles');
      if (oldStyle) {
        oldStyle.remove();
      }

      const styleTag = document.createElement('style');
      styleTag.id = 'subcategory-indent-styles';
      
      let css = '';
      depths.forEach((depth, categoryId) => {
        css += `.sidebar-section-link-wrapper[data-category-id="${categoryId}"] .sidebar-section-link { --subcategory-depth: ${depth}; }\n`;
      });
      
      styleTag.textContent = css;
      document.head.appendChild(styleTag);
      
    } catch (e) {
      console.error("Indent Subcategories error:", e);
    }
  };

  if (window.innerWidth > 900) {
    api.onPageChange(() => {
      requestAnimationFrame(executeIndentationLogic);
    });
    return;
  }

  let isMenuOpen = false;

  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('hamburger-dropdown-wrapper')) {
            if (!isMenuOpen) {
              isMenuOpen = true;
              setTimeout(executeIndentationLogic, 100); 
            }
            break;
          }
        }

        for (const node of mutation.removedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('hamburger-dropdown-wrapper')) {
            if (isMenuOpen) {
              isMenuOpen = false;
              const oldStyle = document.getElementById('subcategory-indent-styles');
              if (oldStyle) oldStyle.remove();
            }
            break;
          }
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => {
    const initialHamburgerWrapper = document.querySelector('.hamburger-dropdown-wrapper');
    if (initialHamburgerWrapper && !isMenuOpen) {
      isMenuOpen = true;
      executeIndentationLogic();
    }
  }, 500);
});
