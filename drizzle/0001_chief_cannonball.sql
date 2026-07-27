CREATE TABLE `kb_banks` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`beancount_name` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kb_cards` (
	`slug` text PRIMARY KEY NOT NULL,
	`bank_slug` text NOT NULL,
	`name` text NOT NULL,
	`beancount_name` text NOT NULL,
	`network` text,
	`pool_ticker` text NOT NULL,
	`pool_programme` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bank_slug`) REFERENCES `kb_banks`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kb_categories` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`root` text NOT NULL,
	`leaf` text,
	`account` text NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kb_earn_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`card_slug` text NOT NULL,
	`effective_from` text NOT NULL,
	`rule_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`card_slug`) REFERENCES `kb_cards`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `kb_earn_rules_card_from_unq` ON `kb_earn_rules` (`card_slug`,`effective_from`);--> statement-breakpoint
CREATE TABLE `kb_proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`target_slug` text,
	`payload_json` text NOT NULL,
	`note` text,
	`submitted_by` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `users` ADD `is_admin` integer DEFAULT 0 NOT NULL;