use crate::metrics::MetricsSummary;
use reqwest::Client;

/// POST test results to /admin/TestRun and print summary to stdout.
pub async fn report_results(
    client: &Client,
    base_url: &str,
    auth_user: &str,
    auth_pass: &str,
    test_name: &str,
    duration_secs: f64,
    summary: &MetricsSummary,
) {
    let summary_text = summary.format_summary(duration_secs);
    println!("\n=== {} ===", test_name);
    println!("{}", summary_text);
    if summary.total_bytes > 0 {
        let mb = summary.total_bytes as f64 / (1024.0 * 1024.0);
        println!("Total bytes: {:.1} MB ({:.1} MB/s)", mb, mb / duration_secs);
    }

    let results_json = serde_json::json!({
        "throughput": (summary.throughput * 10.0).round() / 10.0,
        "p50": (summary.p50_ms * 100.0).round() / 100.0,
        "p99": (summary.p99_ms * 100.0).round() / 100.0,
        "total": summary.total,
        "errors": summary.errors,
    });

    let payload = serde_json::json!({
        "testName": test_name,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "durationSecs": (duration_secs * 10.0).round() / 10.0,
        "results": results_json.to_string(),
        "summary": summary_text,
        "extrapolatedThroughput": format!("{:.1}", summary.throughput),
    });

    let url = format!("{}/admin/TestRun", base_url);
    match client
        .post(&url)
        .basic_auth(auth_user, Some(auth_pass))
        .json(&payload)
        .send()
        .await
    {
        Ok(resp) => {
            if !resp.status().is_success() {
                eprintln!("Warning: POST {} returned {}", url, resp.status());
            }
        }
        Err(e) => {
            eprintln!("Warning: Failed to POST results to {}: {}", url, e);
        }
    }
}
