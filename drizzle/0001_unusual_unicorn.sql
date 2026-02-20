ALTER TABLE `jobs` ADD `location` text;--> statement-breakpoint
ALTER TABLE `jobs` ADD `country` text;--> statement-breakpoint
ALTER TABLE `jobs` ADD `is_remote` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `jobs` ADD `job_type` text;