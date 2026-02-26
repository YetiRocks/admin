use hdrhistogram::Histogram;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

pub struct Metrics {
    pub total_requests: AtomicU64,
    pub total_errors: AtomicU64,
    pub total_bytes: AtomicU64,
    latency_hist: Mutex<Histogram<u64>>,
}

impl Metrics {
    pub fn new() -> Self {
        Self {
            total_requests: AtomicU64::new(0),
            total_errors: AtomicU64::new(0),
            total_bytes: AtomicU64::new(0),
            latency_hist: Mutex::new(
                Histogram::new_with_bounds(1, 60_000_000, 3)
                    .expect("failed to create histogram"),
            ),
        }
    }

    pub fn record_success(&self, latency_us: u64, bytes: u64) {
        self.total_requests.fetch_add(1, Ordering::Relaxed);
        self.total_bytes.fetch_add(bytes, Ordering::Relaxed);
        if let Ok(mut hist) = self.latency_hist.lock() {
            let _ = hist.record(latency_us);
        }
    }

    pub fn record_error(&self) {
        self.total_requests.fetch_add(1, Ordering::Relaxed);
        self.total_errors.fetch_add(1, Ordering::Relaxed);
    }

    pub fn summary(&self, duration_secs: f64) -> MetricsSummary {
        let total = self.total_requests.load(Ordering::Relaxed);
        let errors = self.total_errors.load(Ordering::Relaxed);
        let bytes = self.total_bytes.load(Ordering::Relaxed);
        let throughput = if duration_secs > 0.0 {
            total as f64 / duration_secs
        } else {
            0.0
        };

        let (p50_ms, p99_ms) = if let Ok(hist) = self.latency_hist.lock() {
            (
                hist.value_at_quantile(0.50) as f64 / 1000.0,
                hist.value_at_quantile(0.99) as f64 / 1000.0,
            )
        } else {
            (0.0, 0.0)
        };

        MetricsSummary {
            throughput,
            p50_ms,
            p99_ms,
            total,
            errors,
            total_bytes: bytes,
        }
    }
}

#[derive(Debug, Clone)]
pub struct MetricsSummary {
    pub throughput: f64,
    pub p50_ms: f64,
    pub p99_ms: f64,
    pub total: u64,
    pub errors: u64,
    pub total_bytes: u64,
}

impl MetricsSummary {
    pub fn format_summary(&self, duration_secs: f64) -> String {
        format!(
            "{} requests in {:.0}s ({:.1} req/s), p50={:.2}ms p99={:.2}ms, {} errors",
            format_count(self.total),
            duration_secs,
            self.throughput,
            self.p50_ms,
            self.p99_ms,
            self.errors,
        )
    }
}

fn format_count(n: u64) -> String {
    if n >= 1_000_000 {
        format!("{:.1}M", n as f64 / 1_000_000.0)
    } else if n >= 1_000 {
        format!("{:.1}k", n as f64 / 1_000.0)
    } else {
        n.to_string()
    }
}
