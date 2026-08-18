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
  const [analysisType, setAnalysisType] = useState<AnalysisType>("full_audit");

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

  const runAnalysis = () => {
    if (activeJob) {
      setValidationError("An analysis job is already active. Please wait or cancel it first.");
      return;
    }
    setValidationError(null);

    const requestPayload = {
      source: activeTab,
      analysisType,
      file: activeTab === "file" ? selectedFile ?? undefined : undefined,
      text: activeTab === "paste" ? pastedText : undefined,
    };

    const validation = validateAnalysisRequest(requestPayload);
    if (!validation.isValid) {
      setValidationError(validation.error || "Validation failed.");
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
