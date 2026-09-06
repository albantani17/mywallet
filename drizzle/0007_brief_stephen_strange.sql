CREATE TABLE `quick_entry_aliases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phrase` text NOT NULL,
	`kind` text NOT NULL,
	`target_id` integer NOT NULL,
	`hits` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`last_used_at` integer NOT NULL,
	CONSTRAINT "non_empty_phrase" CHECK(length("quick_entry_aliases"."phrase") > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quick_entry_alias_phrase_idx` ON `quick_entry_aliases` (`phrase`);--> statement-breakpoint
CREATE INDEX `quick_entry_alias_kind_idx` ON `quick_entry_aliases` (`kind`);