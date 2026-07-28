CREATE TABLE `kb_verifications` (
	`entity_type` text NOT NULL,
	`entity_key` text NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`verified_by` text,
	`verified_at` integer,
	`note` text,
	PRIMARY KEY(`entity_type`, `entity_key`),
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
