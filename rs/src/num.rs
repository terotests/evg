//! Numbers read from CSS text.

/// The number at the start of `s` (after spaces), as JavaScript's
/// parseFloat reads it: a sign, digits, a fraction, an exponent; what
/// follows is ignored ("50%" is 50). None when no digit starts it.
///
/// Storm's `.rgr` sources call `to_double`, which is this on JavaScript and
/// a strict whole-string parse on C++; the JavaScript build is the one in
/// use, so this is the meaning kept.
pub fn lead_number(s: &str) -> Option<f64> {
    let cs: Vec<char> = s.trim().chars().collect();
    let n = cs.len();
    let mut i: usize = 0;
    if i < n && (cs[i] == '+' || cs[i] == '-') {
        i += 1;
    }
    let mut digits: usize = 0;
    while i < n && cs[i].is_ascii_digit() {
        i += 1;
        digits += 1;
    }
    if i < n && cs[i] == '.' {
        let mut j = i + 1;
        let mut frac: usize = 0;
        while j < n && cs[j].is_ascii_digit() {
            j += 1;
            frac += 1;
        }
        if digits + frac > 0 {
            i = j;
            digits += frac;
        }
    }
    if digits == 0 {
        return None;
    }
    // an exponent counts only when digits follow it
    if i < n && (cs[i] == 'e' || cs[i] == 'E') {
        let mut j = i + 1;
        if j < n && (cs[j] == '+' || cs[j] == '-') {
            j += 1;
        }
        let start = j;
        while j < n && cs[j].is_ascii_digit() {
            j += 1;
        }
        if j > start {
            i = j;
        }
    }
    let text: String = cs[0..i].iter().collect();
    match text.parse::<f64>() {
        Ok(v) => Some(v),
        Err(_) => None,
    }
}

/// `v` rounded to six decimals, written without an exponent: the same text
/// on every target (the parity lines use it).
pub fn fmt6(v: f64) -> String {
    let neg = v < 0.0;
    let mut a = v;
    if neg {
        a = 0.0 - v;
    }
    let scaled = (a * 1000000.0 + 0.5).floor() as i64;
    let whole = scaled / 1000000;
    let frac = scaled % 1000000;
    let mut out = format!("{}", whole);
    if frac > 0 {
        // six digits, then the trailing zeros dropped
        let mut f = frac;
        let mut width = 6;
        while f % 10 == 0 {
            f = f / 10;
            width -= 1;
        }
        let mut digits = format!("{}", f);
        while (digits.chars().count() as i64) < width {
            digits = format!("0{}", digits);
        }
        out = format!("{}.{}", out, digits);
    }
    if neg && scaled > 0 {
        out = format!("-{}", out);
    }
    out
}
