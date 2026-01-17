import { useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import {
  parseFile,
  validateProperties,
  geocodeProperties,
  type ParseResult,
  type ParseError,
  type ValidationResult,
  type GeocodingResult,
  type ExcludedProperty,
} from "@/lib/importProcessor";
import { saveImportToDatabase } from "@/lib/importService";
import { useAuth } from "@/hooks/useAuth";
import { useImports } from "@/hooks/useImports";

interface FileError {
  type: "size" | "format" | "noAddress" | "parse" | "noValidAddresses" | "geocoding" | "database";
  message: string;
}

interface ImportSuccess {
  propertiesImported: number;
  excludedCount: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PREVIEW_ROWS = 100;

export default function ImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: imports = [], isLoading: isImportsLoading } = useImports();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [fileError, setFileError] = useState<FileError | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [showExcluded, setShowExcluded] = useState(false);
  const [importSuccess, setImportSuccess] = useState<ImportSuccess | null>(null);
  const [allExcluded, setAllExcluded] = useState<ExcludedProperty[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFileSize = useCallback((file: File): FileError | null => {
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
      setValidationResult(null);
      setShowExcluded(false);
      setImportSuccess(null);
      setAllExcluded([]);
      setSelectedFile(file);
      setIsProcessing(true);
      setProcessingProgress(10);

      const sizeError = validateFileSize(file);
      if (sizeError) {
        setFileError(sizeError);
        setSelectedFile(null);
        setIsProcessing(false);
        return;
      }

      try {
        // Step 1: Parse file
        setProcessingProgress(30);
        const result = await parseFile(file);
        setParseResult(result);

        // Step 2: Validate and extract postcodes
        setProcessingProgress(70);
        const validation = validateProperties(result.properties);

        // Check if all addresses are invalid
        if (validation.validProperties.length === 0) {
          setFileError({
            type: "noValidAddresses",
            message: "No valid addresses found. All addresses are missing valid UK postcodes.",
          });
          setSelectedFile(null);
          setIsProcessing(false);
          return;
        }

        setValidationResult(validation);
        setProcessingProgress(100);
      } catch (err) {
        const error = err as ParseError;
        setFileError({ type: error.type, message: error.message });
        setSelectedFile(null);
      } finally {
        setIsProcessing(false);
        setProcessingProgress(0);
      }
    },
    [validateFileSize]
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
    setValidationResult(null);
    setFileError(null);
    setShowExcluded(false);
    setImportSuccess(null);
    setAllExcluded([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!validationResult || !selectedFile || !user) return;

    setIsImporting(true);
    setImportProgress(0);
    setFileError(null);

    try {
      // Step 1: Geocode properties (0-60% progress)
      setImportProgress(5);
      let geocodingResult: GeocodingResult;

      try {
        geocodingResult = await geocodeProperties(
          validationResult.validProperties,
          (progress) => setImportProgress(5 + progress * 0.55)
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Geocoding failed";
        setFileError({ type: "geocoding", message });
        setIsImporting(false);
        return;
      }

      // Combine excluded from validation and geocoding
      const combinedExcluded = [
        ...validationResult.excludedProperties,
        ...geocodingResult.excludedProperties,
      ];
      setAllExcluded(combinedExcluded);

      // Check if all properties failed geocoding
      if (geocodingResult.geocodedProperties.length === 0) {
        setFileError({
          type: "geocoding",
          message: "No properties could be geocoded. Please check the postcodes in your file.",
        });
        setIsImporting(false);
        return;
      }

      // Step 2: Save to database (60-100% progress)
      setImportProgress(65);
      const importResult = await saveImportToDatabase(
        geocodingResult.geocodedProperties,
        selectedFile.name,
        user.id
      );

      if (!importResult.success) {
        setFileError({
          type: "database",
          message: importResult.error || "Failed to save import to database",
        });
        setIsImporting(false);
        return;
      }

      setImportProgress(100);

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["imports"] });
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
      await queryClient.invalidateQueries({ queryKey: ["outcodeStats"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });

      // Show success state
      setImportSuccess({
        propertiesImported: importResult.propertiesImported,
        excludedCount: combinedExcluded.length,
      });

      // Clear file state but keep success message
      setSelectedFile(null);
      setParseResult(null);
      setValidationResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [validationResult, selectedFile, user, queryClient]);

  // Summary stats
  const stats = useMemo(() => {
    if (!parseResult || !validationResult) return null;
    return {
      totalRows: parseResult.totalRows,
      uniqueAddresses: parseResult.uniqueAddresses,
      validCount: validationResult.validProperties.length,
      excludedCount: validationResult.excludedProperties.length,
    };
  }, [parseResult, validationResult]);

  return (
    <main className="pt-[72px] min-h-screen bg-[#f7f9fb]">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-[#1f2a37] mb-6">Import Data</h1>

        <Card className="shadow-[0_6px_16px_rgba(15,23,42,0.08)] border-[#dce3e7]">
          <CardHeader className="border-b border-[#dce3e7]">
            <CardTitle className="text-lg text-[#1f2a37]">Upload File</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Import Success Message */}
            {importSuccess && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    Import completed successfully
                  </p>
                  <p className="text-sm text-green-700">
                    {importSuccess.propertiesImported.toLocaleString()} properties imported
                    {importSuccess.excludedCount > 0 && (
                      <>, {importSuccess.excludedCount.toLocaleString()} excluded</>
                    )}
                  </p>
                  <Button
                    onClick={() => navigate("/heatmap")}
                    className="mt-3 bg-[#0f5d5e] hover:bg-[#0b4d4f] text-white"
                    size="sm"
                  >
                    View on Heatmap
                  </Button>
                </div>
              </div>
            )}

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

            {/* Import Progress */}
            {isImporting && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-5 h-5 text-[#0f5d5e] animate-spin" />
                  <span className="text-sm text-[#627083]">
                    {importProgress < 60
                      ? "Geocoding addresses..."
                      : "Saving to database..."}
                  </span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}

            {/* Error Display */}
            {fileError && (
              <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {fileError.type === "geocoding"
                      ? "Geocoding Error"
                      : fileError.type === "database"
                        ? "Database Error"
                        : "Upload Error"}
                  </p>
                  <p className="text-sm text-red-700">{fileError.message}</p>
                </div>
              </div>
            )}

            {/* Validation Results */}
            {stats && !isProcessing && !isImporting && !importSuccess && (
              <div className="mt-6">
                {/* Success Message */}
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      File validated successfully
                    </p>
                    <p className="text-sm text-green-700">
                      {stats.totalRows.toLocaleString()} rows,{" "}
                      {stats.validCount.toLocaleString()} properties ready to import
                    </p>
                  </div>
                </div>

                {/* Excluded Warning */}
                {stats.excludedCount > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => setShowExcluded(!showExcluded)}
                      className="w-full flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left"
                    >
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">
                          {stats.excludedCount.toLocaleString()} address
                          {stats.excludedCount === 1 ? "" : "es"} will be excluded
                        </p>
                        <p className="text-sm text-amber-700">
                          These addresses are missing valid UK postcodes
                        </p>
                      </div>
                      {showExcluded ? (
                        <ChevronUp className="w-5 h-5 text-amber-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-amber-600" />
                      )}
                    </button>

                    {/* Excluded List */}
                    {showExcluded && validationResult && (
                      <div className="mt-2 border border-amber-200 rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-amber-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-amber-800 border-b border-amber-200">
                                Address
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-amber-800 border-b border-amber-200">
                                Reason
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {validationResult.excludedProperties.map((prop, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-amber-100 last:border-0"
                              >
                                <td className="px-4 py-2 text-amber-900 max-w-[300px] truncate">
                                  {prop.address}
                                </td>
                                <td className="px-4 py-2 text-amber-700">
                                  {prop.reason}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Preview Table */}
                {parseResult && (
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
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-[#dce3e7] text-[#627083] hover:bg-[#f7f9fb]"
                    disabled={isImporting}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="bg-[#0f5d5e] hover:bg-[#0b4d4f] text-white"
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Confirm Import ({stats.validCount.toLocaleString()})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Post-Import Excluded List */}
            {importSuccess && allExcluded.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowExcluded(!showExcluded)}
                  className="w-full flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      {allExcluded.length.toLocaleString()} address
                      {allExcluded.length === 1 ? "" : "es"} were excluded
                    </p>
                    <p className="text-sm text-amber-700">
                      Click to view details
                    </p>
                  </div>
                  {showExcluded ? (
                    <ChevronUp className="w-5 h-5 text-amber-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-amber-600" />
                  )}
                </button>

                {showExcluded && (
                  <div className="mt-2 border border-amber-200 rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-amber-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-amber-800 border-b border-amber-200">
                            Address
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-amber-800 border-b border-amber-200">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allExcluded.map((prop, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-amber-100 last:border-0"
                          >
                            <td className="px-4 py-2 text-amber-900 max-w-[300px] truncate">
                              {prop.address}
                            </td>
                            <td className="px-4 py-2 text-amber-700">
                              {prop.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import History Table */}
        <Card className="mt-6 shadow-[0_6px_16px_rgba(15,23,42,0.08)] border-[#dce3e7]">
          <CardHeader className="border-b border-[#dce3e7]">
            <CardTitle className="text-lg text-[#1f2a37]">Import History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isImportsLoading ? (
              <div className="p-6 text-center text-[#627083]">Loading imports...</div>
            ) : imports.length === 0 ? (
              <div className="p-6 text-center text-[#627083]">No imports yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f7f9fb]">
                    <TableHead className="font-medium text-[#627083]">Date</TableHead>
                    <TableHead className="font-medium text-[#627083]">Filename</TableHead>
                    <TableHead className="font-medium text-[#627083] text-right">Records</TableHead>
                    <TableHead className="font-medium text-[#627083]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((imp) => (
                    <TableRow
                      key={imp.id}
                      className={imp.is_current ? "bg-[#d9eceb]/30" : ""}
                    >
                      <TableCell className="text-[#1f2a37]">
                        {new Date(imp.uploaded_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-[#1f2a37] max-w-[200px] truncate">
                        {imp.filename}
                      </TableCell>
                      <TableCell className="text-[#1f2a37] text-right tabular-nums">
                        {imp.record_count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {imp.is_current ? (
                          <Badge className="bg-[#0f5d5e] hover:bg-[#0b4d4f] text-white">
                            Current
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[#627083] border-[#dce3e7]">
                            Historical
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
