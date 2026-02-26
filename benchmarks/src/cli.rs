use clap::Parser;

#[derive(Parser, Debug, Clone)]
#[command(about = "Yeti benchmark load test")]
pub struct BenchArgs {
    /// Test ID to run (e.g. rest-read, graphql-mutation)
    #[arg(long)]
    pub test: String,

    /// Test duration in seconds
    #[arg(long, default_value = "30")]
    pub duration: u64,

    /// Number of virtual users (concurrent tasks)
    #[arg(long, default_value = "50")]
    pub vus: u64,

    /// Base URL of the Yeti server
    #[arg(long, default_value = "https://localhost")]
    pub base_url: String,

    /// Basic auth credentials (user:pass)
    #[arg(long, default_value = "admin:admin123")]
    pub auth: String,
}

impl BenchArgs {
    pub fn auth_parts(&self) -> (&str, &str) {
        match self.auth.split_once(':') {
            Some((user, pass)) => (user, pass),
            None => (&self.auth, ""),
        }
    }
}
