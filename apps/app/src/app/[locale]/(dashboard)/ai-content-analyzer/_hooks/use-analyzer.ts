"use client";

import { useCallback, useEffect, useState } from "react";
import { getAnalysisService } from "../_services/analysis.service";
import type {
  AnalysisJob,
  AnalysisType,
  DocumentItem,
  InputSource,
  LoadingStage,
} from "../_types/analysis";
import { validateAnalysisRequest } from "../_utils/validators";

/**
 * Custom React hook encapsulating state management, validation, loading stages, and service calls.
 */
export function useAnalyzer() {
  const [activeTab, setActiveTab] = useState<InputSource>("file");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("full_audit");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const [validationError, setValidationError] = useState<string | null>(null);

  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisJob[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<DocumentItem[]>([]);

  const service = getAnalysisService();

  const loadInitialData = useCallback(async () => {
    try {
      const [jobs, docs] = await Promise.all([
        service.getRecentAnalyses(),
        service.getRecentDocuments(),
      ]);
      setRecentAnalyses(jobs);
      setRecentDocuments(docs);
    } catch {
      setValidationError("Failed to load recent activity.");
    }
  }, [service]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleTabChange = (tab: InputSource) => {
    setActiveTab(tab);
    setValidationError(null);
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setValidationError(null);
  };

  const handleTextChange = (text: string) => {
    setPastedText(text);
    setValidationError(null);
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    setValidationError(null);
  };

  const clearInputs = () => {
    setSelectedFile(null);
    setPastedText("");
    setUrlInput("");
    setValidationError(null);
  };

  const runAnalysis = async () => {
    setValidationError(null);

    const requestPayload = {
      source: activeTab,
      analysisType,
      file: activeTab === "file" ? selectedFile ?? undefined : undefined,
      text: activeTab === "paste" ? pastedText : undefined,
      url: activeTab === "url" ? urlInput : undefined,
    };

    const validation = validateAnalysisRequest(requestPayload);
    if (!validation.isValid) {
      setValidationError(validation.error || "Validation failed.");
      return;
    }

    setIsLoading(true);
    setLoadingStage("uploading");
    setProgressPercent(10);

    try {
      const job = await service.submitAnalysis(
        requestPayload,
        (stage, percent) => {
          setLoadingStage(stage);
          setProgressPercent(percent);
        },
      );

      setRecentAnalyses((prev) => [job, ...prev.filter((j) => j.id !== job.id)]);
      await loadInitialData();
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Analysis service request failed.",
      );
    } finally {
      setIsLoading(false);
      setLoadingStage("idle");
      setProgressPercent(0);
    }
  };

  return {
    activeTab,
    analysisType,
    selectedFile,
    pastedText,
    urlInput,
    isLoading,
    loadingStage,
    progressPercent,
    validationError,
    recentAnalyses,
    recentDocuments,
    handleTabChange,
    setAnalysisType,
    handleFileSelect,
    handleTextChange,
    handleUrlChange,
    clearInputs,
    runAnalysis,
    dismissError: () => setValidationError(null),
  };
}
