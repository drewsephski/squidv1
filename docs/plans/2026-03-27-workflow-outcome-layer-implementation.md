# Workflow Outcome Layer Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Replace the technical workflow results dialog with a premium, landing-page-matching "Outcome Layer" that automatically slides up upon completion.

**Architecture:** A new `WorkflowOutcomeLayer` component using Radix UI (for Portal/Overlay) and Framer Motion (for animations). It will strictly display the final result with a "published editorial" aesthetic, matching the Squid landing page.

**Tech Stack:** React, Tailwind CSS 4, Framer Motion, Radix UI, Lucide Icons, Next-Intl.

---

### Task 1: Component Foundation & Styling

**Files:**
- Create: `src/components/workflow/workflow-outcome-layer.tsx`

**Step 1: Create the base component with Landing Page styles**
Implement the component with the scoped CSS needed for the `lp-` styles (dot grid, gradients, Instrument Serif).

**Step 2: Implement the Extraction Logic**
Copy and refine the `extractReadableContent` logic from `workflow-result.tsx` to strictly prioritize the final node's output.

**Step 3: Commit**
```bash
git add src/components/workflow/workflow-outcome-layer.tsx
git commit -m "feat: add base WorkflowOutcomeLayer component with landing page styles"
```

---

### Task 2: UI Implementation (Premium Editorial)

**Files:**
- Modify: `src/components/workflow/workflow-outcome-layer.tsx`

**Step 1: Implement the Slide-up Pane**
Use Framer Motion to animate the pane sliding up from the bottom.

**Step 2: Add Backdrop Blur and Dimming**
Implement the fixed overlay that dims the background and adds a high-end blur.

**Step 3: Style the Content Area**
Apply the `lp-bc-accent` gradient, dot-grid pattern, and `Instrument Serif` typography to the results.

**Step 4: Commit**
```bash
git add src/components/workflow/workflow-outcome-layer.tsx
git commit -m "feat: implement premium UI for WorkflowOutcomeLayer"
```

---

### Task 3: Actions & Progressive Disclosure

**Files:**
- Modify: `src/components/workflow/workflow-outcome-layer.tsx`

**Step 1: Add "Copy Result" with Arrow-Morph**
Implement the premium button style from the landing page.

**Step 2: Implement "View Trace" Disclosure**
Add the minimal text link at the bottom that reveals the full technical JSON trace when clicked.

**Step 3: Commit**
```bash
git add src/components/workflow/workflow-outcome-layer.tsx
git commit -m "feat: add premium actions and trace disclosure to WorkflowOutcomeLayer"
```

---

### Task 4: Integration & Automatic Trigger

**Files:**
- Modify: `src/components/workflow/node-config/execute-tab.tsx`

**Step 1: Replace WorkflowResultDialog**
Import `WorkflowOutcomeLayer` and replace the old dialog implementation.

**Step 2: Implement Automatic Popup**
Update the `WORKFLOW_END` event handler to automatically set the `showResult` state to true.

**Step 3: Commit**
```bash
git add src/components/workflow/node-config/execute-tab.tsx
git commit -m "feat: integrate WorkflowOutcomeLayer and enable automatic popup"
```

---

### Task 5: Final Polish & Cleanup

**Files:**
- Modify: `src/components/workflow/workflow-outcome-layer.tsx`
- Potentially delete: `src/components/workflow/workflow-result.tsx` (if no longer needed)

**Step 1: Refine Animations**
Ensure the `lp-fade-up` stagger feels high-end.

**Step 2: Remove Old Dialog (Optional)**
If `WorkflowResultDialog` is truly "broken" and unused, remove it.

**Step 3: Final Commit**
```bash
git add .
git commit -m "feat: final polish and cleanup of workflow results"
```
