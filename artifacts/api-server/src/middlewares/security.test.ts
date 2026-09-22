import assert from "node:assert/strict";
import test from "node:test";
import {
  isCorsOriginAllowed,
  parseAllowedOrigins,
} from "./security.ts";

test("parseAllowedOrigins trims values and ignores empty entries", () => {
  assert.deepEqual(
    [...parseAllowedOrigins(" https://app.example.com, ,https://admin.example.com ")],
    ["https://app.example.com", "https://admin.example.com"],
  );
});

test("production only allows configured browser origins", () => {
  const env = {
    NODE_ENV: "production",
    ALLOWED_ORIGINS: "https://contractor-safety-passport.replit.app",
  };

  assert.equal(
    isCorsOriginAllowed("https://contractor-safety-passport.replit.app", env),
    true,
  );
  assert.equal(isCorsOriginAllowed("https://evil.example", env), false);
  assert.equal(isCorsOriginAllowed("https://preview.replit.dev", env), false);
});

test("requests without Origin remain available to native and server clients", () => {
  assert.equal(
    isCorsOriginAllowed(undefined, {
      NODE_ENV: "production",
      ALLOWED_ORIGINS: "",
    }),
    true,
  );
});

test("development allows localhost and replit.dev without substring bypasses", () => {
  const env = { NODE_ENV: "development", ALLOWED_ORIGINS: "" };

  assert.equal(isCorsOriginAllowed("http://localhost:5173", env), true);
  assert.equal(isCorsOriginAllowed("https://workspace.replit.dev", env), true);
  assert.equal(
    isCorsOriginAllowed("https://workspace.replit.dev.evil.example", env),
    false,
  );
  assert.equal(isCorsOriginAllowed("not-a-url.replit.dev", env), false);
});