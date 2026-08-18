"use client";

import { useCallback, useEffect, useState } from "react";
import { getResultBuilderService } from "../_services/result-builder.service";
import {
  getResultViewModelService,
  type ResultViewModel,
} from "../_services/result-view-model.service";
import type { AnalysisResultDomain } from "../_types/analysis-result.types";

/**
 * Custom React hook fetching and mapping an AnalysisResultDomain into a UI ResultViewModel.
 * @param jobId Job ID to query.
 * @param documentName Document name string.
 * @param textContent Optional raw text content.
 */
export function useAnalysisResult(
  jobId?: string,
  documentName?: string,
  textContent?: string,
) {
  const [resultDomain, setResultDomain] = useState<AnalysisResultDomain | null>(null);
  const [viewModel, setViewModel] = useState<ResultViewModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const builderService = getResultBuilderService();
  const viewModelService = getResultViewModelService();

  const loadResult = useCallback(async () => {
    if (!jobId || !documentName) {
      setResultDomain(null);
      setViewModel(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const domain = await builderService.buildResult(jobId, documentName, textContent);
      const vm = viewModelService.toViewModel(domain);
      setResultDomain(domain);
      setViewModel(vm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analysis result.");
    } finally {
      setIsLoading(false);
    }
  }, [jobId, documentName, textContent, builderService, viewModelService]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  return {
    resultDomain,
    viewModel,
    isLoading,
    error,
    refreshResult: loadResult,
  };
}
