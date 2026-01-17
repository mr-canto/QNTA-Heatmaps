import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface ParsedData {
  rows: Record<string, string>[];
  totalRows: number;
  uniqueAddresses: number;
  hasAddressColumn: boolean;
}

interface FileError {
  type: "size" | "format" | "noAddress" | "parse";
  message: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PREVIEW_ROWS = 100;

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fileError, setFileError] = useState<FileError | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const parseExcelFile = useCallback(async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
            defval: "",
            raw: false,
          });

          // Check for Address column (case-insensitive)
          const firstRow = jsonData[0] || {};
          const columns = Object.keys(firstRow);
          const addressColumn = columns.find(
            (col) => col.toLowerCase() === "address"
          );

          if (!addressColumn) {
            reject({ type: "noAddress", message: "No Address column found in file" });
            return;
          }

          // Count unique addresses
          const addressSet = new Set<string>();
          jsonData.forEach((row) => {
            const address = row[addressColumn]?.toString().trim();
            if (address) {
              addressSet.add(address.toLowerCase());
            }
          });

          resolve({
            rows: jsonData.slice(0, PREVIEW_ROWS),
            totalRows: jsonData.length,
            uniqueAddresses: addressSet.size,
            hasAddressColumn: true,
          });
        } catch {
          reject({ type: "parse", message: "Failed to parse file. Please check the file format." });
        }
      };
      reader.onerror = () => {
        reject({ type: "parse", message: "Failed to read file" });
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const parseCsvFile = useCallback(async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const jsonData = results.data;

          // Check for Address column (case-insensitive)
          const columns = results.meta.fields || [];
          const addressColumn = columns.find(
            (col) => col.toLowerCase() === "address"
          );

          if (!addressColumn) {
            reject({ type: "noAddress", message: "No Address column found in file" });
            return;
          }

          // Count unique addresses
          const addressSet = new Set<string>();
          jsonData.forEach((row) => {
            const address = row[addressColumn]?.toString().trim();
            if (address) {
              addressSet.add(address.toLowerCase());
            }
          });

          resolve({
            rows: jsonData.slice(0, PREVIEW_ROWS),
            totalRows: jsonData.length,
            uniqueAddresses: addressSet.size,
            hasAddressColumn: true,
          });
        },
        error: () => {
          reject({ type: "parse", message: "Failed to parse CSV file" });
        },
      });
    });
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setFileError(null);
      setParsedData(null);
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
        const extension = file.name.split(".").pop()?.toLowerCase();
        let data: ParsedData;

        if (extension === "csv") {
          data = await parseCsvFile(file);
        } else {
          data = await parseExcelFile(file);
        }

        setProcessingProgress(100);
        setParsedData(data);
      } catch (err) {
        const error = err as FileError;
        setFileError(error);
        setSelectedFile(null);
      } finally {
        setIsProcessing(false);
        setProcessingProgress(0);
      }
    },
    [validateFile, parseExcelFile, parseCsvFile]
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
    setParsedData(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleConfirm = useCallback(() => {
    // TODO: Implement actual import processing in US-027a/b/c and US-028
    console.log("Import confirmed for file:", selectedFile?.name);
  }, [selectedFile]);

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
            {parsedData && !isProcessing && (
              <div className="mt-6">
                {/* Success Message */}
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      File parsed successfully
                    </p>
                    <p className="text-sm text-green-700">
                      {parsedData.totalRows.toLocaleString()} rows found,{" "}
                      {parsedData.uniqueAddresses.toLocaleString()} unique addresses
                    </p>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-[#dce3e7] rounded-lg overflow-hidden">
                  <div className="bg-[#f7f9fb] px-4 py-2 border-b border-[#dce3e7]">
                    <span className="text-sm font-medium text-[#627083]">
                      Preview (first {Math.min(PREVIEW_ROWS, parsedData.rows.length)} of{" "}
                      {parsedData.totalRows.toLocaleString()} rows)
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f7f9fb] sticky top-0">
                        <tr>
                          {parsedData.rows[0] &&
                            Object.keys(parsedData.rows[0]).map((col) => (
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
                        {parsedData.rows.map((row, idx) => (
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
