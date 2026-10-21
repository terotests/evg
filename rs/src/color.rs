//! Colours as storm/EVGColor.rgr reads and writes them: #rgb, #rgba,
//! #rrggbb, #rrggbbaa, rgb(), rgba(), hsl() / hsla(), and a short list of
//! names. Channels are 0..255 doubles, alpha 0..1.
//!
//! A number that does not parse inside rgb() / hsl() is 0 here; storm's
//! `unwrap` of a failed `to_double` gives undefined (NaN) on JavaScript.

use crate::codepoint;
use crate::num;

#[derive(Clone)]
pub struct Color {
    pub r: f64,
    pub g: f64,
    pub b: f64,
    pub a: f64,
    /// false for "none", an empty string or a bad hex: nothing is painted
    pub is_set: bool,
}

fn hex_digit(c: char) -> i64 {
    match c.to_digit(16) {
        Some(d) => d as i64,
        None => 0,
    }
}

fn channel(c: f64) -> i64 {
    if c > 255.0 {
        return 255;
    }
    if c < 0.0 {
        return 0;
    }
    (c + 0.5).floor() as i64
}

fn hue6(p: f64, q: f64, t6_in: f64) -> f64 {
    let mut t6 = t6_in;
    while t6 < 0.0 {
        t6 += 6.0;
    }
    while t6 >= 6.0 {
        t6 -= 6.0;
    }
    if t6 < 1.0 {
        return p + (q - p) * t6;
    }
    if t6 < 3.0 {
        return q;
    }
    if t6 < 4.0 {
        return p + (q - p) * (4.0 - t6);
    }
    p
}

fn number(s: &str) -> f64 {
    match num::lead_number(s) {
        Some(v) => v,
        None => 0.0,
    }
}

/// The text between `start` and `end` split on commas and spaces, empty
/// parts dropped.
fn split_args(cs: &Vec<char>, start: usize, end: usize) -> Vec<String> {
    let mut parts: Vec<String> = Vec::new();
    let mut current = String::new();
    let mut i = start;
    while i < end {
        let c = cs[i];
        if c == ',' || c == ' ' {
            let p = current.trim().to_string();
            if !p.is_empty() {
                parts.push(p);
            }
            current = String::new();
        } else {
            current.push(c);
        }
        i += 1;
    }
    let p = current.trim().to_string();
    if !p.is_empty() {
        parts.push(p);
    }
    parts
}

/// After the last '(' up to the last ')' (the end when there is none).
fn args_of(s: &str) -> Vec<String> {
    let cs: Vec<char> = s.chars().collect();
    let n = cs.len();
    let mut start: usize = 0;
    let mut end: usize = n - 1;
    let mut i: usize = 0;
    while i < n {
        if cs[i] == '(' {
            start = i + 1;
        }
        if cs[i] == ')' {
            end = i;
        }
        i += 1;
    }
    if end < start {
        return Vec::new();
    }
    split_args(&cs, start, end)
}

impl Color {
    pub fn create(r: f64, g: f64, b: f64, a: f64) -> Color {
        Color { r: r, g: g, b: b, a: a, is_set: true }
    }

    pub fn rgb(r: i64, g: i64, b: i64) -> Color {
        Color::create(r as f64, g as f64, b as f64, 1.0)
    }

    pub fn rgba(r: i64, g: i64, b: i64, a: f64) -> Color {
        Color::create(r as f64, g as f64, b as f64, a)
    }

    pub fn none() -> Color {
        Color { r: 0.0, g: 0.0, b: 0.0, a: 1.0, is_set: false }
    }

    pub fn black() -> Color {
        Color::rgb(0, 0, 0)
    }

    pub fn white() -> Color {
        Color::rgb(255, 255, 255)
    }

    pub fn transparent() -> Color {
        Color::rgba(0, 0, 0, 0.0)
    }

