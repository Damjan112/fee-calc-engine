import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1753657503917 implements MigrationInterface {
    name = 'InitialMigration1753657503917'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`fee_rule\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`type\` enum ('POS', 'ECOMMERCE', 'TRANSFER', 'ATM', 'ONLINE', 'ANY') NOT NULL, \`conditions\` json NOT NULL, \`event\` json NOT NULL, \`priority\` int NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_2f4efe770b4b300bbc0565af98\` (\`type\`, \`isActive\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`client\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`creditScore\` int NOT NULL, \`segment\` enum ('standard', 'premium', 'vip', 'corporate') NULL, \`email\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`transaction\` (\`id\` varchar(36) NOT NULL, \`type\` enum ('POS', 'ECOMMERCE', 'TRANSFER', 'ATM', 'ONLINE') NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`currency\` enum ('EUR', 'USD', 'GBP', 'JPY') NOT NULL DEFAULT 'EUR', \`clientId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`fee_calculation_history\` (\`id\` varchar(36) NOT NULL, \`transactionId\` varchar(255) NULL, \`clientId\` varchar(255) NULL, \`transactionType\` enum ('POS', 'ECOMMERCE', 'TRANSFER', 'ATM', 'ONLINE') NULL, \`transactionAmount\` decimal(12,2) NOT NULL, \`currency\` enum ('EUR', 'USD', 'GBP', 'JPY') NOT NULL DEFAULT 'EUR', \`calculatedFee\` decimal(12,2) NOT NULL, \`totalAmount\` decimal(12,2) NOT NULL, \`rulesAppliedCount\` int NOT NULL, \`appliedRules\` json NOT NULL, \`calculationTimeMs\` int NOT NULL, \`clientData\` json NOT NULL, \`transactionData\` json NOT NULL, \`errors\` json NULL, \`calculationType\` enum ('SINGLE', 'BATCH') NOT NULL DEFAULT 'SINGLE', \`batchId\` varchar(255) NULL, \`calculatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_fd8fbeef37eb4df9cbdb6ffd1b\` (\`clientId\`), INDEX \`IDX_3b497293eaec515978aec1187a\` (\`transactionType\`), INDEX \`IDX_c7022b78bcc17f02d8b523992f\` (\`calculatedAt\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_b01db6b3e203945a6bd5fc5797b\` FOREIGN KEY (\`clientId\`) REFERENCES \`client\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_b01db6b3e203945a6bd5fc5797b\``);
        await queryRunner.query(`DROP INDEX \`IDX_c7022b78bcc17f02d8b523992f\` ON \`fee_calculation_history\``);
        await queryRunner.query(`DROP INDEX \`IDX_3b497293eaec515978aec1187a\` ON \`fee_calculation_history\``);
        await queryRunner.query(`DROP INDEX \`IDX_fd8fbeef37eb4df9cbdb6ffd1b\` ON \`fee_calculation_history\``);
        await queryRunner.query(`DROP TABLE \`fee_calculation_history\``);
        await queryRunner.query(`DROP TABLE \`transaction\``);
        await queryRunner.query(`DROP TABLE \`client\``);
        await queryRunner.query(`DROP INDEX \`IDX_2f4efe770b4b300bbc0565af98\` ON \`fee_rule\``);
        await queryRunner.query(`DROP TABLE \`fee_rule\``);
    }

}
