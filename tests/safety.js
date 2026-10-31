const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
if (
  process.env.NODE_ENV !== "test" ||
  !/^ellis_test(?:_|$)/.test(url.pathname.slice(1)) ||
  process.env.ELLIS_TEST_DATABASE !== "disposable"
) {
  throw new Error(
    "Tests require NODE_ENV=test, ELLIS_TEST_DATABASE=disposable and a dedicated ellis_test database. Refusing the user development database.",
  );
}
