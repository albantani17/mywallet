CREATE TABLE `wallet_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`is_built_in` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wallet_category_slug_idx` ON `wallet_categories` (`slug`);