use wasm_bindgen::prelude::*;
use pest::Parser;
use pest_derive::Parser;

#[derive(Parser)]
#[grammar = "klang.pest"] // Path to your Pest grammar file
struct KlangParser;

// Expose this function to JavaScript using `wasm_bindgen`
#[wasm_bindgen]
pub fn parse_code(code: &str) -> String {
    match KlangParser::parse(Rule::program, code) {
        Ok(parsed) => format!("{:#?}", parsed),
        Err(e) => format!("Error parsing code: {}", e),
    }
}
