//! Code points as storm/EVGCodepoint.rgr sees them. A Rust string is UTF-8
//! and `chars()` already yields code points, so storm's UTF-16 surrogate
//! and UTF-8 byte helpers (codeAt, unitsAt, encodeUtf8) have no
//! counterpart here: text is handled as a list of code points.

/// After a hyphen, dash or slash a line may break.
pub fn breaks_after(c: i64) -> bool {
    c == 45 || c == 8208 || c == 8211 || c == 8212 || c == 47
}

/// A space or a tab.
pub fn is_space(c: i64) -> bool {
    c == 32 || c == 9
}

/// The code points of `s`.
pub fn to_array(s: &str) -> Vec<i64> {
    let mut out: Vec<i64> = Vec::new();
    for c in s.chars() {
        out.push(c as i64);
    }
    out
}

/// How many code points `s` has.
pub fn count(s: &str) -> i64 {
    s.chars().count() as i64
}

/// The text of one code point; "" for a surrogate or past U+10FFFF.
pub fn to_str(cp: i64) -> String {
    if cp < 0 {
        return String::new();
    }
    match char::from_u32(cp as u32) {
        Some(c) => c.to_string(),
        None => String::new(),
    }
}
