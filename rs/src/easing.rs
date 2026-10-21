//! Timing functions as storm/EVGEasing.rgr reads and evaluates them:
//! linear, ease, ease-in, ease-out, ease-in-out, cubic-bezier(),
//! step-start, step-end and steps(n, start|end).

use crate::num;

pub const CUBIC: i64 = 0;
pub const STEPS: i64 = 1;

#[derive(Clone)]
pub struct Easing {
    pub kind: i64,
    pub x1: f64,
    pub y1: f64,
    pub x2: f64,
    pub y2: f64,
    pub step_count: i64,
    pub jump_start: bool,
    /// false when the text was not a timing function (then it is linear)
    pub ok: bool,
}

fn clamp01(v: f64) -> f64 {
    if v < 0.0 {
        return 0.0;
    }
    if v > 1.0 {
        return 1.0;
    }
    v
}

/// The text inside `name(` … `)`, or "" when `t` is not that call.
pub fn args_of(t: &str, name: &str) -> String {
    let cs: Vec<char> = t.chars().collect();
    let nl = name.chars().count();
    let tl = cs.len();
    if tl < nl + 3 {
        return String::new();
    }
    let head: String = cs[0..nl].iter().collect();
    if head != name || cs[nl] != '(' || cs[tl - 1] != ')' {
        return String::new();
    }
    cs[nl + 1..tl - 1].iter().collect()
}

/// `s` split on `sep` outside parentheses; always at least one part.
pub fn split_top(s: &str, sep: char) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    let mut depth: i64 = 0;
    let mut current = String::new();
    for c in s.chars() {
        if c == '(' {
            depth += 1;
        }
        if c == ')' {
            depth -= 1;
        }
        if c == sep && depth == 0 {
            out.push(current);
            current = String::new();
        } else {
            current.push(c);
        }
    }
    out.push(current);
    out
}

/// The numbers of a comma list; parts that are not numbers are dropped.
fn numbers(s: &str) -> Vec<f64> {
    let mut out: Vec<f64> = Vec::new();
    for p in split_top(s, ',').iter() {
        match num::lead_number(p) {
            Some(v) => out.push(v),
            None => {}
        }
    }
    out
}

impl Easing {
    pub fn cubic(x1: f64, y1: f64, x2: f64, y2: f64) -> Easing {
        Easing {
            kind: CUBIC,
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            step_count: 1,
            jump_start: false,
            ok: true,
        }
    }

    pub fn linear() -> Easing {
        Easing::cubic(0.0, 0.0, 1.0, 1.0)
    }

    pub fn steps(count: i64, at_start: bool) -> Easing {
        let mut e = Easing::linear();
        e.kind = STEPS;
        e.step_count = count;
        if count < 1 {
            e.step_count = 1;
        }
        e.jump_start = at_start;
        e
    }

    fn bad() -> Easing {
        let mut e = Easing::linear();
        e.ok = false;
        e
    }

    pub fn parse(text: &str) -> Easing {
        let t = text.trim().to_string();
        if t.is_empty() || t == "linear" {
            return Easing::linear();
        }
        if t == "ease" {
            return Easing::cubic(0.25, 0.1, 0.25, 1.0);
        }
        if t == "ease-in" {
            return Easing::cubic(0.42, 0.0, 1.0, 1.0);
        }
        if t == "ease-out" {
            return Easing::cubic(0.0, 0.0, 0.58, 1.0);
        }
        if t == "ease-in-out" {
            return Easing::cubic(0.42, 0.0, 0.58, 1.0);
        }
        if t == "step-start" {
            return Easing::steps(1, true);
        }
        if t == "step-end" {
            return Easing::steps(1, false);
        }
        let args = args_of(&t, "cubic-bezier");
        if !args.is_empty() {
            let v = numbers(&args);
            if v.len() == 4 {
                // x must stay in 0..1 for the curve to be a function of time
                return Easing::cubic(clamp01(v[0]), v[1], clamp01(v[2]), v[3]);
            }
            return Easing::bad();
        }
        let sargs = args_of(&t, "steps");
        if !sargs.is_empty() {
            let parts = split_top(&sargs, ',');
            match num::lead_number(&parts[0]) {
                Some(n) => {
                    let mut at_start = false;
                    if parts.len() > 1 {
                        let word = parts[1].trim().to_string();
                        at_start = word == "start" || word == "jump-start";
                    }
                    return Easing::steps(n.floor() as i64, at_start);
                }
                None => {}
            }
        }
        Easing::bad()
    }

    /// Progress 0..1 at time 0..1 (clamped).
    pub fn ease(&self, t: f64) -> f64 {
        let x = clamp01(t);
        if self.kind == STEPS {
            return self.step_at(x);
        }
        if self.x1 == 0.0 && self.y1 == 0.0 && self.x2 == 1.0 && self.y2 == 1.0 {
            return x;
        }
        self.sample_y(self.solve_t(x))
    }

    pub fn step_at(&self, x: f64) -> f64 {
        let n = self.step_count as f64;
        let mut k = (x * n).floor();
        if self.jump_start {
            k += 1.0;
        }
        clamp01(k / n)
    }

    fn sample_x(&self, t: f64) -> f64 {
        let cx = 3.0 * self.x1;
        let bx = 3.0 * (self.x2 - self.x1) - cx;
        let a = 1.0 - cx - bx;
        ((a * t + bx) * t + cx) * t
    }

    fn sample_y(&self, t: f64) -> f64 {
        let cy = 3.0 * self.y1;
        let by = 3.0 * (self.y2 - self.y1) - cy;
        let a = 1.0 - cy - by;
        ((a * t + by) * t + cy) * t
    }

    fn slope_x(&self, t: f64) -> f64 {
        let cx = 3.0 * self.x1;
        let bx = 3.0 * (self.x2 - self.x1) - cx;
        let a = 1.0 - cx - bx;
        (3.0 * a * t + 2.0 * bx) * t + cx
    }

    /// The curve parameter whose x is `x`: Newton first, bisection when
    /// it stalls or leaves 0..1.
    fn solve_t(&self, x: f64) -> f64 {
        let mut t = x;
        let mut i = 0;
        while i < 8 {
            let err = self.sample_x(t) - x;
            if err.abs() < 0.0000001 {
                return t;
            }
            let d = self.slope_x(t);
            if d.abs() < 0.000001 {
                break;
            }
            t = t - err / d;
            if t < 0.0 || t > 1.0 {
                break;
            }
            i += 1;
        }
        let mut lo = 0.0;
        let mut hi = 1.0;
        let mut m = x;
        let mut j = 0;
        while j < 64 {
            let v = self.sample_x(m);
            if (v - x).abs() < 0.0000001 {
                return m;
            }
            if v < x {
                lo = m;
            } else {
                hi = m;
            }
            m = (lo + hi) / 2.0;
            j += 1;
        }
        m
    }
}
