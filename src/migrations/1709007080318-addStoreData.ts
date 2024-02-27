import { MigrationInterface, QueryRunner, TableColumn, TableUnique } from "typeorm";

export class AddStoreData1709007080318 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createUniqueConstraint('store', new TableUnique({
            columnNames: ['name']
        }));
       
        await queryRunner.addColumn(
            "store",
            new TableColumn({
                name: "address",
                type: "varchar",
            },
            ),
        )

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("store", "address")
    }

}
