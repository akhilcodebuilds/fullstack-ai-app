import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  LoaderCircle,
  MessageSquareText,
  Settings,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Zap,
  RefreshCw,
  TrendingUp,
  PieChart as PieChartIcon,
  Download,
  Search,
  X,
  Target,
  Scale,
  Lightbulb,
  Database,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import API from "./api";
import "./App.css";

/* -------------------------------------------------------
   CONFIGURATION
------------------------------------------------------- */

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Sentiment Analysis", icon: MessageSquareText },
  { name: "Analytics", icon: BarChart3 },
  { name: "Analysis History", icon: Clock3 },
  { name: "Settings", icon: Settings },
];

const sentimentConfig = {
  Positive: {
    color: "#16a36a",
    background: "#e7f8ef",
    icon: ThumbsUp,
  },
  Negative: {
    color: "#dc4545",
    background: "#fff0f0",
    icon: ThumbsDown,
  },
  Neutral: {
    color: "#64748b",
    background: "#f1f5f9",
    icon: MessageSquareText,
  },
};

const chartColors = {
  Positive: "#16a36a",
  Negative: "#dc4545",
  Neutral: "#64748b",
};

const cardColors = {
  purple: "#7c3aed",
  green: "#16a36a",
  red: "#dc4545",
  blue: "#2563eb",
};

const initialStats = {
  total: 0,
  positive: 0,
  negative: 0,
  neutral: 0,
};

/* -------------------------------------------------------
   HELPER FUNCTIONS
------------------------------------------------------- */

function formatDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return String(dateString);
  }

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatTrendDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return String(dateString);
  }

  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
  });
}

function getPercentage(value, total) {
  if (!total || total <= 0) return "0.0%";

  return `${((value / total) * 100).toFixed(1)}%`;
}

function getDominantSentiment(stats) {
  if (!stats.total) return "No data";

  const values = [
    ["Positive", stats.positive],
    ["Negative", stats.negative],
    ["Neutral", stats.neutral],
  ];

  const maximum = Math.max(...values.map((item) => item[1]));

  const leaders = values.filter((item) => item[1] === maximum);

  if (leaders.length > 1) return "Tie";

  return leaders[0][0];
}

function greatestCommonDivisor(a, b) {
  if (!b) return Math.abs(a);

  return greatestCommonDivisor(b, a % b);
}

function getPositiveNegativeRatio(positive, negative) {
  if (positive === 0 && negative === 0) return "N/A";

  if (negative === 0) return `${positive}:0`;

  if (positive === 0) return `0:${negative}`;

  const divisor = greatestCommonDivisor(positive, negative);

  return `${positive / divisor}:${negative / divisor}`;
}

function getSentiment(record) {
  return (
    record?.sentiment ||
    record?.prediction ||
    record?.label ||
    "Neutral"
  );
}

function getRecordText(record) {
  return (
    record?.text ||
    record?.input_text ||
    record?.review ||
    record?.message ||
    ""
  );
}

