// The strict-Rust EVG core printed line by line. cargo, rgrc for es6 / go /
// cpp, and StormParity.rgr with storm's .rgr classes must print the same
// (scripts/rs-parity.mjs). Numbers go through num::fmt6.
use evg::codepoint;
use evg::color::Color;
use evg::easing::Easing;
use evg::grapheme;
use evg::num::fmt6;
use evg::unit::Unit;

fn units() {
    let xs = vec![
        "100px", "50%", "2em", "1.5rem", "30hp", "10vw", "50vh", "12pt", "1in", "10mm", "2.54cm",
        "1pc", "fill", "auto", "fit-content", "", "10vmin", "4ch", "42", " 7 ", "-3.5px",
        "1e2px", "calc(1px)", "abc", "+5%", "1.2.3px", "px", "10 px", ".5em", "-.25rem",
    ];
    for x in xs.iter() {
        let mut u = Unit::parse(x);
        let head = format!(
            "unit [{}] {} set={} type={} px={}",
            x,
            u.to_text(),
            u.is_set,
            u.unit_type,
            fmt6(u.pixels)
        );
        u.set_context(16.0, 800.0, 600.0);
        u.resolve(200.0, 12.0);
        let a = fmt6(u.pixels);
        u.resolve_for_height(200.0, 100.0, 12.0);
        let b = fmt6(u.pixels);
        u.resolve_with_height(200.0, 100.0, 12.0);
        let c = fmt6(u.pixels);
        println!("{} resolve={} height={} width={}", head, a, b, c);
    }
}

fn colors() {
    let xs = vec![
        "#fff", "#FFFA", "#336699", "#33669980", "#12", "#ggg", "Red", "navy", "transparent",
        "none", "bogus", "", "rgb(10, 20, 30)", "rgb(10 20 30)", "rgba(10,20,30,0.5)",
        "rgb(1,2)", "hsl(120, 100%, 50%)", "hsl(0 0% 50%)", "hsla(200, 50%, 40%, 0.3)",
        "hsl(1,2)", "rgb(300,-5,12.4)", "hsl(330, 70%, 80%)", "hsl(-30, 40%, 60%)",
    ];
    for x in xs.iter() {
        let c = Color::parse(x);
        println!(
            "color [{}] set={} css={} hex={} pdf={} light={} dark={} half={}",
            x,
            c.is_set,
            c.to_css(),
            c.to_hex(),
            c.to_pdf(),
            c.lighten(0.2).to_css(),
            c.darken(0.5).to_hex(),
            c.with_alpha(0.25).to_css()
        );
    }
}

fn text_of(cps: &Vec<i64>) -> String {
    let mut s = String::new();
    for cp in cps.iter() {
        s.push_str(&codepoint::to_str(*cp));
    }
    s
}

fn graphemes() {
    let xs: Vec<Vec<i64>> = vec![
        vec![97, 98, 99],
        vec![101, 769, 120],
        vec![128077, 127997, 33],
        vec![128104, 8205, 128105, 8205, 128103],
        vec![127467, 127470, 127480, 127466, 127467],
        vec![97, 8205],
        vec![228, 45, 47, 8212, 32, 9],
        vec![9829, 65039, 917607, 917608],
    ];
    for cps in xs.iter() {
        let s = text_of(cps);
        let back = codepoint::to_array(&s);
        let mut b = String::new();
        for v in grapheme::boundaries(&back).iter() {
            b.push_str(&format!(" {}", v));
        }
        let mut flags = String::new();
        for cp in back.iter() {
            let mut f = "-";
            if codepoint::breaks_after(*cp) {
                f = "b";
            }
            if codepoint::is_space(*cp) {
                f = "s";
            }
            flags.push_str(f);
        }
        let first = grapheme::cluster_at(&s, 0);
        println!(
            "grapheme cps={} clusters={} at{} flags={} first={}",
            codepoint::count(&s),
            grapheme::cluster_count(&s),
            b,
            flags,
            codepoint::count(&first)
        );
    }
}

fn easings() {
    let xs = vec![
        "linear", "ease", "ease-in", "ease-out", "ease-in-out", "step-start", "step-end",
        "cubic-bezier(0.1, 0.7, 1.0, 0.1)", "cubic-bezier(-1, 2, 3, -1)", "cubic-bezier(1,2)",
        "steps(4)", "steps(3, start)", "steps(2, jump-start)", "steps(0)", "steps(2.7, end)",
        "bounce", "",
    ];
    let ts = vec![-0.5, 0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0, 1.5];
    for x in xs.iter() {
        let e = Easing::parse(x);
        let mut vs = String::new();
        for t in ts.iter() {
            vs.push_str(&format!(" {}", fmt6(e.ease(*t))));
        }
        println!(
            "easing [{}] ok={} kind={} n={} start={} at{}",
            x, e.ok, e.kind, e.step_count, e.jump_start, vs
        );
    }
}

fn main() {
    units();
    colors();
    graphemes();
    easings();
}
