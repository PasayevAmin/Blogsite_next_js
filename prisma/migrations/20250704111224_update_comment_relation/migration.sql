-- DropForeignKey
ALTER TABLE `like` DROP FOREIGN KEY `Like_postId_fkey`;

-- DropForeignKey
ALTER TABLE `reply` DROP FOREIGN KEY `Reply_commentId_fkey`;

-- DropForeignKey
ALTER TABLE `savedpost` DROP FOREIGN KEY `SavedPost_postId_fkey`;

-- DropIndex
DROP INDEX `Like_postId_fkey` ON `like`;

-- DropIndex
DROP INDEX `Reply_commentId_fkey` ON `reply`;

-- DropIndex
DROP INDEX `SavedPost_postId_fkey` ON `savedpost`;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedPost` ADD CONSTRAINT `SavedPost_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reply` ADD CONSTRAINT `Reply_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
