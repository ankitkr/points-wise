CREATE TABLE `households` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`tier` text NOT NULL,
	`tier_synced_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `households_owner_unq` ON `households` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_household_user_unq` ON `memberships` (`household_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_active_user_unq` ON `memberships` (`user_id`) WHERE "memberships"."status" = 'active';--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text NOT NULL,
	`email` text,
	`email_verified` integer,
	`display_name` text,
	`avatar_url` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_discord_id_unq` ON `users` (`discord_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unq` ON `users` (`email`) WHERE "users"."email" is not null;