function getCompoundScore(record) {
  const value =
    record?.compound ??
    record?.compound_score ??
    record?.scores?.compound ??
    record?.sentiment_scores?.compound;

  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function getRecordDate(record) {
  return (
    record?.created_at ||
    record?.timestamp ||
    record?.date ||
    record?.createdAt ||
    null
  );
}

/* -------------------------------------------------------
   SENTIMENT PIE CHART
------------------------------------------------------- */

function SentimentPieChart({ data, height = 280 }) {
  const chartData = data.filter((item) => item.value > 0);

  if (!chartData.length) {
    return (
      <div className="chart-empty" style={{ height }}>
        <PieChartIcon size={36} />
        <p>No sentiment data available yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={4}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={chartColors[entry.name] || "#64748b"}
            />
          ))}
        </Pie>

        <Tooltip />

        <Legend verticalAlign="bottom" />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* -------------------------------------------------------
   SENTIMENT BAR CHART
------------------------------------------------------- */

function SentimentBarChart({ data, height = 280 }) {
  const hasData = data.some((item) => item.value > 0);

  if (!hasData) {
    return (
      <div className="chart-empty" style={{ height }}>
        <BarChart3 size={36} />
        <p>No comparison data available yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />

        <XAxis dataKey="name" />

        <YAxis allowDecimals={false} />

        <Tooltip />

        <Bar
          dataKey="value"
          name="Analyses"
          radius={[7, 7, 0, 0]}
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={chartColors[entry.name] || "#64748b"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* -------------------------------------------------------
   SENTIMENT TREND CHART
------------------------------------------------------- */

function SentimentTrendChart({ data, height = 320 }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty" style={{ height }}>
        <TrendingUp size={36} />
        <p>No trend data available yet.</p>
        <span>Analyze some text to generate trend information.</span>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    date: formatTrendDate(
      item.date || item.day || item._id || item.created_at
    ),
    positive: Number(item.positive || 0),
    negative: Number(item.negative || 0),
    neutral: Number(item.neutral || 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />

        <XAxis dataKey="date" />

        <YAxis allowDecimals={false} />

        <Tooltip />

        <Legend />

        <Line
          type="monotone"
          dataKey="positive"
          name="Positive"
          stroke={chartColors.Positive}
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />

        <Line
          type="monotone"
          dataKey="negative"
          name="Negative"
          stroke={chartColors.Negative}
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />

        <Line
          type="monotone"
          dataKey="neutral"
          name="Neutral"
          stroke={chartColors.Neutral}
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* -------------------------------------------------------
   METRIC CARD
------------------------------------------------------- */

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "purple",
  loading = false,
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${color}`}>
        {Icon && <Icon size={22} />}
      </div>

      <div className="metric-content">
        <p className="metric-title">{title}</p>

        <h2 className="metric-value">
          {loading ? (
            <LoaderCircle className="spin" size={22} />
          ) : (
            value
          )}
        </h2>

        {subtitle && <p className="metric-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   SENTIMENT BADGE
------------------------------------------------------- */

function SentimentBadge({ sentiment }) {
  const normalized = String(sentiment || "Neutral");

  const config = sentimentConfig[normalized] || sentimentConfig.Neutral;

  const Icon = config.icon;

  return (
    <span
      className="sentiment-badge"
      style={{
        color: config.color,
        backgroundColor: config.background,
      }}
    >
      <Icon size={14} />

      {normalized}
    </span>
  );
}

/* -------------------------------------------------------
   ANALYSIS TABLE
------------------------------------------------------- */

function AnalysisTable({ records, compact = false }) {
  const displayedRecords = compact ? records.slice(0, 5) : records;

  if (!displayedRecords.length) {
    return (
      <div className="empty-state">
        <Database size={36} />

        <h3>No analysis records</h3>

        <p>Your analyzed text will appear here.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Text</th>
            <th>Sentiment</th>
            <th>Compound Score</th>
            <th>Date & Time</th>
          </tr>
        </thead>

        <tbody>
          {displayedRecords.map((record, index) => {
            const sentiment = getSentiment(record);

            const text = getRecordText(record);

            const compound = getCompoundScore(record);

            const date = getRecordDate(record);

            return (
              <tr
                key={
                  record._id ||
                  record.id ||
                  `${date || "record"}-${index}`
                }
              >
                <td className="table-text-cell">
                  <span title={text}>
                    {text.length > 100
                      ? `${text.slice(0, 100)}...`
                      : text || "No text available"}
                  </span>
                </td>

                <td>
                  <SentimentBadge sentiment={sentiment} />
                </td>

                <td>
                  {compound === null ? "N/A" : compound.toFixed(3)}
                </td>

                <td>{formatDate(date)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------
   MAIN APPLICATION
------------------------------------------------------- */

export default function App() {
  const [text, setText] = useState("");

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");

  const [stats, setStats] = useState(initialStats);

  const [statsLoading, setStatsLoading] = useState(true);

  const [statsError, setStatsError] = useState("");

  const [history, setHistory] = useState([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  const [historyError, setHistoryError] = useState("");

  const [trends, setTrends] = useState([]);

  const [trendsLoading, setTrendsLoading] = useState(false);

  const [trendsError, setTrendsError] = useState("");

  const [historySearch, setHistorySearch] = useState("");

  const [sentimentFilter, setSentimentFilter] = useState("All");

  // PDF report download state
  const [pdfLoading, setPdfLoading] = useState(false);

  const [pdfError, setPdfError] = useState("");

  /* -----------------------------------------------------
     FETCH STATISTICS
  ----------------------------------------------------- */

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError("");

    try {
      const response = await API.get("/api/stats");

      const data = response.data || {};

      setStats({
        total: Number(data.total ?? data.total_analyses ?? 0),
        positive: Number(data.positive ?? 0),
        negative: Number(data.negative ?? 0),
        neutral: Number(data.neutral ?? 0),
      });
    } catch (err) {
      console.error("Statistics fetch error:", err);

      setStatsError(
        "Unable to load statistics. Please check whether the backend is running."
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* -----------------------------------------------------
   FETCH HISTORY
----------------------------------------------------- */

const fetchHistory = useCallback(async () => {
  setHistoryLoading(true);
  setHistoryError("");

  try {
    const response = await API.get("/api/history");

    const data = response.data || {};

    // Support the response format returned by Flask
    const records = Array.isArray(data)
      ? data
      : data.results ||
        data.history ||
        data.records ||
        [];

    setHistory(records);

    console.log("History API response:", data);
    console.log("History records loaded:", records.length);
  } catch (err) {
    console.error("History fetch error:", err);

    setHistoryError(
      "Unable to load analysis history. Please check the backend."
    );
  } finally {
    setHistoryLoading(false);
  }
}, []);

  /* -----------------------------------------------------
     FETCH TRENDS
  ----------------------------------------------------- */

  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    setTrendsError("");

    try {
      const response = await API.get("/api/trends");

      const data = response.data || {};

      const trendRecords = Array.isArray(data)
        ? data
        : data.trends || [];

      setTrends(trendRecords);
    } catch (err) {
      console.error("Trend fetch error:", err);

      setTrendsError(
        "Unable to load trend data. Please check the backend."
      );
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  /* -----------------------------------------------------
     INITIAL LOAD
  ----------------------------------------------------- */

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (
      activePage === "Analysis History" ||
      activePage === "Analytics" ||
      activePage === "Dashboard"
    ) {
      fetchHistory();
      fetchStats();
    }

    if (activePage === "Analytics") {
      fetchTrends();
    }
  }, [
    activePage,
    fetchHistory,
    fetchStats,
    fetchTrends,
  ]);

  /* -----------------------------------------------------
     COMPUTED VALUES
  ----------------------------------------------------- */

  const total = stats.total;

  const positivePercentage = getPercentage(stats.positive, total);

  const negativePercentage = getPercentage(stats.negative, total);

  const neutralPercentage = getPercentage(stats.neutral, total);

  const dominantSentiment = getDominantSentiment(stats);

  const positiveNegativeRatio = getPositiveNegativeRatio(
    stats.positive,
    stats.negative
  );

  const sentimentPercentages = [
    {
      name: "Positive",
      count: stats.positive,
      percentage: positivePercentage,
      color: chartColors.Positive,
    },
    {
      name: "Negative",
      count: stats.negative,
      percentage: negativePercentage,
      color: chartColors.Negative,
    },
    {
      name: "Neutral",
      count: stats.neutral,
      percentage: neutralPercentage,
      color: chartColors.Neutral,
    },
  ];

  const pieData = [
    { name: "Positive", value: stats.positive },
    { name: "Negative", value: stats.negative },
    { name: "Neutral", value: stats.neutral },
  ];

  const barData = [
    { name: "Positive", value: stats.positive },
    { name: "Negative", value: stats.negative },
    { name: "Neutral", value: stats.neutral },
  ];

  /* -----------------------------------------------------
     AI INSIGHTS
  ----------------------------------------------------- */

  const insights = useMemo(() => {
    if (!stats.total) {
      return [
        {
          title: "Getting Started",
          description:
            "Analyze your first text to generate sentiment insights and statistics.",
          icon: Lightbulb,
          color: "purple",
        },
      ];
    }

    const items = [];

    const dominant = getDominantSentiment(stats);

    if (dominant === "Tie") {
      items.push({
        title: "Balanced Sentiment",
        description:
          "Multiple sentiment categories share the highest count in your analysis history.",
        icon: Scale,
        color: "purple",
      });
    } else {
      items.push({
        title: `${dominant} Sentiment Leads`,
        description: `${dominant} sentiment is currently the most common category in your analysis history.`,
        icon:
          dominant === "Positive"
            ? ThumbsUp
            : dominant === "Negative"
              ? ThumbsDown
              : MessageSquareText,
        color:
          dominant === "Positive"
            ? "green"
            : dominant === "Negative"
              ? "red"
              : "blue",
      });
    }

    if (stats.positive > stats.negative) {
      items.push({
        title: "Positive Sentiment Ahead",
        description:
          "Positive analyses outnumber negative analyses. Continue monitoring new text to see whether this pattern persists.",
        icon: TrendingUp,
        color: "green",
      });
    } else if (stats.negative > stats.positive) {
      items.push({
        title: "Negative Sentiment Ahead",
        description:
          "Negative analyses outnumber positive analyses. Review the text behind these results to understand possible causes.",
        icon: TrendingUp,
        color: "red",
      });
    } else {
      items.push({
        title: "Positive and Negative Are Equal",
        description:
          "Positive and negative analyses currently have equal counts.",
        icon: Scale,
        color: "blue",
      });
    }

    const positiveShare = stats.positive / stats.total;

    const negativeShare = stats.negative / stats.total;

    if (positiveShare >= 0.6) {
      items.push({
        title: "Strong Positive Share",
        description:
          "At least 60% of recorded analyses are positive. This describes your current dataset, not necessarily the wider population.",
        icon: Target,
        color: "green",
      });
    } else if (negativeShare >= 0.6) {
      items.push({
        title: "Strong Negative Share",
        description:
          "At least 60% of recorded analyses are negative. Review the underlying text before drawing conclusions.",
        icon: Target,
        color: "red",
      });
    } else {
      items.push({
        title: "Sentiment Distribution",
        description:
          "Your records contain a mix of sentiment categories. Compare the category counts and trends for additional context.",
        icon: BarChart3,
        color: "purple",
      });
    }

    return items;
  }, [stats]);

  /* -----------------------------------------------------
     FILTER HISTORY
  ----------------------------------------------------- */

  const filteredHistory = useMemo(() => {
    return history.filter((record) => {
      const recordText = getRecordText(record).toLowerCase();

      const searchMatches = recordText.includes(
        historySearch.trim().toLowerCase()
      );

      const recordSentiment = getSentiment(record);

      const sentimentMatches =
        sentimentFilter === "All" ||
        recordSentiment.toLowerCase() ===
          sentimentFilter.toLowerCase();

      return searchMatches && sentimentMatches;
    });
  }, [history, historySearch, sentimentFilter]);

  /* -----------------------------------------------------
     EXPORT CSV
  ----------------------------------------------------- */

  const exportHistoryCSV = () => {
    if (!filteredHistory.length) {
      setHistoryError("There are no matching records to export.");
      return;
    }

    setHistoryError("");

    const headers = [
      "Text",
      "Sentiment",
      "Compound Score",
      "Date and Time",
    ];

    const escapeCSV = (value) => {
      const stringValue = String(value ?? "");

      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const rows = filteredHistory.map((record) => [
      getRecordText(record),
      getSentiment(record),
      getCompoundScore(record) ?? "",
      formatDate(getRecordDate(record)),
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "sentiment_analysis_history.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  };

  /* -----------------------------------------------------
     DOWNLOAD PDF REPORT
  ----------------------------------------------------- */

  const downloadPDFReport = async () => {
    setPdfLoading(true);
    setPdfError("");

    try {
      const response = await API.get("/api/report/pdf", {
        responseType: "blob",
      });

      const pdfBlob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");

      link.href = downloadUrl;

      link.download = "sentiment_analysis_report.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);
    } catch (err) {
      console.error("PDF download error:", err);

      setPdfError(
        "Unable to download PDF report. Please check the Flask backend and PDF report endpoint."
      );
    } finally {
      setPdfLoading(false);
    }
  };

  /* -----------------------------------------------------
     RESET HISTORY FILTERS
  ----------------------------------------------------- */

  const resetHistoryFilters = () => {
    setHistorySearch("");
    setSentimentFilter("All");
    setHistoryError("");
  };

  /* -----------------------------------------------------
     ANALYZE SENTIMENT
  ----------------------------------------------------- */

  const analyzeSentiment = async (event) => {
    if (event) event.preventDefault();

    const cleanText = text.trim();

    if (!cleanText) {
      setError("Please enter some text before analyzing.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await API.post("/api/sentiment", {
        text: cleanText,
      });

      const responseData = response.data || {};

      setResult(responseData);

      await Promise.all([
        fetchStats(),
        fetchHistory(),
        ...(activePage === "Analytics" ? [fetchTrends()] : []),
      ]);
    } catch (err) {
      console.error("Sentiment analysis error:", err);

      const serverMessage =
        err.response?.data?.error ||
        err.response?.data?.message;

      setError(
        serverMessage ||
          "Unable to analyze the text. Please make sure the Flask backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------------
     RENDER STATISTICS CARDS
  ----------------------------------------------------- */

  const renderStatsCards = () => (
    <div className="metrics-grid">
      <MetricCard
        title="Total Analyses"
        value={stats.total}
        subtitle="All recorded analyses"
        icon={Activity}
        color="purple"
        loading={statsLoading}
      />

      <MetricCard
        title="Positive"
        value={stats.positive}
        subtitle={positivePercentage + " of total"}
        icon={ThumbsUp}
        color="green"
        loading={statsLoading}
      />

      <MetricCard
        title="Negative"
        value={stats.negative}
        subtitle={negativePercentage + " of total"}
        icon={ThumbsDown}
        color="red"
        loading={statsLoading}
      />

      <MetricCard
        title="Neutral"
        value={stats.neutral}
        subtitle={neutralPercentage + " of total"}
        icon={MessageSquareText}
        color="blue"
        loading={statsLoading}
      />
    </div>
  );

  /* -----------------------------------------------------
     RENDER SENTIMENT ANALYSIS
  ----------------------------------------------------- */

  const renderAnalysis = () => {
    const responseSentiment = result
      ? getSentiment(result)
      : null;

    const responseCompound = result
      ? getCompoundScore(result)
      : null;

    const responseScores =
      result?.scores ||
      result?.sentiment_scores ||
      result?.details ||
      {};

    const positiveScore =
      responseScores.positive ??
      responseScores.pos ??
      result?.positive ??
      0;

    const negativeScore =
      responseScores.negative ??
      responseScores.neg ??
      result?.negative ??
      0;

    const neutralScore =
      responseScores.neutral ??
      responseScores.neu ??
      result?.neutral ??
      0;

    return (
      <div className="page-content">
        <div className="page-heading">
          <div>
            <h1>Sentiment Analysis</h1>

            <p>
              Analyze text and understand its emotional tone using
              VADER sentiment analysis.
            </p>
          </div>
        </div>

        <div className="analysis-layout">
          <section className="panel analysis-panel">
            <div className="panel-heading">
              <div className="panel-heading-icon">
                <BrainCircuit size={22} />
              </div>

              <div>
                <h2>Analyze Your Text</h2>

                <p>Enter text below to analyze its sentiment.</p>
              </div>
            </div>

            <form onSubmit={analyzeSentiment}>
              <label htmlFor="analysis-text">
                Text to Analyze
              </label>

              <textarea
                id="analysis-text"
                value={text}
                onChange={(event) => {
                  setText(event.target.value);

                  if (error) setError("");
                }}
                placeholder="Enter a review, comment, feedback, or any text..."
                maxLength={5000}
                rows={8}
              />

              <div className="textarea-footer">
                <span>Maximum 5,000 characters</span>

                <span>{text.length}/5000</span>
              </div>

              {error && (
                <div className="error-message">
                  <X size={16} />

                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="primary-button analyze-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle className="spin" size={18} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Analyze Sentiment
                  </>
                )}
              </button>
            </form>

            <div className="example-section">
              <h3>Try an example</h3>

              <div className="example-buttons">
                <button
                  type="button"
                  onClick={() =>
                    setText(
                      "I absolutely love this product! It works perfectly and made my day."
                    )
                  }
                >
                  Positive Example
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setText(
                      "This was a terrible experience. The product is disappointing and I am very unhappy."
                    )
                  }
                >
                  Negative Example
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setText(
                      "The product arrived today. It has the features described in the listing."
                    )
                  }
                >
                  Neutral Example
                </button>
              </div>
            </div>
          </section>

          <section className="panel result-panel">
            <div className="panel-heading">
              <div className="panel-heading-icon">
                <Zap size={22} />
              </div>

              <div>
                <h2>Analysis Result</h2>

                <p>Your latest sentiment prediction.</p>
              </div>
            </div>

            {!result ? (
              <div className="result-empty">
                <div className="result-empty-icon">
                  <BrainCircuit size={44} />
                </div>

                <h3>Ready to Analyze</h3>

                <p>
                  Submit some text to see its sentiment and score
                  breakdown.
                </p>
              </div>
            ) : (
              <div className="result-content">
                <div className="result-sentiment">
                  <span className="result-label">
                    Predicted Sentiment
                  </span>

                  <SentimentBadge sentiment={responseSentiment} />
                </div>

                <div className="compound-score-card">
                  <span>Compound Score</span>

                  <strong>
                    {responseCompound === null
                      ? "N/A"
                      : responseCompound.toFixed(3)}
                  </strong>

                  <p>
                    Compound scores generally range from -1
                    (negative) to +1 (positive).
                  </p>
                </div>

                <div className="score-breakdown">
                  <h3>Sentiment Score Breakdown</h3>

                  {[
                    {
                      label: "Positive",
                      value: Number(positiveScore),
                      color: chartColors.Positive,
                    },
                    {
                      label: "Negative",
                      value: Number(negativeScore),
                      color: chartColors.Negative,
                    },
                    {
                      label: "Neutral",
                      value: Number(neutralScore),
                      color: chartColors.Neutral,
                    },
                  ].map((item) => (
                    <div className="score-item" key={item.label}>
                      <div className="score-item-header">
                        <span>{item.label}</span>

                        <strong>
                          {Number.isFinite(item.value)
                            ? item.value.toFixed(3)
                            : "0.000"}
                        </strong>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, item.value * 100)
                            )}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="analyzed-text">
                  <h3>Analyzed Text</h3>

                  <p>{getRecordText(result) || text}</p>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="panel explanation-panel">
          <div className="panel-heading">
            <div className="panel-heading-icon">
              <Lightbulb size={22} />
            </div>

            <div>
              <h2>About VADER Sentiment Analysis</h2>

              <p>
                VADER is a lexicon and rule-based sentiment analysis
                tool designed for text.
              </p>
            </div>
          </div>

          <div className="explanation-grid">
            <div>
              <span className="explanation-dot positive-dot" />

              <div>
                <h3>Positive</h3>

                <p>
                  Text expressing satisfaction, happiness,
                  appreciation, or other favorable opinions.
                </p>
              </div>
            </div>

            <div>
              <span className="explanation-dot negative-dot" />

              <div>
                <h3>Negative</h3>

                <p>
                  Text expressing dissatisfaction, disappointment,
                  frustration, or unfavorable opinions.
                </p>
              </div>
            </div>

            <div>
              <span className="explanation-dot neutral-dot" />

              <div>
                <h3>Neutral</h3>

                <p>
                  Text with little clearly positive or negative
                  sentiment according to the model.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  /* -----------------------------------------------------
     RENDER CHARTS
  ----------------------------------------------------- */

  const renderCharts = (detailed = false) => (
    <div className={`charts-grid ${detailed ? "detailed" : ""}`}>
      <section className="panel chart-panel">
        <div className="panel-heading">
          <div className="panel-heading-icon">
            <PieChartIcon size={21} />
          </div>

          <div>
            <h2>Sentiment Distribution</h2>

            <p>Share of each sentiment category.</p>
          </div>
        </div>

        <SentimentPieChart
          data={pieData}
          height={detailed ? 340 : 260}
        />
      </section>

      <section className="panel chart-panel">
        <div className="panel-heading">
          <div className="panel-heading-icon">
            <BarChart3 size={21} />
          </div>

          <div>
            <h2>Sentiment Comparison</h2>

            <p>Number of analyses per category.</p>
          </div>
        </div>

        <SentimentBarChart
          data={barData}
          height={detailed ? 340 : 260}
        />
      </section>
    </div>
  );

  /* -----------------------------------------------------
     RENDER TREND SECTION
  ----------------------------------------------------- */

  const renderTrendSection = () => (
    <section className="panel trend-panel">
      <div className="section-heading-row">
        <div className="panel-heading">
          <div className="panel-heading-icon">
            <TrendingUp size={21} />
          </div>

          <div>
            <h2>Sentiment Trend Analysis</h2>

            <p>
              Explore how sentiment counts change over time.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={fetchTrends}
          disabled={trendsLoading}
        >
          {trendsLoading ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <RefreshCw size={16} />
          )}

          Refresh Trends
        </button>
      </div>

      {trendsError && (
        <div className="error-message">
          {trendsError}
        </div>
      )}

      {trendsLoading ? (
        <div className="loading-state">
          <LoaderCircle className="spin" size={26} />

          <p>Loading sentiment trends...</p>
        </div>
      ) : (
        <SentimentTrendChart data={trends} height={320} />
      )}
    </section>
  );

  /* -----------------------------------------------------
     RENDER ANALYTICS
  ----------------------------------------------------- */

  const renderAnalytics = () => (
    <div className="page-content">
      <div className="page-heading analytics-heading">
        <div>
          <h1>Advanced Sentiment Analytics</h1>

          <p>
            Understand your sentiment data through charts,
            statistics, trends, and automated insights.
          </p>
        </div>

        <div className="heading-actions">
          <button
            type="button"
            className="primary-button"
            onClick={downloadPDFReport}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Download size={17} />
            )}

            {pdfLoading ? "Generating PDF..." : "Download PDF Report"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              fetchStats();
              fetchHistory();
              fetchTrends();
            }}
          >
            <RefreshCw size={16} />
            Refresh Analytics
          </button>
        </div>
      </div>

      {pdfError && (
        <div className="error-message pdf-error">
          <X size={16} />

          <span>{pdfError}</span>

          <button
            type="button"
            className="icon-button"
            onClick={() => setPdfError("")}
            aria-label="Dismiss PDF error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {statsError && (
        <div className="error-message">{statsError}</div>
      )}

      {renderStatsCards()}

      <div className="analytics-summary-grid">
        <MetricCard
          title="Dominant Sentiment"
          value={dominantSentiment}
          subtitle="Most frequent category"
          icon={Target}
          color="purple"
          loading={statsLoading}
        />

        <MetricCard
          title="Positive / Negative Ratio"
          value={positiveNegativeRatio}
          subtitle="Simplified count ratio"
          icon={Scale}
          color="blue"
          loading={statsLoading}
        />

        <MetricCard
          title="Positive Percentage"
          value={positivePercentage}
          subtitle="Positive analyses out of total"
          icon={ThumbsUp}
          color="green"
          loading={statsLoading}
        />

        <MetricCard
          title="Negative Percentage"
          value={negativePercentage}
          subtitle="Negative analyses out of total"
          icon={ThumbsDown}
          color="red"
          loading={statsLoading}
        />
      </div>

      <section className="panel percentage-panel">
        <div className="panel-heading">
          <div className="panel-heading-icon">
            <Activity size={21} />
          </div>

          <div>
            <h2>Sentiment Percentages</h2>

            <p>Percentage distribution across all recorded analyses.</p>
          </div>
        </div>

        <div className="percentage-list">
          {sentimentPercentages.map((item) => (
            <div className="percentage-item" key={item.name}>
              <div className="percentage-header">
                <span>
                  <span
                    className="percentage-dot"
                    style={{ backgroundColor: item.color }}
                  />

                  {item.name}
                </span>

                <strong>{item.percentage}</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: item.percentage,
                    backgroundColor: item.color,
                  }}
                />
              </div>

              <span className="percentage-count">
                {item.count} analyses
              </span>
            </div>
          ))}
        </div>
      </section>

      {renderCharts(true)}

      {renderTrendSection()}

      <section className="panel insights-panel">
        <div className="panel-heading">
          <div className="panel-heading-icon">
            <Sparkles size={21} />
          </div>

          <div>
            <h2>Automated AI Insights</h2>

            <p>
              Rule-based observations generated from your current
              sentiment statistics.
            </p>
          </div>
        </div>

        <div className="insights-grid">
          {insights.map((insight, index) => {
            const InsightIcon = insight.icon;

            return (
              <article
                className={`insight-card ${insight.color}`}
                key={`${insight.title}-${index}`}
              >
                <div className={`insight-icon ${insight.color}`}>
                  <InsightIcon size={22} />
                </div>

                <h3>{insight.title}</h3>

                <p>{insight.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel summary-panel">
        <div className="panel-heading">
          <div className="panel-heading-icon">
            <BrainCircuit size={21} />
          </div>

          <div>
            <h2>Overall Summary</h2>

            <p>A quick overview of the current analysis dataset.</p>
          </div>
        </div>

        {!stats.total ? (
          <p>
            No analyses have been recorded yet. Analyze some text
            to populate the dashboard.
          </p>
        ) : (
          <div className="summary-text">
            <p>
              A total of <strong>{stats.total}</strong> analyses
              have been recorded.
            </p>

            <p>
              <strong>{stats.positive}</strong> were classified as
              positive, <strong>{stats.negative}</strong> as
              negative, and <strong>{stats.neutral}</strong> as
              neutral.
            </p>

            <p>
              The currently dominant category is{" "}
              <strong>{dominantSentiment}</strong>.
            </p>
          </div>
        )}
      </section>

      <section className="panel category-summary-panel">
        <div className="panel-heading">
          <div className="panel-heading-icon">
            <BarChart3 size={21} />
          </div>

          <div>
            <h2>Category Summary</h2>

            <p>Detailed count and percentage for each category.</p>
          </div>
        </div>

        <div className="category-summary-list">
          {sentimentPercentages.map((item) => (
            <div
              className="category-summary-item"
              key={item.name}
            >
              <div
                className="category-summary-indicator"
                style={{ backgroundColor: item.color }}
              />

              <div className="category-summary-info">
                <strong>{item.name}</strong>

                <span>{item.percentage} of all analyses</span>
              </div>

              <strong className="category-summary-count">
                {item.count}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel recent-activity-panel">
        <div className="section-heading-row">
          <div className="panel-heading">
            <div className="panel-heading-icon">
              <Clock3 size={21} />
            </div>

            <div>
              <h2>Recent Activity</h2>

              <p>Your latest sentiment analysis records.</p>
            </div>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={() => setActivePage("Analysis History")}
          >
            View All
          </button>
        </div>

        {historyLoading ? (
          <div className="loading-state">
            <LoaderCircle className="spin" size={24} />

            <p>Loading recent activity...</p>
          </div>
        ) : (
          <AnalysisTable records={history} compact />
        )}
      </section>
    </div>
  );

  /* -----------------------------------------------------
     RENDER HISTORY
  ----------------------------------------------------- */

  const renderHistory = () => (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Analysis History</h1>

          <p>
            Search, filter, review, and export your previous
            sentiment analysis records.
          </p>
        </div>

        <div className="heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={fetchHistory}
            disabled={historyLoading}
          >
            {historyLoading ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}

            Refresh
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={exportHistoryCSV}
            disabled={!filteredHistory.length}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <section className="panel history-panel">
        <div className="history-filters">
          <div className="search-input-wrapper">
            <Search size={18} />

            <input
              type="text"
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Search analyzed text..."
              aria-label="Search analysis history"
            />

            {historySearch && (
              <button
                type="button"
                className="clear-search-button"
                onClick={() => setHistorySearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <select
            value={sentimentFilter}
            onChange={(event) =>
              setSentimentFilter(event.target.value)
            }
            aria-label="Filter by sentiment"
          >
            <option value="All">All Sentiments</option>

            <option value="Positive">Positive</option>

            <option value="Negative">Negative</option>

            <option value="Neutral">Neutral</option>
          </select>

          <button
            type="button"
            className="secondary-button"
            onClick={resetHistoryFilters}
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>

        <div className="history-results-info">
          <span>
            Showing <strong>{filteredHistory.length}</strong> of{" "}
            <strong>{history.length}</strong> loaded records
          </span>

          {(historySearch || sentimentFilter !== "All") && (
            <span className="filter-active-label">
              Filters active
            </span>
          )}
        </div>

        {historyError && (
          <div className="error-message">
            <X size={16} />

            <span>{historyError}</span>
          </div>
        )}

        {historyLoading ? (
          <div className="loading-state">
            <LoaderCircle className="spin" size={28} />

            <p>Loading analysis history...</p>
          </div>
        ) : filteredHistory.length ? (
          <AnalysisTable records={filteredHistory} />
        ) : (
          <div className="empty-state">
            <Database size={38} />

            <h3>No matching records</h3>

            <p>
              Try changing your search text or sentiment filter.
            </p>

            {(historySearch || sentimentFilter !== "All") && (
              <button
                type="button"
                className="secondary-button"
                onClick={resetHistoryFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        <div className="history-note">
          <CalendarDays size={17} />

          <span>
            Timestamps are displayed in Indian Standard Time (IST).
            The number of available records depends on what the
            backend returns.
          </span>
        </div>
      </section>
    </div>
  );

  /* -----------------------------------------------------
     RENDER DASHBOARD
  ----------------------------------------------------- */

  const renderDashboard = () => (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Dashboard Overview</h1>

          <p>
            Welcome to your AI-powered sentiment analysis
            dashboard.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            fetchStats();
            fetchHistory();
          }}
          disabled={statsLoading}
        >
          {statsLoading ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <RefreshCw size={16} />
          )}

          Refresh Data
        </button>
      </div>

      {statsError && (
        <div className="error-message">{statsError}</div>
      )}

      {renderStatsCards()}

      <div className="dashboard-content-grid">
        <section className="panel dashboard-chart-panel">
          <div className="panel-heading">
            <div className="panel-heading-icon">
              <PieChartIcon size={21} />
            </div>

            <div>
              <h2>Sentiment Distribution</h2>

              <p>Current distribution of analyzed text.</p>
            </div>
          </div>

          <SentimentPieChart data={pieData} />
        </section>

        <section className="panel quick-analysis-panel">
          <div className="panel-heading">
            <div className="panel-heading-icon">
              <BrainCircuit size={21} />
            </div>

            <div>
              <h2>Quick Analysis</h2>

              <p>Analyze text with a single click.</p>
            </div>
          </div>

          <p className="quick-analysis-description">
            Use the sentiment analyzer to classify text as positive,
            negative, or neutral.
          </p>

          <button
            type="button"
            className="primary-button full-width-button"
            onClick={() => setActivePage("Sentiment Analysis")}
          >
            <Sparkles size={18} />
            Start Sentiment Analysis
          </button>

          <button
            type="button"
            className="secondary-button full-width-button"
            onClick={() => setActivePage("Analytics")}
          >
            <BarChart3 size={18} />
            View Detailed Analytics
          </button>
        </section>
      </div>

      <section className="panel dashboard-recent-panel">
        <div className="section-heading-row">
          <div className="panel-heading">
            <div className="panel-heading-icon">
              <Clock3 size={21} />
            </div>

            <div>
              <h2>Recent Analysis History</h2>

              <p>Your latest analyzed text records.</p>
            </div>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={() => setActivePage("Analysis History")}
          >
            View History
          </button>
        </div>

        {historyLoading ? (
          <div className="loading-state">
            <LoaderCircle className="spin" size={24} />

            <p>Loading records...</p>
          </div>
        ) : (
          <AnalysisTable records={history} compact />
        )}
      </section>
    </div>
  );

  /* -----------------------------------------------------
     RENDER SETTINGS
  ----------------------------------------------------- */

  const renderSettings = () => (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Settings</h1>

          <p>
            View application information and backend connection
            details.
          </p>
        </div>
      </div>

      <section className="panel settings-panel">
        <div className="panel-heading">
          <div className="panel-heading-icon">
            <Settings size={21} />
          </div>

          <div>
            <h2>Application Settings</h2>

            <p>Configuration information for this dashboard.</p>
          </div>
        </div>

        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-icon">
              <BrainCircuit size={20} />
            </div>

            <div>
              <strong>Application</strong>

              <p>AI Smart Analysis Dashboard</p>
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Activity size={20} />
            </div>

            <div>
              <strong>Sentiment Engine</strong>

              <p>VADER Sentiment Analysis</p>
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Database size={20} />
            </div>

            <div>
              <strong>Database</strong>

              <p>MongoDB</p>
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <strong>Backend API</strong>

              <p>http://127.0.0.1:5000</p>
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <BarChart3 size={20} />
            </div>

            <div>
              <strong>Frontend</strong>

              <p>React + Vite</p>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              fetchStats();
              fetchHistory();
              fetchTrends();
            }}
          >
            <RefreshCw size={16} />
            Refresh Application Data
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={downloadPDFReport}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Download size={16} />
            )}

            {pdfLoading ? "Generating PDF..." : "Download PDF Report"}
          </button>
        </div>

        {pdfError && (
          <div className="error-message">{pdfError}</div>
        )}
      </section>
    </div>
  );

  /* -----------------------------------------------------
     PAGE TITLE
  ----------------------------------------------------- */

  const pageSubtitle = {
    Dashboard: "Your sentiment analysis at a glance.",
    "Sentiment Analysis":
      "Analyze text and discover its sentiment.",
    Analytics: "Detailed statistics and sentiment insights.",
    "Analysis History": "Review your previous analyses.",
    Settings: "Application configuration and information.",
  };

  /* -----------------------------------------------------
     MAIN LAYOUT
  ----------------------------------------------------- */

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <BrainCircuit size={25} />
          </div>

          <div className="brand-text">
            <h2>SmartAnalysis</h2>

            <span>AI Dashboard</span>
          </div>
        </div>

        <div className="sidebar-section-label">
          MAIN MENU
        </div>

        <nav className="sidebar-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive = activePage === item.name;

            return (
              <button
                type="button"
                key={item.name}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  setActivePage(item.name);

                  if (item.name !== "Analytics") {
                    setPdfError("");
                  }
                }}
              >
                <Icon size={19} />

                <span>{item.name}</span>

                {isActive && (
                  <span className="nav-active-indicator" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status-card">
            <div className="status-card-icon">
              <Activity size={19} />
            </div>

            <div>
              <strong>AI Analysis</strong>

              <span>Sentiment engine</span>
            </div>

            <span className="status-dot" />
          </div>

          <div className="sidebar-footer">
            <span className="sidebar-footer-dot" />

            <span>AI Smart Analysis Dashboard</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <h2>{activePage}</h2>

            <p>{pageSubtitle[activePage]}</p>
          </div>

          <div className="topbar-actions">
            <div className="api-status">
              <span className="status-dot" />

              <span>API Connected</span>
            </div>

            <div className="topbar-avatar">
              <BrainCircuit size={22} />
            </div>
          </div>
        </header>

        <div className="page-wrapper">
          {activePage === "Dashboard" && renderDashboard()}

          {activePage === "Sentiment Analysis" && renderAnalysis()}

          {activePage === "Analytics" && renderAnalytics()}

          {activePage === "Analysis History" && renderHistory()}

          {activePage === "Settings" && renderSettings()}
        </div>

        <footer className="app-footer">
          <span>
            © {new Date().getFullYear()} AI Smart Analysis Dashboard
          </span>

          <span>
            Powered by React, Flask, MongoDB & VADER
          </span>
        </footer>
      </main>
    </div>
  );
}