-- DropForeignKey
ALTER TABLE `comment` DROP FOREIGN KEY `Comment_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `follower` DROP FOREIGN KEY `Follower_followerId_fkey`;

-- DropForeignKey
ALTER TABLE `follower` DROP FOREIGN KEY `Follower_followingId_fkey`;

-- DropForeignKey
ALTER TABLE `like` DROP FOREIGN KEY `Like_userId_fkey`;

-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `reply` DROP FOREIGN KEY `Reply_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `savedpost` DROP FOREIGN KEY `SavedPost_userId_fkey`;

-- DropIndex
DROP INDEX `Comment_authorId_fkey` ON `comment`;

-- DropIndex
DROP INDEX `Follower_followingId_fkey` ON `follower`;

-- DropIndex
DROP INDEX `Post_authorId_fkey` ON `post`;

-- DropIndex
DROP INDEX `Reply_authorId_fkey` ON `reply`;

-- DropIndex
DROP INDEX `SavedPost_userId_fkey` ON `savedpost`;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedPost` ADD CONSTRAINT `SavedPost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reply` ADD CONSTRAINT `Reply_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Follower` ADD CONSTRAINT `Follower_followerId_fkey` FOREIGN KEY (`followerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Follower` ADD CONSTRAINT `Follower_followingId_fkey` FOREIGN KEY (`followingId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
