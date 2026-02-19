import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.0.0", (api) => {
  const site = api.container.lookup("service:site");
  console.log("Indent Subcategories: Initializer loaded.");

  api.onPageChange(() => {
    console.log("Indent Subcategories: onPageChange triggered.");

    const executeIndentationLogic = () => {
      try {
        if (!site?.categories) {
          console.log("Indent Subcategories: No site categories found, returning.");
          return;
        }

        const categoryMap = new Map(site.categories.map(c => [c.id, c]));
        console.log("Indent Subcategories: Category map created, size:", categoryMap.size);

        // This selector is confirmed to be present in the mobile DOM *if given enough time*
        const sidebarSection = document.querySelector('.sidebar-section[data-section-name="categories"]');
        if (!sidebarSection) {
          console.log("Indent Subcategories: Sidebar section not found, returning.");
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

        const oldStyle = document.getElementById('subcategory-indent-styles');
        if (oldStyle) {
          oldStyle.remove();
          console.log("Indent Subcategories: Removed old style tag.");
        }

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

    // Conditional execution based on viewport width for small viewports (mobile-like)
    // Using a common Discourse mobile breakpoint, e.g., 900px, but you can adjust if needed.
    if (window.innerWidth <= 900) { // Using innerWidth for a more reliable mobile check
      console.log("Indent Subcategories: Small viewport detected (innerWidth <= 900), applying setTimeout.");
      setTimeout(executeIndentationLogic, 100); // Apply delay for small viewports
    } else {
      console.log("Indent Subcategories: Large viewport detected, applying requestAnimationFrame.");
      requestAnimationFrame(executeIndentationLogic); // Use requestAnimationFrame for larger viewports
    }
  });
});
