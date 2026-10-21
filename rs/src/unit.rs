//! Lengths as storm/EVGUnit.rgr reads and resolves them: px, %, em, rem,
//! hp (percent of the parent height), vw / vh, fill, and the print units
//! pt / pc / in / mm / cm folded into px when parsed.
//!
//! A Unit is a value: storm hands out one shared unset unit to save memory
//! and forbids writing to it; here an unset unit is just `Unit::unset()`
//! and every field owns its copy, so that rule is not needed.
//!
//! Not supported, as in storm: vmin / vmax, ch / ex, calc(). An unknown
//! suffix leaves the unit unset (auto), never a bare number of pixels.

use crate::num;

pub const PIXELS: i64 = 0;
pub const PERCENT: i64 = 1;
pub const EM: i64 = 2;
pub const HEIGHT_PERCENT: i64 = 3;
pub const FILL: i64 = 4;
pub const REM: i64 = 5;
pub const FIT_CONTENT: i64 = 6;
pub const VIEWPORT_WIDTH: i64 = 7;
pub const VIEWPORT_HEIGHT: i64 = 8;

#[derive(Clone)]
pub struct Unit {
    pub value: f64,
    pub unit_type: i64,
    pub is_set: bool,
    pub pixels: f64,
    /// What `rem` resolves against; set by `set_context`.
    pub root_font_size: f64,
    /// What `vw` / `vh` resolve against: the layout's page size (on paper
    /// the page area). Zero when nobody said, and a viewport length is 0.
    pub viewport_w: f64,
    pub viewport_h: f64,
}

/// Digits, dots and a leading sign only, with at least one digit: what may
/// stand before a suffix. "10vmin" ends in "in", but "10vm" is not a number.
pub fn is_numeric(s: &str) -> bool {
    let mut digits: i64 = 0;
    let mut i: i64 = 0;
    for c in s.chars() {
        if c.is_ascii_digit() {
            digits += 1;
        } else if c == '.' {
        } else if c == '+' || c == '-' {
            if i > 0 {
                return false;
            }
        } else {
            return false;
        }
        i += 1;
    }
    digits > 0
}

/// CSS absolute units against the reference pixel (1in = 96px); 0 for any
/// other suffix.
pub fn px_per_unit(suffix: &str) -> f64 {
    if suffix == "pt" {
        return 96.0 / 72.0;
    }
    if suffix == "pc" {
        return 16.0;
    }
    if suffix == "in" {
        return 96.0;
    }
    if suffix == "mm" {
        return 96.0 / 25.4;
    }
    if suffix == "cm" {
        return 96.0 / 2.54;
    }
    0.0
}

impl Unit {
    pub fn unset() -> Unit {
        Unit {
            value: 0.0,
            unit_type: PIXELS,
            is_set: false,
            pixels: 0.0,
            root_font_size: 14.0,
            viewport_w: 0.0,
            viewport_h: 0.0,
        }
    }

    pub fn create(value: f64, unit_type: i64) -> Unit {
        let mut u = Unit::unset();
        u.value = value;
        u.unit_type = unit_type;
        u.is_set = true;
        u
    }

    /// Pixels are already pixels: `pixels` is filled in at once.
    pub fn px(value: f64) -> Unit {
        let mut u = Unit::create(value, PIXELS);
        u.pixels = value;
        u
    }

    pub fn percent(value: f64) -> Unit {
        Unit::create(value, PERCENT)
    }

    pub fn em(value: f64) -> Unit {
        Unit::create(value, EM)
    }

    pub fn rem(value: f64) -> Unit {
        Unit::create(value, REM)
    }

    pub fn height_percent(value: f64) -> Unit {
        Unit::create(value, HEIGHT_PERCENT)
    }

    pub fn fill() -> Unit {
        Unit::create(100.0, FILL)
    }

    /// "100px", "50%", "2em", "1.5rem", "30hp", "10vw", "12pt", "fill",
    /// "auto", "fit-content", or a bare number of pixels.
    pub fn parse(text: &str) -> Unit {
        let mut u = Unit::unset();
        let t: Vec<char> = text.trim().chars().collect();
        let n = t.len();
        if n == 0 {
            return u;
        }
        let s: String = t.iter().collect();
        if s == "fill" {
            return Unit::fill();
        }
        if s == "auto" {
            return u;
        }
        // as wide as what it holds; unset, the layout reads the type
        if s == "fit-content" {
            u.unit_type = FIT_CONTENT;
            return u;
        }
        let last = t[n - 1];
        if last == '%' {
            let head: String = t[0..n - 1].iter().collect();
            return Unit::suffixed(&head, PERCENT, 1.0);
        }
        // "rem" before "em", or "2rem" reads as "2r" + "em"
        if n >= 3 {
            let suffix3: String = t[n - 3..n].iter().collect();
            if suffix3 == "rem" {
                let head: String = t[0..n - 3].iter().collect();
                return Unit::suffixed(&head, REM, 1.0);
            }
        }
        if n >= 2 {
            let suffix: String = t[n - 2..n].iter().collect();
            let head: String = t[0..n - 2].iter().collect();
            let per = px_per_unit(&suffix);
            if per > 0.0 {
                return Unit::suffixed(&head, PIXELS, per);
            }
            if suffix == "em" {
                return Unit::suffixed(&head, EM, 1.0);
            }
            if suffix == "px" {
                return Unit::suffixed(&head, PIXELS, 1.0);
            }
            if suffix == "hp" {
                return Unit::suffixed(&head, HEIGHT_PERCENT, 1.0);
            }
            if suffix == "vw" {
                return Unit::suffixed(&head, VIEWPORT_WIDTH, 1.0);
            }
            if suffix == "vh" {
                return Unit::suffixed(&head, VIEWPORT_HEIGHT, 1.0);
            }
        }
        // a bare number only: an unknown suffix ("4ch") stays unset
        if last.is_ascii_alphabetic() || last == ')' {
            return u;
        }
        match num::lead_number(&s) {
            Some(v) => Unit::px(v),
            None => u,
        }
    }

