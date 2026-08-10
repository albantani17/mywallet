ALTER TABLE `categories` ADD `slug` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `is_built_in` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `sort_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `category_slug_idx` ON `categories` (`slug`);--> statement-breakpoint
ALTER TABLE `transactions` ADD `due_date` integer;