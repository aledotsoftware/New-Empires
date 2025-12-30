## 2024-05-22 - Visual Verification of Game UI
**Learning:** For verifying visual game UI states without full game interaction, it is effective to mock the game state or force specific UI render calls within the test script.
**Action:** Use Playwright to load the game, execute a script to inject a mock selection and force `updateActionsPanel`, then take a screenshot of the tooltip appearance.
