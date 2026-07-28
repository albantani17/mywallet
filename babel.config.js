module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Inline the generated .sql migration files as strings so drizzle's
    // useMigrations() can read them at runtime.
    plugins: [["inline-import", { extensions: [".sql"] }]],
  };
};
