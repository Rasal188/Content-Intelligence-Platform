"use client";

import { useState } from "react";
import type { AnalysisType, InputSource } from "../_types/analysis";
import { validateAnalysisRequest } from "../_utils/validators";
import { useAnalysisJob } from "./use-analysis-job";

/**
 * Custom React hook encapsulating input workspace state management and Job Engine submission.
 */
export function useAnalyzer() {
  const [activeTab, setActiveTab] = useState<InputSource>("file");
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>("ai_detection");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>("");

  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    activeJob,
    queuedJobs,
    historyJobs,
    submitJob,
    cancelJob,
    deleteHistoryJob,
    duplicateJob,
    clearHistory,
  } = useAnalysisJob();

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

  const clearInputs = () => {
    setSelectedFile(null);
    setPastedText("");
    setValidationError(null);
  };

  // 1. Content validation check
  const hasValidContent =
    activeTab === "file"
      ? selectedFile !== null && selectedFile.size > 0
      : pastedText.trim().length >= 20 && pastedText.trim().length <= 50000;

  // 2. Mode selection check
  const hasSelectedMode = analysisType !== null && analysisType !== undefined;

  // 3. Complete enabled state condition: BOTH content AND mode must be valid
  const isSubmitDisabled = !hasValidContent || !hasSelectedMode || !!activeJob;

  const runAnalysis = () => {
    if (activeJob) {
      setValidationError(
        "An analysis job is already active. Please wait or cancel it first.",
      );
      return;
    }

    if (!hasSelectedMode || !hasValidContent) {
      setValidationError(
        "Select an analysis mode and provide content to continue.",
      );
      return;
    }

    setValidationError(null);

    const requestPayload = {
      source: activeTab,
      analysisType: analysisType!,
      file: activeTab === "file" ? selectedFile ?? undefined : undefined,
      text: activeTab === "paste" ? pastedText : undefined,
    };

    const validation = validateAnalysisRequest(requestPayload);
    if (!validation.isValid) {
      setValidationError(validation.error || "Select an analysis mode and provide content to continue.");
      return;
    }

    submitJob(requestPayload);
  };

  return {
    activeTab,
    analysisType,
    selectedFile,
    pastedText,
    validationError,
    activeJob,
    queuedJobs,
    historyJobs,
    hasValidContent,
    hasSelectedMode,
    isSubmitDisabled,
    handleTabChange,
    setAnalysisType,
    handleFileSelect,
    handleTextChange,
    clearInputs,
    runAnalysis,
    cancelJob,
    deleteHistoryJob,
    duplicateJob,
    clearHistory,
    dismissError: () => setValidationError(null),
  };
}