    pub fn parse(text: &str) -> Color {
        let s = text.trim().to_string();
        if s.is_empty() {
            return Color::none();
        }
        if s.starts_with("#") {
            return Color::parse_hex(&s);
        }
        if s.starts_with("rgba") {
            return Color::parse_rgba(&s);
        }
        if s.starts_with("rgb") && s.chars().count() >= 4 {
            return Color::parse_rgb(&s);
        }
        if s.starts_with("hsl") && s.chars().count() >= 4 {
            return Color::parse_hsl(&s);
        }
        Color::parse_named(&s)
    }

    /// 3, 4, 6 or 8 hex digits, with or without '#'; a bad digit reads 0,
    /// any other length is unset.
    pub fn parse_hex(text: &str) -> Color {
        let mut cs: Vec<char> = text.chars().collect();
        if !cs.is_empty() && cs[0] == '#' {
            cs.remove(0);
        }
        let n = cs.len();
        let mut d: Vec<i64> = Vec::new();
        for c in cs.iter() {
            d.push(hex_digit(*c));
        }
        if n == 3 || n == 4 {
            let mut c = Color::create(
                (d[0] * 17) as f64,
                (d[1] * 17) as f64,
                (d[2] * 17) as f64,
                1.0,
            );
            if n == 4 {
                c.a = ((d[3] * 17) as f64) / 255.0;
            }
            return c;
        }
        if n == 6 || n == 8 {
            let mut c = Color::create(
                (d[0] * 16 + d[1]) as f64,
                (d[2] * 16 + d[3]) as f64,
                (d[4] * 16 + d[5]) as f64,
                1.0,
            );
            if n == 8 {
                c.a = ((d[6] * 16 + d[7]) as f64) / 255.0;
            }
            return c;
        }
        Color::none()
    }

    /// rgb(r g b) or rgb(r, g, b). Fewer than three numbers leave opaque
    /// black, as storm does.
    pub fn parse_rgb(text: &str) -> Color {
        let cs: Vec<char> = text.chars().collect();
        let n = cs.len();
        // after the last '(' up to the FIRST ')'
        let mut start: usize = 0;
        let mut end: usize = n - 1;
        let mut i: usize = 0;
        while i < n {
            if cs[i] == '(' {
                start = i + 1;
            }
            i += 1;
        }
        let mut k: usize = n;
        while k > 0 {
            k -= 1;
            if cs[k] == ')' {
                end = k;
            }
        }
        let mut c = Color::black();
        if end < start {
            return c;
        }
        let parts = split_args(&cs, start, end);
        if parts.len() >= 3 {
            c.r = number(&parts[0]);
            c.g = number(&parts[1]);
            c.b = number(&parts[2]);
        }
        c
    }

    pub fn parse_rgba(text: &str) -> Color {
        let mut c = Color::parse_rgb(text);
        let parts = args_of(text);
        if parts.len() >= 4 {
            c.r = number(&parts[0]);
            c.g = number(&parts[1]);
            c.b = number(&parts[2]);
            c.a = number(&parts[3]);
        }
        c
    }

    /// hsl(h s% l%) with an optional fourth alpha; unset when fewer than three.
    pub fn parse_hsl(text: &str) -> Color {
        let parts = args_of(text);
        if parts.len() < 3 {
            return Color::none();
        }
        let mut c = Color::from_hsl(number(&parts[0]), number(&parts[1]), number(&parts[2]));
        if parts.len() >= 4 {
            c.a = number(&parts[3]);
        }
        c
    }

    /// Hue in degrees, saturation and lightness in percent.
    pub fn from_hsl(h: f64, s: f64, l: f64) -> Color {
        let sn = s / 100.0;
        let ln = l / 100.0;
        if sn == 0.0 {
            let gray = ln * 255.0;
            return Color::create(gray, gray, gray, 1.0);
        }
        let mut q = ln + sn - ln * sn;
        if ln < 0.5 {
            q = ln * (1.0 + sn);
        }
        let p = 2.0 * ln - q;
        let h6 = h / 60.0;
        Color::create(
            hue6(p, q, h6 + 2.0) * 255.0,
            hue6(p, q, h6) * 255.0,
            hue6(p, q, h6 - 2.0) * 255.0,
            1.0,
        )
    }

