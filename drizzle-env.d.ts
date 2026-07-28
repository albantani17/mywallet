// Lets TypeScript resolve the .sql migration files bundled by Metro
// (see metro.config.js: config.resolver.sourceExts.push("sql")).
declare module "*.sql" {
  const content: string;
  export default content;
}
