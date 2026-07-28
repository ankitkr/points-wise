CREATE TABLE `kb_valuations` (
	`ticker` text PRIMARY KEY NOT NULL,
	`floor_inr` real NOT NULL,
	`realistic_inr` real NOT NULL,
	`best_inr` real NOT NULL,
	`source` text NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`updated_at` integer NOT NULL
);