    /// The names storm knows, any case; anything else is unset.
    pub fn parse_named(name: &str) -> Color {
        let mut n = String::new();
        for c in name.chars() {
            let k = c as i64;
            if k >= 65 && k <= 90 {
                n.push_str(&codepoint::to_str(k + 32));
            } else {
                n.push(c);
            }
        }
        let names = vec![
            "black", "white", "red", "green", "blue", "yellow", "cyan", "magenta", "gray", "grey",
            "orange", "purple", "pink", "brown", "navy", "teal", "olive", "maroon", "silver",
            "lime", "aqua", "fuchsia",
        ];
        let values: Vec<i64> = vec![
            0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 128, 0, 0, 0, 255, 255, 255, 0, 0, 255, 255, 255,
            0, 255, 128, 128, 128, 128, 128, 128, 255, 165, 0, 128, 0, 128, 255, 192, 203, 165, 42,
            42, 0, 0, 128, 0, 128, 128, 128, 128, 0, 128, 0, 0, 192, 192, 192, 0, 255, 0, 0, 255,
            255, 255, 0, 255,
        ];
        let mut i: usize = 0;
        while i < names.len() {
            if n == names[i] {
                return Color::rgb(values[i * 3], values[i * 3 + 1], values[i * 3 + 2]);
            }
            i += 1;
        }
        if n == "transparent" {
            return Color::transparent();
        }
        Color::none()
    }

    pub fn red(&self) -> i64 {
        channel(self.r)
    }

    pub fn green(&self) -> i64 {
        channel(self.g)
    }

    pub fn blue(&self) -> i64 {
        channel(self.b)
    }

    pub fn alpha(&self) -> f64 {
        if self.a < 0.0 {
            return 0.0;
        }
        if self.a > 1.0 {
            return 1.0;
        }
        self.a
    }

    /// "rgb(r,g,b)", "rgba(r,g,b,a)" below full alpha, or "none".
    pub fn to_css(&self) -> String {
        if !self.is_set {
            return "none".to_string();
        }
        if self.a < 1.0 {
            return format!(
                "rgba({},{},{},{})",
                self.red(),
                self.green(),
                self.blue(),
                num::fmt6(self.alpha())
            );
        }
        format!("rgb({},{},{})", self.red(), self.green(), self.blue())
    }

    /// "#RRGGBB" (alpha left out), or "none".
    pub fn to_hex(&self) -> String {
        if !self.is_set {
            return "none".to_string();
        }
        let digits: Vec<char> = "0123456789ABCDEF".chars().collect();
        let mut out = "#".to_string();
        let cs = vec![self.red(), self.green(), self.blue()];
        for v in cs.iter() {
            out.push(digits[(*v / 16) as usize]);
            out.push(digits[(*v % 16) as usize]);
        }
        out
    }

    /// "r g b" in 0..1 for a PDF operator, or "" when unset.
    pub fn to_pdf(&self) -> String {
        if !self.is_set {
            return String::new();
        }
        format!(
            "{} {} {}",
            num::fmt6(self.r / 255.0),
            num::fmt6(self.g / 255.0),
            num::fmt6(self.b / 255.0)
        )
    }

    pub fn with_alpha(&self, a: f64) -> Color {
        Color::create(self.r, self.g, self.b, a)
    }

    pub fn lighten(&self, amount: f64) -> Color {
        Color::create(
            self.r + (255.0 - self.r) * amount,
            self.g + (255.0 - self.g) * amount,
            self.b + (255.0 - self.b) * amount,
            self.a,
        )
    }

    pub fn darken(&self, amount: f64) -> Color {
        Color::create(
            self.r * (1.0 - amount),
            self.g * (1.0 - amount),
            self.b * (1.0 - amount),
            self.a,
        )
    }
}
