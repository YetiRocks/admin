use crate::metrics::Metrics;
use reqwest::Client;
use std::future::Future;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::task::JoinSet;

pub struct ScenarioContext {
    pub client: Client,
    pub base_url: String,
    pub auth_user: String,
    pub auth_pass: String,
    pub metrics: Arc<Metrics>,
    pub vu_id: u64,
}

/// Run a load test: spawn `vus` tasks, each looping `scenario_fn` until `duration` elapses.
/// Returns the shared Metrics and actual elapsed duration.
pub async fn run_load_test<F, Fut>(
    vus: u64,
    duration: Duration,
    client: Client,
    base_url: String,
    auth_user: String,
    auth_pass: String,
    scenario_fn: F,
) -> (Arc<Metrics>, f64)
where
    F: Fn(Arc<ScenarioContext>) -> Fut + Send + Sync + 'static,
    Fut: Future<Output = ()> + Send,
{
    let metrics = Arc::new(Metrics::new());
    let scenario_fn = Arc::new(scenario_fn);
    let deadline = Instant::now() + duration;

    let mut join_set = JoinSet::new();

    for vu_id in 0..vus {
        let ctx = Arc::new(ScenarioContext {
            client: client.clone(),
            base_url: base_url.clone(),
            auth_user: auth_user.clone(),
            auth_pass: auth_pass.clone(),
            metrics: metrics.clone(),
            vu_id,
        });
        let sf = scenario_fn.clone();

        join_set.spawn(async move {
            while Instant::now() < deadline {
                sf(ctx.clone()).await;
            }
        });
    }

    let start = Instant::now();

    // Wait for all VUs to finish
    while join_set.join_next().await.is_some() {}

    let elapsed = start.elapsed().as_secs_f64();
    (metrics, elapsed)
}
