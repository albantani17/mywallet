CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`auth_provider` text DEFAULT 'guest' NOT NULL,
	`email` text,
	`avatar_url` text,
	`locale` text DEFAULT 'id' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "single_user_row" CHECK("users"."id" = 1)
);
