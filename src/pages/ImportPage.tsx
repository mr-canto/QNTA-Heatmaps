import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle } from "lucide-react";
import {
  parseFile,
  type ParseResult,
  type ParseError,
  type DeduplicatedProperty,
} from "@/lib/importProcessor";

interface FileError {
  type: "size" | "format" | "noAddress" | "parse";
  message: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PREVIEW_ROWS = 100;

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileError, setFileError] = useState<FileError | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store parsed properties for import processing
  const [parsedProperties, setParsedProperties] = useState<DeduplicatedProperty[]>([]);

  const validateFile = useCallback((file: File): FileError | null => {
    if (file.size > MAX_FILE_SIZE) {
      return { type: "size", message: "File exceeds 10MB limit" };
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(extension || "")) {
      return { type: "format", message: "Please upload an Excel or CSV file" };
    }

    return null;
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setFileError(null);
      setParseResult(null);
      setParsedProperties([]);
      setSelectedFile(file);
      setIsProcessing(true);
      setProcessingProgress(10);

      const validationError = validateFile(file);
      if (validationError) {
        setFileError(validationError);
        setSelectedFile(null);
        setIsProcessing(false);
        return;
      }

      try {
        setProcessingProgress(30);
        const result = await parseFile(file);
        setProcessingProgress(100);
        setParseResult(result);
        setParsedProperties(result.properties);
      } catch (err) {
        const error = err as ParseError;
        setFileError({ type: error.type, message: error.message });
        setSelectedFile(null);
      } finally {
        setIsProcessing(false);
        setProcessingProgress(0);
      }
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setParseResult(null);
    setParsedProperties([]);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleConfirm = useCallback(() => {
    // TODO: Implement actual import processing in US-027b/c and US-028
    console.log("Import confirmed for file:", selectedFile?.name);
    console.log("Properties to import:", parsedProperties.length);
  }, [selectedFile, parsedProperties]);

  return (
    <main className="pt-[72px] min-h-screen bg-[#f7f9fb]">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-[#1f2a37] mb-6">Import Data</h1>

        <Card className="shadow-[0_6px_16px_rgba(15,23,42,0.08)] border-[#dce3e7]">
          <CardHeader className="border-b border-[#dce3e7]">
            <CardTitle className="text-lg text-[#1f2a37]">Upload File</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Drag and Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-[#0f5d5e] bg-[#d9eceb]"
                  : "border-[#dce3e7] hover:border-[#0f5d5e] hover:bg-[#f0f7f7]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleInputChange}
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto mb-4 text-[#627083]" />
              <p className="text-[#1f2a37] font-medium mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-sm text-[#627083]">
                Supports Excel (.xlsx, .xls) and CSV files up to 10MB
              </p>
            </div>

            {/* Processing Progress */}
            {isProcessing && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#0f5d5e]" />
                  <span className="text-sm text-[#627083]">
                    Processing {selectedFile?.name}...
                  </span>
                </div>
                <Progress value={processingProgress} className="h-2" />
              </div>
            )}

            {/* Error Display */}
            {fileError && (
              <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Upload Error</p>
                  <p className="text-sm text-red-700">{fileError.message}</p>
                </div>
              </div>
            )}

            {/* Preview Section */}
            {parseResult && !isProcessing && (
              <div className="mt-6">
                {/* Success Message */}
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      File parsed successfully
                    </p>
                    <p className="text-sm text-green-700">
                      {parseResult.totalRows.toLocaleString()} rows found,{" "}
                      {parseResult.uniqueAddresses.toLocaleString()} unique addresses
                    </p>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-[#dce3e7] rounded-lg overflow-hidden">
                  <div className="bg-[#f7f9fb] px-4 py-2 border-b border-[#dce3e7]">
                    <span className="text-sm font-medium text-[#627083]">
                      Preview (first {Math.min(PREVIEW_ROWS, parseResult.previewRows.length)} of{" "}
                      {parseResult.totalRows.toLocaleString()} rows)
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f7f9fb] sticky top-0">
                        <tr>
                          {parseResult.previewRows[0] &&
                            Object.keys(parseResult.previewRows[0]).map((col) => (
                              <th
                                key={col}
                                className="px-4 py-2 text-left font-medium text-[#627083] border-b border-[#dce3e7]"
                              >
                                {col}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult.previewRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-[#eef2f1] hover:bg-[#f7f9fb]"
                          >
                            {Object.values(row).map((val, colIdx) => (
                              <td
                                key={colIdx}
                                className="px-4 py-2 text-[#1f2a37] max-w-[200px] truncate"
                              >
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-[#dce3e7] text-[#627083] hover:bg-[#f7f9fb]"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="bg-[#0f5d5e] hover:bg-[#0b4d4f] text-white"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm Import
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
