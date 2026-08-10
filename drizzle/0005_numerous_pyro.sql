CREATE TABLE `counterparties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`preset_key` text,
	`contact` text,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `counterparty_kind_idx` ON `counterparties` (`kind`);--> statement-breakpoint
CREATE TABLE `debt_presets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'institution' NOT NULL,
	`direction` text DEFAULT 'payable' NOT NULL,
	`schedule_type` text NOT NULL,
	`interval_unit` text,
	`interval_count` integer,
	`period_count` integer,
	`interest_rate_bps` integer DEFAULT 0 NOT NULL,
	`interest_method` text DEFAULT 'none' NOT NULL,
	`due_day` integer,
	`grace_days` integer DEFAULT 0 NOT NULL,
	`reminder_days` integer DEFAULT 3 NOT NULL,
	`rounding_unit` integer DEFAULT 1000 NOT NULL,
	`icon` text,
	`color` text,
	`is_built_in` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `debt_preset_slug_idx` ON `debt_presets` (`slug`);--> statement-breakpoint
CREATE TABLE `debt_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`debt_id` integer NOT NULL,
	`schedule_type` text NOT NULL,
	`anchor_date` integer,
	`due_day` integer,
	`interval_unit` text,
	`interval_count` integer,
	`period_count` integer,
	`grace_days` integer DEFAULT 0 NOT NULL,
	`reminder_days` integer DEFAULT 3 NOT NULL,
	`rounding_unit` integer DEFAULT 1000 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "valid_due_day" CHECK("debt_schedules"."due_day" IS NULL OR ("debt_schedules"."due_day" BETWEEN 1 AND 31)),
	CONSTRAINT "positive_rounding_unit" CHECK("debt_schedules"."rounding_unit" >= 1),
	CONSTRAINT "recurring_shape" CHECK("debt_schedules"."schedule_type" != 'recurring'
        OR ("debt_schedules"."anchor_date" IS NOT NULL AND "debt_schedules"."interval_unit" IS NOT NULL
            AND "debt_schedules"."interval_count" >= 1 AND "debt_schedules"."period_count" >= 1)),
	CONSTRAINT "single_shape" CHECK("debt_schedules"."schedule_type" != 'single' OR "debt_schedules"."anchor_date" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `debt_schedule_debt_idx` ON `debt_schedules` (`debt_id`);--> statement-breakpoint
CREATE TABLE `installments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`debt_id` integer NOT NULL,
	`sequence` integer NOT NULL,
	`due_date` integer,
	`original_due_date` integer,
	`principal_amount` integer DEFAULT 0 NOT NULL,
	`interest_amount` integer DEFAULT 0 NOT NULL,
	`fee_amount` integer DEFAULT 0 NOT NULL,
	`penalty_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer NOT NULL,
	`is_modified` integer DEFAULT false NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "positive_sequence" CHECK("installments"."sequence" >= 1),
	CONSTRAINT "non_negative_installment_total" CHECK("installments"."total_amount" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `installment_debt_sequence_idx` ON `installments` (`debt_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `installment_due_idx` ON `installments` (`due_date`);--> statement-breakpoint
CREATE TABLE `payment_allocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payment_id` integer NOT NULL,
	`installment_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`installment_id`) REFERENCES `installments`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "positive_allocation_amount" CHECK("payment_allocations"."amount" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_allocation_pair_idx` ON `payment_allocations` (`payment_id`,`installment_id`);--> statement-breakpoint
CREATE INDEX `payment_allocation_installment_idx` ON `payment_allocations` (`installment_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`debt_id` integer NOT NULL,
	`wallet_id` integer,
	`transaction_id` integer,
	`paid_at` integer NOT NULL,
	`amount` integer NOT NULL,
	`method` text,
	`reference` text,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "positive_payment_amount" CHECK("payments"."amount" > 0)
);
--> statement-breakpoint
CREATE INDEX `payment_debt_idx` ON `payments` (`debt_id`,`paid_at`);--> statement-breakpoint
CREATE INDEX `payment_transaction_idx` ON `payments` (`transaction_id`);--> statement-breakpoint
UPDATE `transactions` SET `debt_id` = NULL;--> statement-breakpoint
DELETE FROM `debts`;--> statement-breakpoint
DROP TABLE `debts`;--> statement-breakpoint
CREATE TABLE `debts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`counterparty_id` integer NOT NULL,
	`wallet_id` integer,
	`direction` text NOT NULL,
	`title` text NOT NULL,
	`principal` integer NOT NULL,
	`interest_rate_bps` integer DEFAULT 0 NOT NULL,
	`interest_method` text DEFAULT 'none' NOT NULL,
	`origin_date` integer NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`closed_at` integer,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`counterparty_id`) REFERENCES `counterparties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_principal" CHECK("debts"."principal" > 0),
	CONSTRAINT "non_negative_interest_rate" CHECK("debts"."interest_rate_bps" >= 0)
);
--> statement-breakpoint
CREATE INDEX `debt_status_idx` ON `debts` (`status`);--> statement-breakpoint
CREATE INDEX `debt_direction_status_idx` ON `debts` (`direction`,`status`);--> statement-breakpoint
CREATE INDEX `debt_counterparty_idx` ON `debts` (`counterparty_id`);