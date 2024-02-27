import { EntityManager } from "typeorm"
import { Store } from "../models/store"
import { User } from "..//models/user"
import { UserService } from "@medusajs/medusa";

export const registerSeller = async ( req, res ) => {
    const manager: EntityManager = req.scope.resolve("manager");
    const storeRepo = manager.getRepository(Store);
    const userRepo = manager.getRepository(User);
    let newStoreId = '';

    const userService = 
    req.scope.resolve("userService") as UserService

    const requiredFields = ["email", "first_name", "last_name", "password", "store_name", "store_address"];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({
                success: false,
                message: `${field} is required`,
            });
        }
    }

    try {
        const existingStore = await storeRepo.findOne({ where: { name: req.body.store_name } });
        if (existingStore) {
            return res.status(400).json({
                success: false,
                message: "Store name already exists",
            });
        }

        const newStore = storeRepo.create({
            name: req.body.store_name,
            address: req.body.store_address,
        });
        const insertedStore = await storeRepo.save(newStore);

        newStoreId = insertedStore.id;


        const existingUser = await userRepo.findOne({ where: { email: req.body.email } });        
        if (existingUser) {
            await storeRepo.delete(newStoreId);
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        const data ={
            email: req.body.email,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            password_hash: req.body.password,
            store_id:newStoreId
        };
        await userService.create(data, data.password_hash)        

        const getRelation = manager.getRepository(Store)
        .metadata
        .relations
        .map(relation => relation.propertyName)
        const createdStore = await storeRepo.findOne({
            relations: getRelation,
            where: { id: newStore.id }
        });

        return res.status(200).json({
            success: true,
            data: createdStore
        });
    } catch (error) {
        if (newStoreId) {
            await userRepo.delete(newStoreId);
        }
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

