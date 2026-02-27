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
        "load-graphql: test={}, duration={}s, vus={}, base={}",
        args.test, args.duration, args.vus, args.base_url
    );

    match args.test.as_str() {
        "graphql-read" => {
            // Pre-fetch real Book IDs (UUID keys, not integers)
            let ids = fetch_book_ids(&client, &args.base_url, &auth_user, &auth_pass, 100).await;
            if ids.is_empty() {
                eprintln!("ERROR: No Book records found. Run rest-write or graphql-mutation first to seed data.");
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
                        let query = serde_json::json!({
                            "query": format!("{{ Book(id: \"{}\") {{ id title isbn genre price }} }}", id)
                        });
                        let url = format!("{}/demo-graphql/graphql", ctx.base_url);
                        let start = std::time::Instant::now();
                        match ctx.client.post(&url)
                            .basic_auth(&ctx.auth_user, Some(&ctx.auth_pass))
                            .json(&query).send().await {
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
                "graphql-read", elapsed, &summary,
            )
            .await;
        }
        "graphql-mutation" => {
            let (metrics, elapsed) = runner::run_load_test(
                args.vus,
                duration,
                client.clone(),
                args.base_url.clone(),
                auth_user.clone(),
                auth_pass.clone(),
                |ctx| async move {
                    let id = Uuid::new_v4().to_string();
                    let mutation = format!(
                        r#"mutation {{ createBook(input: {{ id: "{}", title: "GQL Bench {}", isbn: "978-{}", genre: "benchmark", price: 9.99 }}) {{ id }} }}"#,
                        id, &id[..8], &id[..10]
                    );
                    let query = serde_json::json!({ "query": mutation });
                    let url = format!("{}/demo-graphql/graphql", ctx.base_url);
                    let start = std::time::Instant::now();
                    match ctx
                        .client
                        .post(&url)
                        .basic_auth(&ctx.auth_user, Some(&ctx.auth_pass))
                        .json(&query)
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
                "graphql-mutation", elapsed, &summary,
            )
            .await;
        }
        "graphql-join" => {
            // Pre-fetch real Book IDs (UUID keys, not integers)
            let ids = fetch_book_ids(&client, &args.base_url, &auth_user, &auth_pass, 100).await;
            if ids.is_empty() {
                eprintln!("ERROR: No Book records found. Run rest-write or graphql-mutation first to seed data.");
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
                        let query_str = format!(
                            r#"{{ Book(id: "{}") {{ id title author {{ name }} }} }}"#,
                            id
                        );
                        let query = serde_json::json!({ "query": query_str });
                        let url = format!("{}/demo-graphql/graphql", ctx.base_url);
                        let start = std::time::Instant::now();
                        match ctx.client.post(&url)
                            .basic_auth(&ctx.auth_user, Some(&ctx.auth_pass))
                            .json(&query).send().await {
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
                "graphql-join", elapsed, &summary,
            )
            .await;
        }
        other => {
            eprintln!("Unknown test for load-graphql: {}", other);
            std::process::exit(1);
        }
    }
}
