CREATE TABLE `resume` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`file_name` text,
	`skills` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `jobs` ADD `match_score` text;