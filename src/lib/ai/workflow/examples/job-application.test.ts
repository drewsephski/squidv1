import { describe, expect, it } from "vitest";
import { jobApplicationNodes, jobApplicationEdges } from "./job-application";

describe("Job Application Workflow Template", () => {
  it("should have unique node IDs", () => {
    const ids = jobApplicationNodes.map((n) => n.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("should have a valid DAG structure (all edges point to existing nodes)", () => {
    const nodeIds = new Set(jobApplicationNodes.map((n) => n.id));
    for (const edge of jobApplicationEdges) {
      expect(nodeIds.has(edge.source!)).toBe(true);
      expect(nodeIds.has(edge.target!)).toBe(true);
    }
  });

  it("should have an INPUT node with required job_url and base_resume", () => {
    const inputNode = jobApplicationNodes.find((n) => n.kind === "input");
    expect(inputNode).toBeDefined();
    const schema = inputNode?.nodeConfig?.outputSchema as any;
    expect(schema.required).toContain("job_url");
    expect(schema.required).toContain("base_resume");
  });

  it("should have a condition node with an 'if' and 'else' branch", () => {
    const conditionNode = jobApplicationNodes.find(
      (n) => n.kind === "condition",
    );
    expect(conditionNode).toBeDefined();
    const branches = conditionNode?.nodeConfig?.branches;
    expect(branches?.if).toBeDefined();
    expect(branches?.else).toBeDefined();
  });

  it("should correctly handle the scraper fallback logic via edges", () => {
    const conditionNode = jobApplicationNodes.find(
      (n) => n.kind === "condition",
    );
    const manualInputNode = jobApplicationNodes.find(
      (n) => n.name === "ASSISTANT_COLLABORATION",
    );
    const tailorNode = jobApplicationNodes.find(
      (n) => n.name === "ATS_OPTIMIZER",
    );

    expect(manualInputNode).toBeDefined();
    expect(tailorNode).toBeDefined();

    // Edge from Condition (else) to Manual Input
    const fallbackEdge = jobApplicationEdges.find(
      (e) =>
        e.source === conditionNode?.id && e.uiConfig?.sourceHandle === "else",
    );
    expect(fallbackEdge?.target).toBe(manualInputNode?.id);

    // Edge from Manual Input to Tailor
    const continueEdge = jobApplicationEdges.find(
      (e) => e.source === manualInputNode?.id,
    );
    expect(continueEdge?.target).toBe(tailorNode?.id);
  });

  it("should have a character limit on the base_resume input", () => {
    const inputNode = jobApplicationNodes.find((n) => n.kind === "input");
    const schema = inputNode?.nodeConfig?.outputSchema as any;
    expect(schema.properties.base_resume.maxLength).toBe(20000);
  });

  it("should use openrouter/free for LLM nodes", () => {
    const llmNodes = jobApplicationNodes.filter((n) => n.kind === "llm");
    for (const node of llmNodes) {
      expect(node.nodeConfig?.model?.model).toBe("openrouter/free");
    }
  });
});
