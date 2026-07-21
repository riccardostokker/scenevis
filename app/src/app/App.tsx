import { TooltipProvider } from "@/components/ui/tooltip";

import { Workspace } from "../features/scene-analysis/Workspace";

export function App() {
  return (
    <TooltipProvider>
      <Workspace />
    </TooltipProvider>
  );
}
