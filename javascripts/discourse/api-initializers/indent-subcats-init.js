import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.0.0", (api) => {
  const site = api.container.lookup("service:site");
  console.log("Indent Subcategories: Initializer loaded."); // Debug: Initializer load

  api.onPageChange(() => {
    console.log("Indent Subcategories: onPageChange triggered."); // Debug: Page change event
    requestAnimationFrame(() => {
      try {
        if (!site?.categories) {
          console.log("Indent Subcategories: No site categories found, returning."); // Debug: No categories
          return;
        }

        const categoryMap = new Map(site.categories.map(c => [c.id, c]));
        console.log("Indent Subcategories: Category map created, size:", categoryMap.size); // Debug: Map created

        const sidebarSection = document.querySelector('.sidebar-section[data-section-name="categories"]');
        if (!sidebarSection) {
          console.log("Indent Subcategories: Sidebar section not found, returning."); // Debug: Sidebar section missing
          return;
        }
        console.log("Indent Subcategories: Sidebar section found."); // Debug: Sidebar section found

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
        console.log("Indent Subcategories: Depths map generated, entries:", depths.size, [...depths.entries()]); // Debug: Depths map content

        const oldStyle = document.getElementById('subcategory-indent-styles');
        if (oldStyle) {
          oldStyle.remove();
          console.log("Indent Subcategories: Removed old style tag."); // Debug: Old style removed
        }

        const styleTag = document.createElement('style');
        styleTag.id = 'subcategory-indent-styles';
        
        let css = '';
        depths.forEach((depth, categoryId) => {
          css += `.sidebar-section-link-wrapper[data-category-id="${categoryId}"] .sidebar-section-link { --subcategory-depth: ${depth}; }\n`;
        });
        
        styleTag.textContent = css;
        console.log("Indent Subcategories: Generated CSS content:", css); // Debug: Generated CSS
        
        document.head.appendChild(styleTag);
        console.log("Indent Subcategories: Style tag appended to head."); // Debug: Style tag appended
        
      } catch (e) {
        console.error("Indent Subcategories error:", e); // Debug: Catch errors
      }
    });
  });
});
