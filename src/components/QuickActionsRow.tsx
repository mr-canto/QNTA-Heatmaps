import { useNavigate } from "react-router-dom";
import { Map, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExportData } from "@/hooks/useExportData";

export default function QuickActionsRow() {
  const navigate = useNavigate();
  const { exportToCSV, isExporting } = useExportData();

  return (
    <div className="flex flex-wrap gap-4">
      <Button
        variant="outline"
        className="bg-white border-[#dce3e7] hover:bg-[#f4f7f6] hover:border-[#0f5d5e]/30 text-[#1f2a37]"
        onClick={() => navigate("/heatmap")}
      >
        <Map className="size-4" />
        View Heatmap
      </Button>
      <Button
        variant="outline"
        className="bg-white border-[#dce3e7] hover:bg-[#f4f7f6] hover:border-[#0f5d5e]/30 text-[#1f2a37]"
        onClick={() => navigate("/import")}
      >
        <Upload className="size-4" />
        Import Data
      </Button>
      <Button
        variant="outline"
        className="bg-white border-[#dce3e7] hover:bg-[#f4f7f6] hover:border-[#0f5d5e]/30 text-[#1f2a37]"
        onClick={exportToCSV}
        disabled={isExporting}
      >
        <Download className="size-4" />
        {isExporting ? "Exporting..." : "Export Data"}
      </Button>
    </div>
  );
}