    /// The number before a known suffix, times `scale`; unset when it is
    /// not a number.
    fn suffixed(head: &str, unit_type: i64, scale: f64) -> Unit {
        if !is_numeric(head) {
            return Unit::unset();
        }
        match num::lead_number(head) {
            Some(v) => {
                let mut u = Unit::create(v * scale, unit_type);
                if unit_type == PIXELS {
                    u.pixels = u.value;
                }
                u
            }
            None => Unit::unset(),
        }
    }

    /// The root font size for `rem` and the viewport for `vw` / `vh`.
    pub fn set_context(&mut self, root_font_size: f64, vw: f64, vh: f64) {
        if !self.is_set {
            return;
        }
        self.root_font_size = root_font_size;
        self.viewport_w = vw;
        self.viewport_h = vh;
    }

    /// `pixels` from the parent's size and the font size.
    pub fn resolve(&mut self, parent_size: f64, font_size: f64) {
        if !self.is_set {
            self.pixels = 0.0;
            return;
        }
        let t = self.unit_type;
        if t == PIXELS {
            self.pixels = self.value;
        } else if t == PERCENT || t == HEIGHT_PERCENT {
            self.pixels = parent_size * self.value / 100.0;
        } else if t == EM {
            self.pixels = font_size * self.value;
        } else if t == REM {
            self.pixels = self.root_font_size * self.value;
        } else if t == VIEWPORT_WIDTH {
            self.pixels = self.viewport_w * self.value / 100.0;
        } else if t == VIEWPORT_HEIGHT {
            self.pixels = self.viewport_h * self.value / 100.0;
        } else if t == FILL {
            self.pixels = parent_size;
        } else {
            self.pixels = self.value;
        }
    }

    /// For a height: % and hp are of the parent's height.
    pub fn resolve_for_height(&mut self, parent_w: f64, parent_h: f64, font_size: f64) {
        if !self.is_set {
            self.pixels = 0.0;
            return;
        }
        if self.unit_type == HEIGHT_PERCENT || self.unit_type == PERCENT {
            self.pixels = parent_h * self.value / 100.0;
            return;
        }
        self.resolve(parent_w, font_size);
    }

    /// For a width: hp is of the parent's height, the rest as `resolve`.
    pub fn resolve_with_height(&mut self, parent_w: f64, parent_h: f64, font_size: f64) {
        if !self.is_set {
            self.pixels = 0.0;
            return;
        }
        if self.unit_type == HEIGHT_PERCENT {
            self.pixels = parent_h * self.value / 100.0;
            return;
        }
        self.resolve(parent_w, font_size);
    }

    pub fn is_pixels(&self) -> bool {
        self.unit_type == PIXELS
    }

    pub fn is_percent(&self) -> bool {
        self.unit_type == PERCENT
    }

    pub fn is_fill(&self) -> bool {
        self.unit_type == FILL
    }

    pub fn is_viewport(&self) -> bool {
        self.unit_type == VIEWPORT_WIDTH || self.unit_type == VIEWPORT_HEIGHT
    }

    /// "12px", "50%", "fill", "unset". Numbers through `num::fmt6`, so every
    /// target writes the same text (storm's to_string differs per target).
    pub fn to_text(&self) -> String {
        if !self.is_set {
            return "unset".to_string();
        }
        let v = num::fmt6(self.value);
        let t = self.unit_type;
        if t == PIXELS {
            return format!("{}px", v);
        }
        if t == PERCENT {
            return format!("{}%", v);
        }
        if t == EM {
            return format!("{}em", v);
        }
        if t == HEIGHT_PERCENT {
            return format!("{}hp", v);
        }
        if t == FILL {
            return "fill".to_string();
        }
        if t == REM {
            return format!("{}rem", v);
        }
        if t == VIEWPORT_WIDTH {
            return format!("{}vw", v);
        }
        if t == VIEWPORT_HEIGHT {
            return format!("{}vh", v);
        }
        v
    }
}
