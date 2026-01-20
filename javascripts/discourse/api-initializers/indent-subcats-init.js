import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.0.0", (api) => {
  const site = api.container.lookup("service:site"); // Get it here, once
  
  api.onPageChange(() => {
    requestAnimationFrame(() => {
      try {
        if (!site?.categories) return;

        const categoryMap = new Map(site.categories.map(c => [c.id, c]));

        // Find the sidebar section (stable parent)
        const sidebarSection = document.querySelector('.sidebar-section[data-section-name="categories"]');
        if (!sidebarSection) return;

        // Build depth map and inject as style tag
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

        // Remove old style tag if exists
        const oldStyle = document.getElementById('subcategory-indent-styles');
        if (oldStyle) oldStyle.remove();

        // Create new style tag with specific rules
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
    });
  });
});
