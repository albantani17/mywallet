module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Inline .sql migration files as strings so drizzle's useMigrations() can read them
    plugins: [["inline-import", { extensions: [".sql"] }]],
  };
};
