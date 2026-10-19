import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, BrainCircuit, CheckCircle2, Clock3, Download,
  LayoutDashboard, LoaderCircle, MessageSquareText, Mic, MicOff,
  RefreshCw, Search, Settings, Sparkles, ThumbsDown, ThumbsUp, X,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart,
  Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from "recharts";
import API from "./api";
import "./App.css";

const NAVIGATION = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Sentiment Analysis", icon: MessageSquareText },
  { name: "Analytics", icon: BarChart3 },
  { name: "Model Performance", icon: BrainCircuit },
  { name: "Analysis History", icon: Clock3 },
  { name: "Settings", icon: Settings },
];
const SENTIMENT_COLORS = { positive: "#16a34a", negative: "#dc2626", neutral: "#64748b" };
const CLASS_ORDER = ["negative", "neutral", "positive"];
const LANGUAGE_OPTIONS = [
  { label: "English (India)", value: "en-IN" },
  { label: "తెలుగు (Telugu)", value: "te-IN" },
  { label: "हिन्दी (Hindi)", value: "hi-IN" },
];

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
function formatPercent(value) {
  const n = asNumber(value);
  return `${(n <= 1 ? n * 100 : n).toFixed(2)}%`;
}
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
function getRecordText(record) {
  return record?.text ?? record?.input_text ?? record?.original_text ?? record?.review ?? "";
}
function getRecordSentiment(record) {
  return String(record?.sentiment ?? record?.prediction ?? record?.label ?? "unknown").toLowerCase();
}
function normalizeStats(data) {
  const source = data?.stats ?? data?.data ?? data ?? {};
  return {
    total: asNumber(source.total ?? source.total_analyses ?? source.totalAnalyses),
    positive: asNumber(source.positive), negative: asNumber(source.negative), neutral: asNumber(source.neutral),
  };
}
function normalizeLabel(label) {
  const value = String(label ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
  if (/^(neg|negative|0)$/.test(value)) return value === "0" ? "0" : "negative";
  if (/^(neu|neutral|1)$/.test(value)) return value === "1" ? "1" : "neutral";
  if (/^(pos|positive|2)$/.test(value)) return value === "2" ? "2" : "positive";
  return value;
}
function extractPerformanceResponse(responseData) {
  const root = responseData?.data ?? responseData ?? {};
  const metrics = root.metrics ?? root.model_metrics ?? root.model_performance ?? root.performance ?? root;
  if (!metrics || typeof metrics !== "object") return null;
  const report = metrics.classification_report ?? root.classification_report ?? root.classificationReport ?? {};
  const matrix = metrics.confusion_matrix ?? root.confusion_matrix ?? root.confusionMatrix ?? [];
  const rawLabels = metrics.labels ?? root.labels ?? report.labels ?? CLASS_ORDER;
  const macroAverage = report["macro avg"] ?? report.macro_avg ?? metrics.macro_avg ?? {};
  const weightedAverage = report["weighted avg"] ?? report.weighted_avg ?? metrics.weighted_avg ?? {};
  const accuracyValue = metrics.accuracy ?? root.accuracy ?? null;
  const hasClassMetrics = CLASS_ORDER.some((label) => report[label] && typeof report[label] === "object");
  const hasMatrix = Array.isArray(matrix) && matrix.length > 0;
  if (accuracyValue == null && !Object.keys(macroAverage).length && !Object.keys(weightedAverage).length && !hasClassMetrics && !hasMatrix) return null;
  return {
    accuracy: accuracyValue == null ? null : asNumber(accuracyValue),
    trainingRecords: asNumber(metrics.training_records ?? metrics.trainingRecords ?? root.training_records),
    testRecords: asNumber(metrics.labeled_test_records ?? metrics.test_records ?? metrics.testRecords ?? root.labeled_test_records),
    report,
    confusionMatrix: hasMatrix ? matrix : [],
    labels: Array.isArray(rawLabels) ? rawLabels.map((label) => String(label).toLowerCase()) : CLASS_ORDER,
    macroAverage, weightedAverage,
  };
}
function getClassMetrics(performance) {
  if (!performance) return [];
  const report = performance.report ?? {};
  return CLASS_ORDER.map((label) => {
    const item = report[label] ?? report[label.toUpperCase()] ?? {};
    return {
      name: label, precision: item.precision ?? null, recall: item.recall ?? null,
      f1: item["f1-score"] ?? item.f1_score ?? item.f1 ?? null,
      support: item.support ?? null, color: SENTIMENT_COLORS[label],
    };
  });
}
function getOneVsRestStats(matrix, index) {
  if (!Array.isArray(matrix) || !matrix.length || !matrix.every((row) => Array.isArray(row) && row.length === matrix.length)) return null;
  const size = matrix.length;
  const numeric = matrix.map((row) => row.map(asNumber));
  const total = numeric.flat().reduce((sum, value) => sum + value, 0);
  const tp = numeric[index]?.[index] ?? 0;
  const actualTotal = numeric[index].reduce((sum, value) => sum + value, 0);
  const predictedTotal = numeric.reduce((sum, row) => sum + (row[index] ?? 0), 0);
  const fn = actualTotal - tp;
  const fp = predictedTotal - tp;
  const tn = total - tp - fn - fp;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { tp, tn, fp, fn, precision, recall, f1, support: actualTotal, total, size };
}
function sentimentLabel(label, index) {
  const normalized = normalizeLabel(label);
  if (CLASS_ORDER.includes(normalized)) return normalized;
  // Numeric labels are kept in the backend's stated order; the default 3-class order is used only when labels are absent.
  return `class-${label || index + 1}`;
}
function SentimentBadge({ sentiment }) {
  const value = String(sentiment ?? "unknown").toLowerCase();
  return <span className={`sentiment-badge ${value}`}>{value}</span>;
}
function MetricCard({ title, value, icon: Icon, description }) {
  return <div className="metric-card"><div className="metric-card-header"><span>{title}</span>{Icon && <Icon size={22} />}</div><div className="metric-value">{value}</div>{description && <p className="metric-description">{description}</p>}</div>;
}
function EmptyState({ message }) { return <div className="empty-state"><Activity size={24} /><p>{message}</p></div>; }
function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return <div className="error-message" role="alert"><p>{message}</p>{onRetry && <button type="button" className="secondary-button" onClick={onRetry}><RefreshCw size={16} /> Retry</button>}</div>;
}
function SentimentPieChart({ stats }) {
  const data = [
    { name: "Positive", value: stats.positive, color: SENTIMENT_COLORS.positive },
    { name: "Negative", value: stats.negative, color: SENTIMENT_COLORS.negative },
    { name: "Neutral", value: stats.neutral, color: SENTIMENT_COLORS.neutral },
  ];
  if (data.every((item) => item.value === 0)) return <EmptyState message="No sentiment data is available yet." />;
  return <div className="chart-container"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={48} paddingAngle={3} label>{data.map((item) => <Cell key={item.name} fill={item.color} stroke="#fff" strokeWidth={2} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>;
}
function SentimentBarChart({ stats }) {
  const data = [
    { name: "Positive", count: stats.positive, color: SENTIMENT_COLORS.positive },
    { name: "Negative", count: stats.negative, color: SENTIMENT_COLORS.negative },
    { name: "Neutral", count: stats.neutral, color: SENTIMENT_COLORS.neutral },
  ];
  return <div className="chart-container"><ResponsiveContainer width="100%" height={280}><BarChart data={data} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9e3f5" /><XAxis dataKey="name" tick={{ fill: "#625777", fontSize: 12 }} axisLine={{ stroke: "#dcd4eb" }} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: "#625777", fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "#f3effb" }} /><Bar dataKey="count" name="Analyses" radius={[8, 8, 0, 0]} maxBarSize={65}>{data.map((item) => <Cell key={item.name} fill={item.color} />)}</Bar></BarChart></ResponsiveContainer></div>;
}
function SentimentTrendChart({ trends }) {
  if (!Array.isArray(trends) || !trends.length) return <EmptyState message="No trend data is available yet." />;
  const data = trends.map((item, index) => ({ date: item.date ?? item.day ?? item._id ?? `Record ${index + 1}`, positive: asNumber(item.positive), negative: asNumber(item.negative), neutral: asNumber(item.neutral) }));
  return <div className="chart-container"><ResponsiveContainer width="100%" height={300}><LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9e3f5" /><XAxis dataKey="date" tick={{ fill: "#625777", fontSize: 12 }} axisLine={{ stroke: "#dcd4eb" }} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: "#625777", fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip /><Legend /><Line type="monotone" dataKey="positive" name="Positive" stroke={SENTIMENT_COLORS.positive} strokeWidth={3} dot={{ r: 4 }} /><Line type="monotone" dataKey="negative" name="Negative" stroke={SENTIMENT_COLORS.negative} strokeWidth={3} dot={{ r: 4 }} /><Line type="monotone" dataKey="neutral" name="Neutral" stroke={SENTIMENT_COLORS.neutral} strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>;
}
function AnalysisTable({ records }) {
  if (!records.length) return <EmptyState message="No analysis history found." />;
  return <div className="table-container"><table className="analysis-table"><thead><tr><th>Text</th><th>Sentiment</th><th>Date</th></tr></thead><tbody>{records.map((record, index) => <tr key={record._id ?? record.id ?? index}><td className="record-text">{getRecordText(record) || "—"}</td><td><SentimentBadge sentiment={getRecordSentiment(record)} /></td><td>{formatDate(record.created_at ?? record.timestamp ?? record.date)}</td></tr>)}</tbody></table></div>;
}
function ConfusionMatrixPanel({ performance }) {
  const matrix = performance.confusionMatrix;
  const labels = performance.labels?.length ? performance.labels : CLASS_ORDER;
  const validMatrix = Array.isArray(matrix) && matrix.length === 3 && matrix.every((row) => Array.isArray(row) && row.length === 3);
  const canonicalIndexes = CLASS_ORDER.map((canonical) => {
    const found = labels.findIndex((label) => normalizeLabel(label) === canonical);
    return found;
  });
  const allCanonicalLabelsPresent = canonicalIndexes.every((index) => index >= 0);
  const displayOrder = allCanonicalLabelsPresent ? canonicalIndexes : labels.map((_, index) => index);
  const displayLabels = displayOrder.map((index) => {
    const label = labels[index];
    const normalized = normalizeLabel(label);
    return CLASS_ORDER.includes(normalized) ? normalized : String(label ?? `Class ${index + 1}`);
  });
  const total = validMatrix ? matrix.flat().reduce((sum, value) => sum + asNumber(value), 0) : 0;
  const metrics = validMatrix ? displayOrder.map((originalIndex, displayIndex) => ({
    label: displayLabels[displayIndex],
    sentiment: CLASS_ORDER.includes(normalizeLabel(displayLabels[displayIndex])) ? normalizeLabel(displayLabels[displayIndex]) : "unknown",
    ...getOneVsRestStats(matrix, originalIndex),
  })) : [];
  return <section className="panel performance-panel confusion-panel">
    <div className="section-heading-row"><div><span className="eyebrow">ERROR ANALYSIS</span><h2>Confusion Matrix</h2><p>Rows show actual classes; columns show predicted classes. Values come directly from the model-performance API.</p></div><div className="matrix-total"><span>Total evaluated</span><strong>{validMatrix ? total.toLocaleString("en-IN") : "N/A"}</strong></div></div>
    {!matrix.length ? <EmptyState message="Confusion matrix is not available in the API response." /> : !validMatrix ? <div className="matrix-warning">The API returned a matrix that is not a valid 3 × 3 matrix. Check the backend labels and confusion_matrix values.</div> : <>
      <div className="matrix-legend"><span><i className="legend-square correct" /> Correct prediction (diagonal)</span><span><i className="legend-square incorrect" /> Misclassification</span></div>
      <div className="matrix-scroll"><table className="confusion-matrix"><thead><tr><th className="matrix-axis-label">Actual ↓ / Predicted →</th>{displayLabels.map((label, index) => <th key={`${label}-${index}`}><span className={`matrix-label ${normalizeLabel(label)}`}>{label}</span></th>)}</tr></thead><tbody>{displayOrder.map((rowIndex, displayRowIndex) => <tr key={`${labels[rowIndex]}-${rowIndex}`}><th className="matrix-row-heading"><span className={`matrix-label ${normalizeLabel(labels[rowIndex])}`}>{displayLabels[displayRowIndex]}</span></th>{displayOrder.map((columnIndex, displayColumnIndex) => { const value = asNumber(matrix[rowIndex]?.[columnIndex]); const correct = rowIndex === columnIndex; return <td key={`${rowIndex}-${columnIndex}`} className={correct ? "diagonal" : "off-diagonal"}><span className="matrix-count">{value.toLocaleString("en-IN")}</span>{correct && <span className="matrix-cell-caption">Correct</span>}</td>; })}</tr>)}</tbody></table></div>
      <div className="matrix-metrics-heading"><div><span className="eyebrow">ONE-VS-REST METRICS</span><h3>Per-class performance</h3></div><p>TP, TN, FP and FN are calculated from the returned confusion matrix.</p></div>
      <div className="class-metrics-grid">{metrics.map((item) => item && <article className={`class-metric-card ${item.sentiment}`} key={`${item.label}-${item.tp}`}><div className="class-metric-card-header"><span className={`matrix-label ${item.sentiment}`}>{item.label}</span><span className="class-support">Support <strong>{asNumber(item.support).toLocaleString("en-IN")}</strong></span></div><div className="class-score-grid"><div><span>Precision</span><strong>{formatPercent(item.precision)}</strong><div className="score-track"><i style={{ width: `${Math.max(0, Math.min(100, item.precision * 100))}%` }} /></div></div><div><span>Recall</span><strong>{formatPercent(item.recall)}</strong><div className="score-track"><i style={{ width: `${Math.max(0, Math.min(100, item.recall * 100))}%` }} /></div></div><div><span>F1-score</span><strong>{formatPercent(item.f1)}</strong><div className="score-track"><i style={{ width: `${Math.max(0, Math.min(100, item.f1 * 100))}%` }} /></div></div></div><div className="confusion-counts"><div><span>TP</span><strong>{asNumber(item.tp).toLocaleString("en-IN")}</strong></div><div><span>TN</span><strong>{asNumber(item.tn).toLocaleString("en-IN")}</strong></div><div><span>FP</span><strong>{asNumber(item.fp).toLocaleString("en-IN")}</strong></div><div><span>FN</span><strong>{asNumber(item.fn).toLocaleString("en-IN")}</strong></div></div></article>)}</div>
      {!allCanonicalLabelsPresent && <p className="matrix-note">The API did not provide all three canonical sentiment labels. The matrix and one-vs-rest metrics are shown in the backend's returned label order; class names are not guessed.</p>}
    </>}
  </section>;
}
function ModelPerformancePage({ performance, loading, error, onRetry }) {
  if (loading) return <section className="page-content"><h1>Model Performance</h1><div className="panel loading-panel"><LoaderCircle className="spin" size={26} /><p>Loading model evaluation metrics...</p></div></section>;
  if (error) return <section className="page-content"><h1>Model Performance</h1><ErrorMessage message={error} onRetry={onRetry} /><div className="panel"><p>Check whether Flask is running and whether the evaluation metrics file exists.</p></div></section>;
  if (!performance) return <section className="page-content"><h1>Model Performance</h1><div className="panel"><EmptyState message="Model evaluation metrics are not available yet." /><button type="button" className="primary-button" onClick={onRetry}><RefreshCw size={16} /> Load Metrics Again</button></div></section>;
  const classMetrics = getClassMetrics(performance);
  const macro = performance.macroAverage ?? {};
  const weighted = performance.weightedAverage ?? {};
  const precision = macro.precision ?? weighted.precision ?? null;
  const recall = macro.recall ?? weighted.recall ?? null;
  const f1 = macro["f1-score"] ?? macro.f1_score ?? weighted["f1-score"] ?? weighted.f1_score ?? null;
  return <section className="page-content"><div className="page-heading"><div><h1>Model Performance</h1><p>Evaluation results from the trained TF-IDF + Logistic Regression model.</p></div><button type="button" className="secondary-button" onClick={onRetry}><RefreshCw size={16} /> Refresh</button></div>
    <div className="metrics-grid"><MetricCard title="Accuracy" value={performance.accuracy == null ? "N/A" : formatPercent(performance.accuracy)} icon={Sparkles} description="Overall correct predictions" /><MetricCard title="Precision" value={precision == null ? "N/A" : formatPercent(precision)} icon={CheckCircle2} description="Macro-average precision" /><MetricCard title="Recall" value={recall == null ? "N/A" : formatPercent(recall)} icon={Activity} description="Macro-average recall" /><MetricCard title="F1-score" value={f1 == null ? "N/A" : formatPercent(f1)} icon={BrainCircuit} description="Macro-average F1-score" /></div>
    <div className="panel"><h2>Dataset Summary</h2><div className="metrics-grid"><MetricCard title="Training Records" value={performance.trainingRecords.toLocaleString("en-IN")} icon={Activity} /><MetricCard title="Labeled Test Records" value={performance.testRecords.toLocaleString("en-IN")} icon={CheckCircle2} /></div></div>
    <div className="panel"><h2>Class-wise Evaluation</h2><p>Compare precision, recall, F1-score, and support for each sentiment class.</p><div className="table-container"><table className="analysis-table"><thead><tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1-score</th><th>Support</th></tr></thead><tbody>{classMetrics.map((item) => <tr key={item.name}><td><SentimentBadge sentiment={item.name} /></td><td>{item.precision == null ? "N/A" : formatPercent(item.precision)}</td><td>{item.recall == null ? "N/A" : formatPercent(item.recall)}</td><td>{item.f1 == null ? "N/A" : formatPercent(item.f1)}</td><td>{item.support == null ? "N/A" : asNumber(item.support).toLocaleString("en-IN")}</td></tr>)}</tbody></table></div></div>
    <ConfusionMatrixPanel performance={performance} />
  </section>;
}

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [stats, setStats] = useState({ total: 0, positive: 0, negative: 0, neutral: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [trends, setTrends] = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState("");
  const [performance, setPerformance] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [speechSupported] = useState(() => typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));

  const fetchStats = useCallback(async () => {
    setStatsLoading(true); setStatsError("");
    try { const response = await API.get("/api/stats"); setStats(normalizeStats(response.data)); }
    catch (error) { setStatsError(error?.response?.data?.message ?? "Could not load statistics. Check whether Flask is running."); }
    finally { setStatsLoading(false); }
  }, []);
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true); setHistoryError("");
    try {
      const payload = (await API.get("/api/history")).data;
      const records = Array.isArray(payload) ? payload : payload?.results ?? payload?.history ?? payload?.records ?? payload?.data ?? [];
      setHistory(Array.isArray(records) ? records : []);
    } catch (error) { setHistoryError(error?.response?.data?.message ?? "Could not load analysis history."); }
    finally { setHistoryLoading(false); }
  }, []);
  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true); setTrendsError("");
    try {
      const payload = (await API.get("/api/trends")).data;
      const records = Array.isArray(payload) ? payload : payload?.trends ?? payload?.data ?? payload?.results ?? [];
      setTrends(Array.isArray(records) ? records : []);
    } catch (error) { setTrendsError(error?.response?.data?.message ?? "Could not load trend data."); }
    finally { setTrendsLoading(false); }
  }, []);
  const fetchPerformance = useCallback(async () => {
    setPerformanceLoading(true); setPerformanceError("");
    try {
      const parsed = extractPerformanceResponse((await API.get("/api/model-performance")).data);
      if (!parsed) { setPerformance(null); setPerformanceError("The model-performance API returned no usable evaluation metrics. Check the JSON response and evaluation_metrics.json."); return; }
      setPerformance(parsed);
    } catch (error) { setPerformance(null); setPerformanceError(error?.response?.data?.message ?? "Could not load model performance. Check that Flask is running and /api/model-performance is available."); }
    finally { setPerformanceLoading(false); }
  }, []);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    if (["Dashboard", "Analysis History", "Analytics"].includes(activePage)) { fetchHistory(); fetchStats(); }
    if (activePage === "Analytics") fetchTrends();
    if (activePage === "Model Performance") fetchPerformance();
  }, [activePage, fetchHistory, fetchStats, fetchTrends, fetchPerformance]);

  const startListening = () => {
    setVoiceError("");
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setVoiceError("ఈ browser లో voice input అందుబాటులో లేదు. తాజా Google Chrome ఉపయోగించండి."); return; }
    try {
      const recognition = new Recognition();
      recognition.lang = language; recognition.continuous = false; recognition.interimResults = false; recognition.maxAlternatives = 1;
      recognition.onstart = () => setListening(true);
      recognition.onresult = (event) => { const transcript = event.results?.[0]?.[0]?.transcript ?? ""; if (transcript.trim()) setText((previous) => previous.trim() ? `${previous.trim()} ${transcript.trim()}` : transcript.trim()); };
      recognition.onerror = (event) => {
        const messages = { "not-allowed": "Microphone permission నిరాకరించబడింది. Browser settings లో microphone permission అనుమతించండి.", "no-speech": "మీ మాటలు గుర్తించబడలేదు. మళ్లీ ప్రయత్నించండి.", "audio-capture": "Microphone కనబడలేదు. Microphone connection తనిఖీ చేయండి.", network: "Voice recognition కోసం network సమస్య ఏర్పడింది.", "service-not-allowed": "ఈ browser లో speech recognition service అనుమతించబడలేదు." };
        setVoiceError(messages[event.error] ?? `Voice recognition error: ${event.error}`);
      };
      recognition.onend = () => setListening(false);
      recognition.start();
    } catch (error) { setListening(false); setVoiceError(error?.message ?? "Voice input ప్రారంభించలేకపోయాం."); }
  };
  const analyzeSentiment = async (event) => {
    event.preventDefault(); const cleanText = text.trim();
    if (!cleanText) { setAnalyzeError("దయచేసి ముందుగా కొంత text నమోదు చేయండి."); return; }
    setAnalyzeLoading(true); setAnalyzeError(""); setResult(null);
    try {
      const response = await API.post("/api/sentiment", { text: cleanText });
      const payload = response.data?.result ?? response.data;
      if (!payload || typeof payload !== "object" || !(payload.sentiment || payload.prediction || payload.label)) throw new Error("Backend response లో sentiment prediction లేదు.");
      setResult({ ...payload, text: payload.text ?? cleanText, sentiment: payload.sentiment ?? payload.prediction ?? payload.label });
      await Promise.all([fetchStats(), fetchHistory(), fetchTrends()]);
    } catch (error) { setAnalyzeError(error?.response?.data?.message ?? error?.message ?? "Sentiment analysis విఫలమైంది. Backend తనిఖీ చేయండి."); }
    finally { setAnalyzeLoading(false); }
  };
  const downloadPDFReport = async () => {
    setPdfLoading(true); setPdfError("");
    try {
      const response = await API.get("/api/report/pdf", { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" }); const url = window.URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = "sentiment-analysis-report.pdf"; document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
    } catch (error) { setPdfError(error?.response?.data?.message ?? "PDF report download విఫలమైంది."); }
    finally { setPdfLoading(false); }
  };
  const filteredHistory = useMemo(() => history.filter((record) => getRecordText(record).toLowerCase().includes(historySearch.toLowerCase()) && (sentimentFilter === "all" || getRecordSentiment(record) === sentimentFilter)), [history, historySearch, sentimentFilter]);
  const exportHistoryCSV = () => {
    const headers = ["Text", "Sentiment", "Date"];
    const rows = filteredHistory.map((record) => [getRecordText(record), getRecordSentiment(record), formatDate(record.created_at ?? record.timestamp ?? record.date)]);
    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(escapeCSV).join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = "sentiment-analysis-history.csv"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const renderDashboard = () => <section className="page-content"><div className="page-heading"><div><h1>AI Smart Analysis Dashboard</h1><p>Sentiment analysis results and activity overview.</p></div><button type="button" className="secondary-button" onClick={() => { fetchStats(); fetchHistory(); }}><RefreshCw size={16} /> Refresh</button></div><ErrorMessage message={statsError} onRetry={fetchStats} /><div className="metrics-grid"><MetricCard title="Total Analyses" value={statsLoading ? "..." : stats.total} icon={Activity} description="All recorded analyses" /><MetricCard title="Positive" value={stats.positive} icon={ThumbsUp} description="Positive sentiment records" /><MetricCard title="Negative" value={stats.negative} icon={ThumbsDown} description="Negative sentiment records" /><MetricCard title="Neutral" value={stats.neutral} icon={MessageSquareText} description="Neutral sentiment records" /></div><div className="dashboard-grid"><div className="panel"><h2>Sentiment Distribution</h2><SentimentPieChart stats={stats} /></div><div className="panel"><h2>Sentiment Counts</h2><SentimentBarChart stats={stats} /></div></div><div className="panel"><h2>Quick Actions</h2><div className="quick-actions"><button type="button" className="primary-button" onClick={() => setActivePage("Sentiment Analysis")}><Sparkles size={17} /> Analyze Text</button><button type="button" className="secondary-button" onClick={() => setActivePage("Model Performance")}><BrainCircuit size={17} /> Model Performance</button><button type="button" className="secondary-button" onClick={() => setActivePage("Analysis History")}><Clock3 size={17} /> View History</button></div></div><div className="panel"><h2>Recent Analysis History</h2>{historyLoading ? <p>Loading history...</p> : historyError ? <ErrorMessage message={historyError} onRetry={fetchHistory} /> : <AnalysisTable records={history.slice(0, 5)} />}</div></section>;
  const renderSentimentAnalysis = () => <section className="page-content"><div className="page-heading"><div><h1>Sentiment Analysis</h1><p>Enter text or use your microphone to analyze sentiment.</p></div></div><div className="panel"><form onSubmit={analyzeSentiment}><label htmlFor="sentiment-text">Enter text for analysis</label><textarea id="sentiment-text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Type a review, comment, or sentence here..." rows={6} /><div className="voice-controls"><label htmlFor="voice-language">Voice input language</label><select id="voice-language" value={language} onChange={(event) => setLanguage(event.target.value)} disabled={listening}>{LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{!listening ? <button type="button" className="secondary-button" onClick={startListening} disabled={!speechSupported}><Mic size={17} /> Start Voice Input</button> : <button type="button" className="secondary-button" onClick={() => { setVoiceError(""); setListening(false); }}><MicOff size={17} /> Stop</button>}</div>{listening && <p className="status-message">Listening... Speak clearly into your microphone.</p>}{voiceError && <ErrorMessage message={voiceError} />}{!speechSupported && <p>Voice input is not supported in this browser. Try the latest Google Chrome.</p>}<div className="example-buttons"><span>Try an example:</span><button type="button" className="text-button" onClick={() => setText("I absolutely love this product. It works perfectly!")}>Positive</button><button type="button" className="text-button" onClick={() => setText("This is the worst experience I have ever had.")}>Negative</button><button type="button" className="text-button" onClick={() => setText("The product arrived today and looks as described.")}>Neutral</button></div><button type="submit" className="primary-button" disabled={analyzeLoading}>{analyzeLoading ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}{analyzeLoading ? "Analyzing..." : "Analyze Sentiment"}</button></form><ErrorMessage message={analyzeError} /></div>{result && <div className="panel result-panel"><h2>Analysis Result</h2><div className="result-heading"><div><p>Predicted Sentiment</p><SentimentBadge sentiment={result.sentiment} /></div></div><h3>Analyzed Text</h3><p className="analyzed-text">{getRecordText(result) || text}</p><h3>Model Scores</h3><div className="metrics-grid">{[["Positive", result.positive_score ?? result.scores?.positive], ["Negative", result.negative_score ?? result.scores?.negative], ["Neutral", result.neutral_score ?? result.scores?.neutral]].map(([label, value]) => <MetricCard key={label} title={label} value={value == null ? "N/A" : formatPercent(value)} icon={label === "Positive" ? ThumbsUp : label === "Negative" ? ThumbsDown : MessageSquareText} />)}</div><p>Scores are displayed only when provided by the backend. TF-IDF + Logistic Regression does not automatically provide VADER compound scores.</p></div>}</section>;
  const renderAnalytics = () => <section className="page-content"><div className="page-heading"><div><h1>Analytics</h1><p>Review sentiment distribution and analysis trends.</p></div><button type="button" className="secondary-button" onClick={() => { fetchStats(); fetchTrends(); fetchHistory(); }}><RefreshCw size={16} /> Refresh Analytics</button></div><div className="metrics-grid"><MetricCard title="Total Analyses" value={stats.total} icon={Activity} /><MetricCard title="Positive" value={stats.positive} icon={ThumbsUp} /><MetricCard title="Negative" value={stats.negative} icon={ThumbsDown} /><MetricCard title="Neutral" value={stats.neutral} icon={MessageSquareText} /></div><div className="dashboard-grid"><div className="panel"><h2>Sentiment Distribution</h2><SentimentPieChart stats={stats} /></div><div className="panel"><h2>Sentiment Comparison</h2><SentimentBarChart stats={stats} /></div></div><div className="panel"><h2>Sentiment Trends</h2>{trendsLoading ? <p>Loading trends...</p> : <><ErrorMessage message={trendsError} onRetry={fetchTrends} /><SentimentTrendChart trends={trends} /></>}</div><div className="panel"><h2>Report</h2><ErrorMessage message={pdfError} /><button type="button" className="primary-button" onClick={downloadPDFReport} disabled={pdfLoading}>{pdfLoading ? <LoaderCircle className="spin" size={17} /> : <Download size={17} />}{pdfLoading ? "Preparing PDF..." : "Download PDF Report"}</button></div></section>;
  const renderHistory = () => <section className="page-content"><div className="page-heading"><div><h1>Analysis History</h1><p>Search and filter your saved sentiment analyses.</p></div><button type="button" className="secondary-button" onClick={fetchHistory}><RefreshCw size={16} /> Refresh</button></div><div className="panel"><div className="history-controls"><div className="search-box"><Search size={17} /><input type="search" placeholder="Search analyzed text..." value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} />{historySearch && <button type="button" className="icon-button" onClick={() => setHistorySearch("")} aria-label="Clear search"><X size={16} /></button>}</div><select value={sentimentFilter} onChange={(event) => setSentimentFilter(event.target.value)} aria-label="Filter by sentiment"><option value="all">All Sentiments</option><option value="positive">Positive</option><option value="negative">Negative</option><option value="neutral">Neutral</option></select><button type="button" className="secondary-button" onClick={exportHistoryCSV}><Download size={16} /> Export CSV</button></div><ErrorMessage message={historyError} onRetry={fetchHistory} />{historyLoading ? <p>Loading analysis history...</p> : <AnalysisTable records={filteredHistory} />}</div></section>;
  const renderSettings = () => <section className="page-content"><div className="page-heading"><div><h1>Settings</h1><p>Application configuration and system information.</p></div></div><div className="panel"><h2>Application Information</h2><div className="settings-list"><div><strong>Application</strong><span>AI Smart Analysis Dashboard</span></div><div><strong>Frontend</strong><span>React + Vite</span></div><div><strong>Backend</strong><span>Python + Flask REST API</span></div><div><strong>Database</strong><span>MongoDB</span></div><div><strong>Machine Learning Model</strong><span>TF-IDF + Logistic Regression</span></div><div><strong>Voice Input</strong><span>Web Speech API</span></div><div><strong>Model Metrics</strong><span>{performance ? "Loaded" : "Not loaded yet — open Model Performance"}</span></div></div></div><div className="panel"><h2>System Checks</h2><div className="quick-actions"><button type="button" className="secondary-button" onClick={fetchStats}><RefreshCw size={16} /> Refresh Statistics</button><button type="button" className="secondary-button" onClick={fetchPerformance}><BrainCircuit size={16} /> Load Model Metrics</button></div></div></section>;
  const renderActivePage = () => {
    switch (activePage) {
      case "Dashboard": return renderDashboard();
      case "Sentiment Analysis": return renderSentimentAnalysis();
      case "Analytics": return renderAnalytics();
      case "Model Performance": return <ModelPerformancePage performance={performance} loading={performanceLoading} error={performanceError} onRetry={fetchPerformance} />;
      case "Analysis History": return renderHistory();
      case "Settings": return renderSettings();
      default: return renderDashboard();
    }
  };
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-icon"><BrainCircuit size={26} /></div><div><h2>AI Smart</h2><span>Analysis Dashboard</span></div></div><nav className="sidebar-nav">{NAVIGATION.map(({ name, icon: Icon }) => <button type="button" key={name} className={activePage === name ? "nav-item active" : "nav-item"} onClick={() => setActivePage(name)}><Icon size={19} /><span>{name}</span></button>)}</nav><div className="sidebar-footer"><Activity size={16} /><span>AI Analysis System</span></div></aside><main className="main-area"><header className="topbar"><div><span className="topbar-label">Workspace</span><h2>{activePage}</h2></div><div className="topbar-status"><span className="status-dot" /><span>Dashboard</span></div></header>{renderActivePage()}<footer className="app-footer"><span>AI Smart Analysis Dashboard</span><span>React · Flask · MongoDB · Machine Learning</span></footer></main></div>;
}
