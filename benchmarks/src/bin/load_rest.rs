use clap::Parser;
use std::sync::Arc;
use std::time::Duration;
use uuid::Uuid;
use yeti_benchmarks::{cli::BenchArgs, client, reporter, runner};

/// Fetch real Book IDs from the server via REST API.
async fn fetch_book_ids(
    client: &reqwest::Client,
    base_url: &str,
    auth_user: &str,
    auth_pass: &str,
    limit: usize,
) -> Vec<String> {
    let url = format!("{}/demo-graphql/Book?limit={}&select=id", base_url, limit);
    match client
        .get(&url)
        .basic_auth(auth_user, Some(auth_pass))
        .send()
        .await
    {
        Ok(resp) => {
            if let Ok(data) = resp.json::<serde_json::Value>().await {
                let arr = if data.is_array() {
                    data.as_array().cloned().unwrap_or_default()
                } else {
                    data.get("data")
                        .and_then(|d| d.as_array())
                        .cloned()
                        .unwrap_or_default()
                };
                arr.iter()
                    .filter_map(|v| v.get("id").and_then(|id| id.as_str()).map(String::from))
                    .collect()
            } else {
                Vec::new()
            }
        }
        Err(_) => Vec::new(),
    }
}

#[tokio::main]
async fn main() {
    let args = BenchArgs::parse();
    let (auth_user, auth_pass) = args.auth_parts();
    let auth_user = auth_user.to_string();
    let auth_pass = auth_pass.to_string();
    let client = client::build_client();
    let duration = Duration::from_secs(args.duration);

    println!(
        "load-rest: test={}, duration={}s, vus={}, base={}",
        args.test, args.duration, args.vus, args.base_url
    );

    match args.test.as_str() {
        "rest-read" => {
            // Pre-fetch real Book IDs (UUID keys, not integers)
            let ids = fetch_book_ids(&client, &args.base_url, &auth_user, &auth_pass, 100).await;
            if ids.is_empty() {
                eprintln!("ERROR: No Book records found. Run rest-write first to seed data.");
                std::process::exit(1);
            }
            println!("Setup: fetched {} real Book IDs for read test", ids.len());
            let ids = Arc::new(ids);

            let (metrics, elapsed) = runner::run_load_test(
                args.vus,
                duration,
                client.clone(),
                args.base_url.clone(),
                auth_user.clone(),
                auth_pass.clone(),
                move |ctx| {
                    let ids = ids.clone();
                    async move {
                        let id = &ids[ctx.vu_id as usize % ids.len()];
                        let url = format!("{}/demo-graphql/Book/{}", ctx.base_url, id);
                        let start = std::time::Instant::now();
                        match ctx.client.get(&url)
                            .basic_auth(&ctx.auth_user, Some(&ctx.auth_pass))
                            .send().await {
                            Ok(resp) => {
                                let bytes = resp.bytes().await.map(|b| b.len() as u64).unwrap_or(0);
                                let latency = start.elapsed().as_micros() as u64;
                                ctx.metrics.record_success(latency, bytes);
                            }
                            Err(_) => ctx.metrics.record_error(),
                        }
                    }
                },
            )
            .await;

            let summary = metrics.summary(elapsed);
            reporter::report_results(
                &client, &args.base_url, &auth_user, &auth_pass,
                "rest-read", elapsed, &summary,
            )
            .await;
        }
        "rest-write" => {
            let (metrics, elapsed) = runner::run_load_test(
                args.vus,
                duration,
                client.clone(),
                args.base_url.clone(),
                auth_user.clone(),
                auth_pass.clone(),
                |ctx| async move {
                    let id = Uuid::new_v4().to_string();
                    let body = serde_json::json!({
                        "id": id,
                        "title": format!("Bench Book {}", &id[..8]),
                        "isbn": format!("978-{}", &id[..10]),
                        "genre": "benchmark",
                        "price": 9.99,
                    });
                    let url = format!("{}/demo-graphql/Book/", ctx.base_url);
                    let start = std::time::Instant::now();
                    match ctx
                        .client
                        .post(&url)
                        .basic_auth(&ctx.auth_user, Some(&ctx.auth_pass))
                        .json(&body)
                        .send()
                        .await
                    {
                        Ok(resp) => {
                            let bytes = resp.bytes().await.map(|b| b.len() as u64).unwrap_or(0);
                            let latency = start.elapsed().as_micros() as u64;
                            ctx.metrics.record_success(latency, bytes);
                        }
                        Err(_) => ctx.metrics.record_error(),
                    }
                },
            )
            .await;

            let summary = metrics.summary(elapsed);
            reporter::report_results(
                &client, &args.base_url, &auth_user, &auth_pass,
                "rest-write", elapsed, &summary,
            )
            .await;
        }
        "rest-update" => {
            // Setup phase: pre-create records
            let record_count = args.vus * 5;
            let record_ids: Vec<String> = (0..record_count).map(|_| Uuid::new_v4().to_string()).collect();
            println!("Setup: creating {} records...", record_count);

            for id in &record_ids {
                let body = serde_json::json!({
                    "id": id,
                    "title": format!("Update Bench {}", &id[..8]),
                    "isbn": format!("978-{}", &id[..10]),
                    "genre": "benchmark",
                    "price": 10.0,
                });
                let url = format!("{}/demo-graphql/Book/", args.base_url);
                let _ = client
                    .post(&url)
                    .basic_auth(&auth_user, Some(&auth_pass))
                    .json(&body)
                    .send()
                    .await;
            }
            println!("Setup complete. Starting load test...");

            let ids = Arc::new(record_ids);
            let (metrics, elapsed) = runner::run_load_test(
                args.vus,
                duration,
                client.clone(),
                args.base_url.clone(),
                auth_user.clone(),
                auth_pass.clone(),
                move |ctx| {
                    let ids = ids.clone();
                    async move {
                        let idx = (ctx.vu_id as usize) % ids.len();
                        let id = &ids[idx];
                        let price: f64 = rand::random::<f64>() * 100.0;
                        let body = serde_json::json!({ "price": price });
                        let url = format!("{}/demo-graphql/Book/{}", ctx.base_url, id);
                        let start = std::time::Instant::now();
                        match ctx
                            .client
                            .patch(&url)
                            .basic_auth(&ctx.auth_user, Some(&ctx.auth_pass))
                            .json(&body)
                            .send()
                            .await
                        {
                            Ok(resp) => {
                                let bytes =
                                    resp.bytes().await.map(|b| b.len() as u64).unwrap_or(0);
                                let latency = start.elapsed().as_micros() as u64;
                                ctx.metrics.record_success(latency, bytes);
                            }
                            Err(_) => ctx.metrics.record_error(),
                        }
                    }
                },
            )
            .await;

            let summary = metrics.summary(elapsed);
            reporter::report_results(
                &client, &args.base_url, &auth_user, &auth_pass,
                "rest-update", elapsed, &summary,
            )
            .await;
        }
        "rest-join" => {
            // Pre-fetch real Book IDs (UUID keys, not integers)
            let ids = fetch_book_ids(&client, &args.base_url, &auth_user, &auth_pass, 100).await;
            if ids.is_empty() {
                eprintln!("ERROR: No Book records found. Run rest-write first to seed data.");
                std::process::exit(1);
            }
            println!("Setup: fetched {} real Book IDs for join test", ids.len());
            let ids = Arc::new(ids);

            let (metrics, elapsed) = runner::run_load_test(
                args.vus,
                duration,
                client.clone(),
                args.base_url.clone(),
                auth_user.clone(),
                auth_pass.clone(),
                move |ctx| {
                    let ids = ids.clone();
                    async move {
                        let id = &ids[ctx.vu_id as usize % ids.len()];
                        let url = format!(
                            "{}/demo-graphql/Book/{}?select=id,title,author{{name}}",
                            ctx.base_url, id
                        );
                        let start = std::time::Instant::now();
                        match ctx.client.get(&url)
                            .basic_auth(&ctx.auth_user, Some(&ctx.auth_pass))
                            .send().await {
                            Ok(resp) => {
                                let bytes = resp.bytes().await.map(|b| b.len() as u64).unwrap_or(0);
                                let latency = start.elapsed().as_micros() as u64;
                                ctx.metrics.record_success(latency, bytes);
                            }
                            Err(_) => ctx.metrics.record_error(),
                        }
                    }
                },
            )
            .await;

            let summary = metrics.summary(elapsed);
            reporter::report_results(
                &client, &args.base_url, &auth_user, &auth_pass,
                "rest-join", elapsed, &summary,
            )
            .await;
        }
        other => {
            eprintln!("Unknown test for load-rest: {}", other);
            std::process::exit(1);
        }
    }
}
