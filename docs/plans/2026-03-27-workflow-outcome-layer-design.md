# Workflow Outcome Layer Design

## Overview
Replace the technical `WorkflowResultDialog` with a "premium editorial" slide-up layer that matches the Squid landing page's aesthetic. The new interface will automatically appear upon workflow completion and focus strictly on the final outcome, hiding technical metadata and execution traces by default.

## Aesthetic Direction
- **Tone**: Premium Editorial / Magazine (Matching `src/app/page.tsx`).
- **Typography**: 
  - Titles: `Instrument Serif` (Italicized for emphasis).
  - Body: `Geist Sans` for UI, high-contrast Serif for content results.
- **Colors & Textures**:
  - Background: `lp-bc-accent` style (linear-gradient + radial-gradient).
  - Pattern: 24px dot-grid texture (`radial-gradient`).
  - Glow: Primary-colored radial glow at the top of the results pane.
- **Motion**: `lp-fade-up` slide-in from the bottom of the screen.

## Architecture & Integration
- **New Component**: `src/components/workflow/workflow-outcome-layer.tsx`.
- **Trigger**: Automatically triggered by `ExecuteTab` when `WORKFLOW_END` is received.
- **Portal**: Use a Radix UI `Portal` (or similar) to ensure the slide-up layer covers the entire workflow graph area.
- **Backdrop**: `backdrop-blur-xl` with a subtle tint to dim the workflow graph behind the results.

## Data Flow & Content
- **Final Result Extraction**: Strictly extract the human-readable output from the last node in the workflow.
- **Metadata Suppression**: Filter out all technical keys (`id`, `version`, `metadata`, `thinking`, etc.).
- **Progressive Disclosure**:
  - Primary View: Large, beautifully typeset Markdown of the final result.
  - Secondary View (Advanced): A minimal, low-opacity "View technical execution trace" text link at the bottom that expands the full JSON trace.
- **Actions**:
  - Primary: "Copy Result" (using `lp-btn-primary` with arrow-morph).
  - Secondary: "Close" or "Back to Workflow".

## Success Criteria
- [ ] Workflow results automatically slide up from the bottom when execution finishes.
- [ ] Interface matches the "Squid" landing page exactly (typography, dots, glows).
- [ ] No technical metadata or execution "thinking" is visible by default.
- [ ] The "Copy Result" button is prominent and uses the premium button style.
- [ ] Backdrop blur successfully dims the workflow graph without removing it from view.
