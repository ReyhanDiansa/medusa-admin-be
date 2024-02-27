import { Product } from "../models/product";
import { dataSource } from "@medusajs/medusa/dist/loaders/database";
import { ProductRepository as MedusaProductRepository } from "@medusajs/medusa/dist/repositories/product";


export const ProductRepository = dataSource.getRepository(Product).extend(
    Object.assign(MedusaProductRepository, {
      customFunction(): void {
        // TODO add custom implementation
        return
      }
    }),
);

export default ProductRepository;
