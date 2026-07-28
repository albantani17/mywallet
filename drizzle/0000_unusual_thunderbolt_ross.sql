CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`parent_id` integer,
	`icon` text,
	`color` text,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `category_parent_idx` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE TABLE `debts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`direction` text NOT NULL,
	`counterparty` text NOT NULL,
	`principal` integer NOT NULL,
	`wallet_id` integer,
	`due_date` integer,
	`status` text DEFAULT 'ongoing' NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_principal" CHECK("debts"."principal" > 0)
);
--> statement-breakpoint
CREATE INDEX `debt_status_idx` ON `debts` (`status`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`wallet_id` integer NOT NULL,
	`to_wallet_id` integer,
	`category_id` integer,
	`debt_id` integer,
	`fee` integer DEFAULT 0 NOT NULL,
	`note` text,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_amount" CHECK("transactions"."amount" > 0),
	CONSTRAINT "non_negative_fee" CHECK("transactions"."fee" >= 0),
	CONSTRAINT "no_self_transfer" CHECK("transactions"."to_wallet_id" IS NULL OR "transactions"."wallet_id" != "transactions"."to_wallet_id"),
	CONSTRAINT "transfer_shape" CHECK(("transactions"."type" = 'transfer' AND "transactions"."to_wallet_id" IS NOT NULL AND "transactions"."category_id" IS NULL)
        OR ("transactions"."type" != 'transfer' AND "transactions"."to_wallet_id" IS NULL))
);
--> statement-breakpoint
CREATE INDEX `tx_wallet_idx` ON `transactions` (`wallet_id`);--> statement-breakpoint
CREATE INDEX `tx_to_wallet_idx` ON `transactions` (`to_wallet_id`);--> statement-breakpoint
CREATE INDEX `tx_date_idx` ON `transactions` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `tx_debt_idx` ON `transactions` (`debt_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`auth_provider` text DEFAULT 'guest' NOT NULL,
	`email` text,
	`avatar_url` text,
	`locale` text DEFAULT 'id' NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "single_user_row" CHECK("users"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`initial_balance` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`icon` text,
	`color` text,
	`is_archived` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
