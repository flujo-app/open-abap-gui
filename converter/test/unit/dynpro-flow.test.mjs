import test from "node:test";
import assert from "node:assert/strict";
import { parseFlowLogic } from "../../src/dynpro-metadata.mjs";

test("multiline and chained screen fields retain their module associations", () => {
  const flow = parseFlowLogic(`PROCESS AFTER INPUT.
  CHAIN.
    FIELD: choice_a,
           choice_b.
    MODULE choose ON CHAIN-REQUEST.
    FIELD report_name:
      MODULE validate.
  ENDCHAIN.
PROCESS ON VALUE-REQUEST.
  FIELD report_name
    MODULE lookup.
PROCESS ON HELP-REQUEST.
  FIELD report_name MODULE help.
`, "demo.prog.screen_0100.abap", "0100");
  assert.deepEqual(flow.steps.filter(s => s.kind === "field").map(s => s.field), ["CHOICE_A", "CHOICE_B"]);
  assert.equal(flow.pai[0].name, "CHOOSE");
  assert.equal(flow.pai[0].onRequest, true);
  assert.equal(flow.pai[0].onChainRequest, true);
  assert.equal(flow.pai[1].field, "REPORT_NAME");
  assert.equal(flow.pai[1].chainDepth, 1);
  assert.equal(flow.pov.modules[0].name, "LOOKUP");
  assert.equal(flow.pov.modules[0].field, "REPORT_NAME");
  assert.equal(flow.poh.modules[0].name, "HELP");
});

test("comments and several statements on a line preserve flow phases", () => {
  const flow = parseFlowLogic(`* MODULE never.
PROCESS BEFORE OUTPUT. MODULE initialize. " MODULE never.
PROCESS AFTER INPUT.
MODULE exit AT EXIT-COMMAND.
`, "demo.prog.screen_0100.abap", "0100");
  assert.deepEqual(flow.pbo.map(m => m.name), ["INITIALIZE"]);
  assert.equal(flow.pbo[0].line, 2);
  assert.equal(flow.pai[0].atExitCommand, true);
});
