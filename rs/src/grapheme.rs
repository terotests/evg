//! Grapheme clusters as storm/EVGGrapheme.rgr finds them: what a caret
//! steps over and a line never splits. Not full UAX #29; the cases text in
//! slides meets: combining marks, variation selectors, emoji modifiers and
//! tags, ZWJ sequences, flag pairs.

use crate::codepoint;

pub fn is_zwj(cp: i64) -> bool {
    cp == 8205
}

pub fn is_regional_indicator(cp: i64) -> bool {
    cp >= 127462 && cp <= 127487
}

pub fn is_emoji_modifier(cp: i64) -> bool {
    cp >= 127995 && cp <= 127999
}

pub fn is_tag(cp: i64) -> bool {
    cp >= 917536 && cp <= 917631
}

/// Marks that join the code point before them.
pub fn is_extend(cp: i64) -> bool {
    (cp >= 768 && cp <= 879)
        || (cp >= 6832 && cp <= 6911)
        || (cp >= 7616 && cp <= 7679)
        || (cp >= 8400 && cp <= 8447)
        || (cp >= 65024 && cp <= 65039)
        || (cp >= 65056 && cp <= 65071)
        || is_emoji_modifier(cp)
        || is_tag(cp)
}

/// The index just past the cluster that starts at `start`.
pub fn cluster_end(cps: &Vec<i64>, start: i64) -> i64 {
    let n = cps.len() as i64;
    if start >= n {
        return n;
    }
    let mut i = start + 1;
    // a flag is two regional indicators, never more
    if is_regional_indicator(cps[start as usize]) {
        if i < n && is_regional_indicator(cps[i as usize]) {
            i += 1;
        }
        return i;
    }
    loop {
        if i >= n {
            break;
        }
        let cp = cps[i as usize];
        if is_extend(cp) {
            i += 1;
        } else if is_zwj(cp) && i + 1 < n {
            i += 2;
        } else {
            break;
        }
    }
    i
}

/// Where each cluster starts, then the length.
pub fn boundaries(cps: &Vec<i64>) -> Vec<i64> {
    let mut out: Vec<i64> = Vec::new();
    let n = cps.len() as i64;
    let mut i: i64 = 0;
    while i < n {
        out.push(i);
        i = cluster_end(cps, i);
    }
    out.push(n);
    out
}

pub fn cluster_count(s: &str) -> i64 {
    let cps = codepoint::to_array(s);
    let n = cps.len() as i64;
    let mut count: i64 = 0;
    let mut i: i64 = 0;
    while i < n {
        i = cluster_end(&cps, i);
        count += 1;
    }
    count
}

/// The cluster that starts at code point `index` (storm takes a string
/// unit index, which is target-specific).
pub fn cluster_at(s: &str, index: i64) -> String {
    let cps = codepoint::to_array(s);
    let end = cluster_end(&cps, index);
    let mut out = String::new();
    let mut k = index;
    while k < end {
        out.push_str(&codepoint::to_str(cps[k as usize]));
        k += 1;
    }
    out
}
