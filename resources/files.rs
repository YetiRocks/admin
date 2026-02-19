//! File Browser/Editor Resource
//!
//! REST API for browsing and editing application files.
//!
//! | Method | Path                                           | Description        |
//! |--------|------------------------------------------------|--------------------|
//! | GET    | /yeti-applications/files?app={id}&path=/       | List directory      |
//! | GET    | /yeti-applications/files?app={id}&path=/f.rs   | Read file as text   |
//! | PUT    | /yeti-applications/files                       | Update file         |
//! | POST   | /yeti-applications/files                       | Create file         |
//! | DELETE | /yeti-applications/files?app={id}&path=/file   | Delete file         |

use std::path::PathBuf;
use yeti_core::prelude::*;

pub type Files = FilesResource;

#[derive(Default)]
pub struct FilesResource;

/// Validate and resolve a file path within an app directory.
/// Returns the canonical path if safe, or an error if path traversal is detected.
fn resolve_safe_path(app_id: &str, rel_path: &str) -> Result<PathBuf> {
    let app_path = get_root_directory().join("applications").join(app_id);
    if !app_path.is_dir() {
        return Err(YetiError::Validation(format!("Application '{}' not found", app_id)));
    }
    let clean_path = rel_path.strip_prefix('/').unwrap_or(rel_path);
    if clean_path.is_empty() {
        return app_path.canonicalize()
            .map_err(|e| YetiError::Internal(format!("Cannot resolve path: {}", e)));
    }
    validate_path_within_base(&app_path, clean_path)
}

impl Resource for FilesResource {
    fn name(&self) -> &str {
        "files"
    }

    get!(request, _ctx, {
        let query = request.uri().query().unwrap_or("");
        let app_id = parse_required_query_param(query, "app")?;
        let rel_path = parse_query_param(query, "path")
            .unwrap_or_else(|| "/".to_string());

        let safe_path = resolve_safe_path(&app_id, &rel_path)?;

        // Directory listing
        if safe_path.is_dir() {
            let entries = std::fs::read_dir(&safe_path)
                .map_err(|e| YetiError::Internal(format!("Cannot read directory: {}", e)))?;

            let mut items: Vec<serde_json::Value> = Vec::new();
            for entry in entries.flatten() {
                let meta = entry.metadata().ok();
                let name = entry.file_name().to_string_lossy().to_string();
                let is_dir = meta.as_ref().map_or(false, |m| m.is_dir());
                let size = meta.as_ref().map_or(0, |m| m.len());

                items.push(json!({
                    "name": name,
                    "type": if is_dir { "directory" } else { "file" },
                    "size": size,
                }));
            }

            items.sort_by(|a, b| {
                let a_type = a["type"].as_str().unwrap_or("");
                let b_type = b["type"].as_str().unwrap_or("");
                let a_name = a["name"].as_str().unwrap_or("");
                let b_name = b["name"].as_str().unwrap_or("");
                // Directories first, then alphabetical
                b_type.cmp(a_type).then(a_name.cmp(b_name))
            });

            return reply().json(json!({
                "app": app_id,
                "path": rel_path,
                "type": "directory",
                "entries": items,
            }));
        }

        // File read
        if safe_path.is_file() {
            let content = std::fs::read(&safe_path)
                .map_err(|e| YetiError::Internal(format!("Cannot read file: {}", e)))?;

            // Check if content is valid UTF-8
            match String::from_utf8(content) {
                Ok(text) => {
                    let size = safe_path.metadata().map(|m| m.len()).unwrap_or(0);
                    return reply().json(json!({
                        "app": app_id,
                        "path": rel_path,
                        "type": "file",
                        "content": text,
                        "size": size,
                    }));
                }
                Err(_) => {
                    return bad_request("File is not valid UTF-8 text");
                }
            }
        }

        not_found(&format!("Path '{}' not found in app '{}'", rel_path, app_id))
    });

    post!(request, _ctx, {
        let body = request.json_value()?;
        let app_id = body.require_str("app")?;
        let rel_path = body.require_str("path")?;
        let content = body.require_str("content")?;

        let safe_path = resolve_safe_path(&app_id, &rel_path)?;

        if safe_path.exists() {
            return bad_request(&format!("File '{}' already exists, use PUT to update", rel_path));
        }

        // Create parent directories if needed
        if let Some(parent) = safe_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| YetiError::Internal(format!("Failed to create directories: {}", e)))?;
        }

        std::fs::write(&safe_path, &content)
            .map_err(|e| YetiError::Internal(format!("Failed to write file: {}", e)))?;

        reply().code(201).json(json!({
            "app": app_id,
            "path": rel_path,
            "created": true,
            "size": content.len(),
        }))
    });

    put!(request, _ctx, {
        let body = request.json_value()?;
        let app_id = body.require_str("app")?;
        let rel_path = body.require_str("path")?;
        let content = body.require_str("content")?;

        let safe_path = resolve_safe_path(&app_id, &rel_path)?;

        if !safe_path.exists() {
            return not_found(&format!("File '{}' not found in app '{}'", rel_path, app_id));
        }

        std::fs::write(&safe_path, &content)
            .map_err(|e| YetiError::Internal(format!("Failed to write file: {}", e)))?;

        reply().json(json!({
            "app": app_id,
            "path": rel_path,
            "updated": true,
            "size": content.len(),
        }))
    });

    delete!(request, _ctx, {
        let query = request.uri().query().unwrap_or("");
        let app_id = parse_required_query_param(query, "app")?;
        let rel_path = parse_required_query_param(query, "path")?;

        let safe_path = resolve_safe_path(&app_id, &rel_path)?;

        if !safe_path.exists() {
            return not_found(&format!("Path '{}' not found in app '{}'", rel_path, app_id));
        }

        if safe_path.is_dir() {
            std::fs::remove_dir_all(&safe_path)
                .map_err(|e| YetiError::Internal(format!("Failed to remove directory: {}", e)))?;
        } else {
            std::fs::remove_file(&safe_path)
                .map_err(|e| YetiError::Internal(format!("Failed to remove file: {}", e)))?;
        }

        reply().json(json!({
            "app": app_id,
            "path": rel_path,
            "deleted": true,
        }))
    });
}

register_resource!(FilesResource);
