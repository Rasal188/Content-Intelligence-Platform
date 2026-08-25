import type { AnalysisResultDomain } from "../_types/analysis-result.types";
import type { ResultViewModel } from "./result-view-model.service";

/**
 * Generates an executive, beautifully styled HTML printable report and opens the print/PDF dialog.
 */
export function exportReportToPdf(
  viewModel: ResultViewModel,
  rawResult: AnalysisResultDomain,
  reportType: "ai_detection" | "plagiarism" = "ai_detection",
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to export PDF reports.");
    return;
  }

  const title =
    reportType === "plagiarism"
      ? "Plagiarism & Originality Forensic Report"
      : "AI Forensic Detection Report";

  const scores = rawResult.scores;
  const stats = rawResult.statistics;
  const meta = rawResult.metadata;

  const humanProb = scores.humanProbability?.value ?? 0;
  const mixedProb = scores.mixedProbability?.value ?? 0;
  const aiProb = scores.aiProbability?.value ?? 0;

  const highlightsHtml = (rawResult.highlights || [])
    .map(
      (h, idx) => `
      <div style="margin-bottom: 12px; padding: 12px; border-radius: 6px; background: #fafafa; border-left: 4px solid ${
        h.riskLevel === "critical"
          ? "#ef4444"
          : h.riskLevel === "high"
            ? "#f97316"
            : h.riskLevel === "medium"
              ? "#eab308"
              : "#22c55e"
      };">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #666; margin-bottom: 4px;">
          Passage #${idx + 1} &bull; ${h.riskLevel.toUpperCase()} RISK (${h.probability}% probability)
        </div>
        <p style="font-size: 13px; font-family: monospace; color: #111; margin: 0 0 6px 0; background: #fff; padding: 8px; border: 1px solid #e5e5e5; border-radius: 4px;">
          "${escapeHtml(h.textSnippet)}"
        </p>
        <p style="font-size: 12px; color: #444; margin: 0;">
          <strong>Diagnostic Reason:</strong> ${escapeHtml(h.reason)}
        </p>
        ${
          h.recommendation
            ? `<p style="font-size: 12px; color: #0284c7; margin: 4px 0 0 0;"><strong>Recommendation:</strong> ${escapeHtml(h.recommendation)}</p>`
            : ""
        }
      </div>
    `,
    )
    .join("");

  const recommendationsHtml = (rawResult.recommendations || [])
    .map(
      (r) => `
      <div style="margin-bottom: 10px; padding: 10px; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <div style="font-weight: 600; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
          ${escapeHtml(r.title)}
        </div>
        <div style="font-size: 12px; color: #475569;">
          ${escapeHtml(r.description)}
        </div>
      </div>
    `,
    )
    .join("");

  const matchedSourcesHtml = (rawResult.matchedSources || [])
    .map(
      (s) => `
      <div style="margin-bottom: 10px; padding: 10px; border-radius: 6px; background: #fdf2f8; border: 1px solid #fbcfe8;">
        <div style="font-weight: 600; font-size: 13px; color: #831843;">
          ${escapeHtml(s.sourceTitle || "External Source")} &bull; ${s.similarityPercent}% match
        </div>
        <div style="font-size: 11px; color: #9d174d; margin: 2px 0;">
          URL: ${escapeHtml(s.sourceUrl || "N/A")}
        </div>
        <p style="font-size: 12px; color: #500724; margin: 4px 0 0 0;">
          "${escapeHtml(s.matchedSnippet || "")}"
        </p>
      </div>
    `,
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(viewModel.documentTitle)} - ${title}</title>
      <style>
        @page {
          size: A4;
          margin: 16mm 14mm 16mm 14mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 24px;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .brand {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #0f172a;
        }
        .report-badge {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #0f172a;
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 4px;
        }
        .doc-header {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 20px;
        }
        .doc-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 6px 0;
        }
        .doc-meta {
          font-size: 12px;
          color: #64748b;
        }
        .score-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .score-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px;
          background: #ffffff;
        }
        .score-card-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 6px;
        }
        .score-card-value {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
        }
        .score-card-desc {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }
        .probabilities-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .prob-card {
          border-radius: 8px;
          padding: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #0f172a;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          margin: 24px 0 12px 0;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .meta-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          background: #fafafa;
          font-size: 12px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px dashed #e5e5e5;
        }
        .meta-row:last-child {
          border-bottom: none;
        }
        .meta-label {
          color: #64748b;
        }
        .meta-val {
          font-weight: 600;
          color: #0f172a;
        }
        .footer {
          margin-top: 32px;
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">AI Forensic Intelligence</div>
        <div class="report-badge">${title}</div>
      </div>

      <div class="doc-header">
        <div class="doc-title">${escapeHtml(viewModel.documentTitle)}</div>
        <div class="doc-meta">
          ${escapeHtml(viewModel.documentMetaText)} &bull; ${escapeHtml(viewModel.readingTimeText)} &bull; Risk: <strong>${escapeHtml(rawResult.overallRiskLevel.toUpperCase())}</strong>
        </div>
      </div>

      ${
        reportType === "ai_detection"
          ? `
        <div class="probabilities-grid">
          <div class="prob-card" style="background: #f0fdf4; border: 1px solid #bbf7d0;">
            <span style="font-weight: 700; color: #166534; font-size: 13px;">Human Probability</span>
            <span style="font-size: 20px; font-weight: 800; color: #15803d;">${humanProb}%</span>
          </div>
          <div class="prob-card" style="background: #fefce8; border: 1px solid #fef08a;">
            <span style="font-weight: 700; color: #854d0e; font-size: 13px;">Mixed Content</span>
            <span style="font-size: 20px; font-weight: 800; color: #a16207;">${mixedProb}%</span>
          </div>
          <div class="prob-card" style="background: #fef2f2; border: 1px solid #fecaca;">
            <span style="font-weight: 700; color: #991b1b; font-size: 13px;">AI Probability</span>
            <span style="font-size: 20px; font-weight: 800; color: #b91c1c;">${aiProb}%</span>
          </div>
        </div>
      `
          : ""
      }

      <div class="score-grid">
        ${
          reportType === "plagiarism"
            ? `
          <div class="score-card">
            <div class="score-card-title">Originality Score</div>
            <div class="score-card-value">${scores.overallOriginality.value}%</div>
            <div class="score-card-desc">Confidence: ${scores.overallOriginality.confidence}%</div>
          </div>
          <div class="score-card">
            <div class="score-card-title">Plagiarism / Similarity</div>
            <div class="score-card-value">${scores.plagiarismSimilarity.value}%</div>
            <div class="score-card-desc">Confidence: ${scores.plagiarismSimilarity.confidence}%</div>
          </div>
          <div class="score-card">
            <div class="score-card-title">Matched Sources</div>
            <div class="score-card-value">${(rawResult.matchedSources || []).length}</div>
            <div class="score-card-desc">Verified Repositories</div>
          </div>
          <div class="score-card">
            <div class="score-card-title">Readability Index</div>
            <div class="score-card-value">${scores.readabilityQuality.value}%</div>
            <div class="score-card-desc">Confidence: ${scores.readabilityQuality.confidence}%</div>
          </div>
        `
            : `
          <div class="score-card">
            <div class="score-card-title">AI Probability</div>
            <div class="score-card-value">${scores.aiProbability?.value ?? 0}%</div>
            <div class="score-card-desc">Confidence: ${scores.aiProbability?.confidence ?? 80}%</div>
          </div>
          <div class="score-card">
            <div class="score-card-title">Human Probability</div>
            <div class="score-card-value">${humanProb}%</div>
            <div class="score-card-desc">Organic Authorship</div>
          </div>
          <div class="score-card">
            <div class="score-card-title">Mixed Content</div>
            <div class="score-card-value">${mixedProb}%</div>
            <div class="score-card-desc">Hybrid Probability</div>
          </div>
          <div class="score-card">
            <div class="score-card-title">Readability Index</div>
            <div class="score-card-value">${scores.readabilityQuality.value}%</div>
            <div class="score-card-desc">Confidence: ${scores.readabilityQuality.confidence}%</div>
          </div>
        `
        }
      </div>

      <div class="meta-grid">
        <div class="meta-card">
          <div style="font-weight: 700; margin-bottom: 8px; color: #0f172a;">Document Statistics</div>
          <div class="meta-row"><span class="meta-label">Word Count</span><span class="meta-val">${stats.words}</span></div>
          <div class="meta-row"><span class="meta-label">Character Count</span><span class="meta-val">${stats.characters}</span></div>
          <div class="meta-row"><span class="meta-label">Sentence Count</span><span class="meta-val">${stats.sentences ?? "—"}</span></div>
          <div class="meta-row"><span class="meta-label">Paragraph Count</span><span class="meta-val">${stats.paragraphs}</span></div>
          <div class="meta-row"><span class="meta-label">Vocabulary Diversity</span><span class="meta-val">${stats.vocabularyDiversityPercent}%</span></div>
        </div>
        <div class="meta-card">
          <div style="font-weight: 700; margin-bottom: 8px; color: #0f172a;">Forensic Audit Details</div>
          <div class="meta-row"><span class="meta-label">Engine Version</span><span class="meta-val">${meta.engineVersion}</span></div>
          <div class="meta-row"><span class="meta-label">Provider</span><span class="meta-val">${meta.providerName}</span></div>
          <div class="meta-row"><span class="meta-label">Timestamp</span><span class="meta-val">${new Date(meta.generatedAt).toLocaleString()}</span></div>
          <div class="meta-row"><span class="meta-label">Execution Time</span><span class="meta-val">${meta.executionTimeMs}ms</span></div>
          <div class="meta-row"><span class="meta-label">Checksum</span><span class="meta-val" style="font-family: monospace; font-size: 10px;">${meta.checksum.slice(0, 16)}...</span></div>
        </div>
      </div>

      ${
        highlightsHtml
          ? `
        <div class="section-title">Key Forensic Evidence & Highlights</div>
        <div>${highlightsHtml}</div>
      `
          : ""
      }

      ${
        matchedSourcesHtml
          ? `
        <div class="section-title">Matched External Sources</div>
        <div>${matchedSourcesHtml}</div>
      `
          : ""
      }

      ${
        recommendationsHtml
          ? `
        <div class="section-title">Actionable Recommendations</div>
        <div>${recommendationsHtml}</div>
      `
          : ""
      }

      <div class="footer">
        <div>Generated by AI Content Analyzer &bull; Confidential Forensic Audit</div>
        <div>Date: ${new Date().toLocaleDateString()}</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
