import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { ReviewController } from "./controller.js";

export default function reviewLoop(pi: ExtensionAPI) {
  let controller: ReviewController | null = null;

  const getController = (): ReviewController => {
    if (controller == null) {
      controller = new ReviewController(pi, () => {
        controller = null;
      });
    }
    return controller;
  };

  const openReview = async (args: string, ctx: ExtensionCommandContext): Promise<void> => {
    if (ctx.mode !== "tui") {
      ctx.ui.notify("Review Loop requires interactive TUI mode.", "warning");
      return;
    }
    try {
      await getController().openOrShow(ctx, args.trim());
    } catch (error) {
      controller = null;
      ctx.ui.notify(`Could not open Review Loop: ${error instanceof Error ? error.message : String(error)}`, "error");
    }
  };

  pi.registerCommand("diff-review", {
    description: "Open the incremental diff reviewer. With a ref (main, main...feature, origin/main..pr-42), review that range like a PR.",
    handler: openReview,
  });

  pi.on("session_shutdown", async () => {
    const active = controller;
    controller = null;
    await active?.close();
  });
}
