//! Schema/Table Discovery Resource
//!
//! Reads schema.graphql from each app and extracts @table directives.
//!
//! | Method | Path                                    | Description                   |
//! |--------|-----------------------------------------|-------------------------------|
//! | GET    | /yeti-applications/schemas/{app_id}     | Tables with fields & REST URL |

use std::path::PathBuf;
use yeti_core::prelude::*;

pub type Schemas = SchemasResource;

#[derive(Default)]
pub struct SchemasResource;

/// Get the applications directory path
fn apps_dir() -> PathBuf {
    get_apps_directory()
}

/// Parse schema.graphql to extract table definitions
fn parse_schema(content: &str) -> Vec<serde_json::Value> {
    let mut tables = Vec::new();
    let mut current_table: Option<(String, String)> = None; // (name, database)
    let mut current_fields: Vec<serde_json::Value> = Vec::new();

    for line in content.lines() {
        let trimmed = line.trim();

        // Match: type TableName @table(database: "db-name") ...
        if trimmed.starts_with("type ") && trimmed.contains("@table") {
            // Save previous table if any
            if let Some((name, db)) = current_table.take() {
                tables.push(json!({
                    "name": name,
                    "database": db,
                    "fields": current_fields.clone(),
                }));
                current_fields.clear();
            }

            // Parse table name
            let after_type = &trimmed[5..];
            let table_name = after_type.split_whitespace().next().unwrap_or("").to_string();

            // Parse database name from @table(database: "...")
            let database = if let Some(start) = trimmed.find("database:") {
                let after_db = &trimmed[start + 9..];
                let after_db = after_db.trim();
                // Find quoted string
                if let Some(q_start) = after_db.find('"') {
                    let rest = &after_db[q_start + 1..];
                    if let Some(q_end) = rest.find('"') {
                        rest[..q_end].to_string()
                    } else {
                        String::new()
                    }
                } else {
                    String::new()
                }
            } else {
                String::new()
            };

            current_table = Some((table_name, database));
        } else if trimmed == "}" {
            // End of type block
            if let Some((name, db)) = current_table.take() {
                tables.push(json!({
                    "name": name,
                    "database": db,
                    "fields": current_fields.clone(),
                }));
                current_fields.clear();
            }
        } else if current_table.is_some() && trimmed.contains(':') && !trimmed.starts_with('#') {
            // Field line like: fieldName: Type! @indexed
            let parts: Vec<&str> = trimmed.splitn(2, ':').collect();
            if parts.len() == 2 {
                let field_name = parts[0].trim().to_string();
                let type_part = parts[1].trim();
                // Extract just the type (before any @directive)
                let field_type = type_part.split('@').next().unwrap_or(type_part).trim().to_string();

                if !field_name.is_empty() {
                    current_fields.push(json!({
                        "name": field_name,
                        "type": field_type,
                    }));
                }
            }
        }
    }

    tables
}

impl Resource for SchemasResource {
    fn name(&self) -> &str {
        "schemas"
    }

    get!(_request, ctx, {
        let app_id = ctx.require_id()?.to_string();

        let apps_path = apps_dir();
        let app_path = apps_path.join(&app_id);

        if !app_path.is_dir() {
            return not_found(&format!("Application '{}' not found", app_id));
        }

        // Collect tables from schema.graphql and/or schemas/*.graphql
        // Each file's tables are tagged with a group name (filename without extension)
        let mut tables: Vec<serde_json::Value> = Vec::new();

        let single = app_path.join("schema.graphql");
        if single.exists() {
            if let Ok(c) = std::fs::read_to_string(&single) {
                for mut t in parse_schema(&c) {
                    t["group"] = json!("schema");
                    tables.push(t);
                }
            }
        }

        let schemas_dir = app_path.join("schemas");
        if schemas_dir.is_dir() {
            if let Ok(entries) = std::fs::read_dir(&schemas_dir) {
                let mut files: Vec<_> = entries
                    .filter_map(|e| e.ok())
                    .filter(|e| e.path().extension().is_some_and(|ext| ext == "graphql"))
                    .collect();
                files.sort_by_key(|e| e.file_name());
                for entry in files {
                    let group = entry.path().file_stem()
                        .map(|s| s.to_string_lossy().to_string())
                        .unwrap_or_else(|| "unknown".to_string());
                    if let Ok(c) = std::fs::read_to_string(entry.path()) {
                        for mut t in parse_schema(&c) {
                            t["group"] = json!(group);
                            tables.push(t);
                        }
                    }
                }
            }
        }

        if tables.is_empty() {
            return reply().json(json!({
                "app_id": app_id,
                "tables": [],
            }));
        }

        // Add REST URL for each table
        for table in &mut tables {
            if let Some(name) = table.get("name").and_then(|v| v.as_str()) {
                table["rest_url"] = json!(format!("/{}/{}", app_id, name));
            }
        }

        reply().json(json!({
            "app_id": app_id,
            "tables": tables,
        }))
    });
}

register_resource!(SchemasResource);
