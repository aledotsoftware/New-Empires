## 2024-05-23 - DOM Manipulation Optimization
**Learning:** When refactoring complex DOM generation logic to use a data-driven approach (data first, DOM second), ensure that *all* conditional branches (e.g., different unit types) are updated to the new data structure pattern. Leaving some branches using the old imperative pattern (calling  directly inside the logic block) while moving the helper function definition to the rendering phase causes crashing bugs.

**Action:** Always verify that every path in a refactored function populates the data structure correctly and does not rely on helper functions that have been moved out of scope. Use "Search and Replace" with care when logic is split across multiple if/else blocks.

## 2024-05-23 - Type Safety in UI Helpers
**Learning:** Node.appendChild() throws a TypeError if passed a string directly. When creating UI helper functions that provide fallback content (e.g., emojis when images are missing), they must wrap the text in a DOM Node (like <span> or TextNode).
**Action:** Ensure all UI element creation helpers explicitly return a Node object.
