// SPDX-License-Identifier: MIT
//
// Just enough JSON to read an EVG display list (`EVGDisplayList.toJson`):
// numbers, strings, arrays, objects, true/false/null. No allocation tricks;
// a list is tens of kilobytes a frame.

#pragma once
#include <cstdlib>
#include <map>
#include <string>
#include <vector>

namespace evg {
namespace json {

struct Value {
  enum Type { Null, Bool, Num, Str, Arr, Obj } type = Null;
  double num = 0;
  bool b = false;
  std::string str;
  std::vector<Value> arr;
  std::map<std::string, Value> obj;

  const Value* get(const char* k) const {
    if (type != Obj) return nullptr;
    auto it = obj.find(k);
    return it == obj.end() ? nullptr : &it->second;
  }
  double numOr(const char* k, double d) const {
    const Value* v = get(k);
    return (v && v->type == Num) ? v->num : d;
  }
  std::string strOr(const char* k, const std::string& d) const {
    const Value* v = get(k);
    return (v && v->type == Str) ? v->str : d;
  }
};

class Parser {
 public:
  explicit Parser(const std::string& s) : s_(s) {}
  bool parse(Value& out) {
    i_ = 0;
    return value(out);
  }

 private:
  const std::string& s_;
  size_t i_ = 0;

  void ws() {
    while (i_ < s_.size() && (s_[i_] == ' ' || s_[i_] == '\n' || s_[i_] == '\r' || s_[i_] == '\t')) i_++;
  }
  bool value(Value& v) {
    ws();
    if (i_ >= s_.size()) return false;
    char c = s_[i_];
    if (c == '{') return object(v);
    if (c == '[') return array(v);
    if (c == '"') { v.type = Value::Str; return string(v.str); }
    if (c == 't' && s_.compare(i_, 4, "true") == 0) { v.type = Value::Bool; v.b = true; i_ += 4; return true; }
    if (c == 'f' && s_.compare(i_, 5, "false") == 0) { v.type = Value::Bool; v.b = false; i_ += 5; return true; }
    if (c == 'n' && s_.compare(i_, 4, "null") == 0) { v.type = Value::Null; i_ += 4; return true; }
    const char* start = s_.c_str() + i_;
    char* end = nullptr;
    v.num = std::strtod(start, &end);
    if (end == start) return false;
    v.type = Value::Num;
    i_ += (size_t)(end - start);
    return true;
  }
  static void utf8(std::string& out, unsigned cp) {
    if (cp < 0x80) out += (char)cp;
    else if (cp < 0x800) { out += (char)(0xC0 | (cp >> 6)); out += (char)(0x80 | (cp & 0x3F)); }
    else if (cp < 0x10000) { out += (char)(0xE0 | (cp >> 12)); out += (char)(0x80 | ((cp >> 6) & 0x3F)); out += (char)(0x80 | (cp & 0x3F)); }
    else { out += (char)(0xF0 | (cp >> 18)); out += (char)(0x80 | ((cp >> 12) & 0x3F)); out += (char)(0x80 | ((cp >> 6) & 0x3F)); out += (char)(0x80 | (cp & 0x3F)); }
  }
  bool string(std::string& out) {
    i_++;  // opening quote
    while (i_ < s_.size()) {
      char c = s_[i_++];
      if (c == '"') return true;
      if (c != '\\') { out += c; continue; }
      if (i_ >= s_.size()) return false;
      char e = s_[i_++];
      switch (e) {
        case 'n': out += '\n'; break;
        case 't': out += '\t'; break;
        case 'r': out += '\r'; break;
        case 'b': out += '\b'; break;
        case 'f': out += '\f'; break;
        case 'u': {
          if (i_ + 4 > s_.size()) return false;
          unsigned cp = (unsigned)std::strtoul(s_.substr(i_, 4).c_str(), nullptr, 16);
          i_ += 4;
          if (cp >= 0xD800 && cp < 0xDC00 && i_ + 6 <= s_.size() && s_[i_] == '\\' && s_[i_ + 1] == 'u') {
            unsigned lo = (unsigned)std::strtoul(s_.substr(i_ + 2, 4).c_str(), nullptr, 16);
            i_ += 6;
            cp = 0x10000 + ((cp - 0xD800) << 10) + (lo - 0xDC00);
          }
          utf8(out, cp);
          break;
        }
        default: out += e;
      }
    }
    return false;
  }
  bool array(Value& v) {
    v.type = Value::Arr;
    i_++;
    ws();
    if (i_ < s_.size() && s_[i_] == ']') { i_++; return true; }
    while (true) {
      v.arr.emplace_back();
      if (!value(v.arr.back())) return false;
      ws();
      if (i_ >= s_.size()) return false;
      if (s_[i_] == ',') { i_++; continue; }
      if (s_[i_] == ']') { i_++; return true; }
      return false;
    }
  }
  bool object(Value& v) {
    v.type = Value::Obj;
    i_++;
    ws();
    if (i_ < s_.size() && s_[i_] == '}') { i_++; return true; }
    while (true) {
      ws();
      if (i_ >= s_.size() || s_[i_] != '"') return false;
      std::string key;
      if (!string(key)) return false;
      ws();
      if (i_ >= s_.size() || s_[i_] != ':') return false;
      i_++;
      if (!value(v.obj[key])) return false;
      ws();
      if (i_ >= s_.size()) return false;
      if (s_[i_] == ',') { i_++; continue; }
      if (s_[i_] == '}') { i_++; return true; }
      return false;
    }
  }
};

}  // namespace json
}  // namespace evg
