//! EVG core in strict Rust: the base types of storm/ (units, colours,
//! code points, grapheme clusters, easings), ported one module at a time.
//! cargo builds it as Rust; rgrc builds the same source for its targets.
pub mod codepoint;
pub mod color;
pub mod easing;
pub mod grapheme;
pub mod num;
pub mod unit;
