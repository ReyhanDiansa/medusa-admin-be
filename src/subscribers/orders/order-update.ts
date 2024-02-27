import {
    OrderService,
    type SubscriberConfig,
    type SubscriberArgs, Order, Product, LineItem,
} from "@medusajs/medusa"

export default async function orderUpdateHandler({
     data,
     eventName, container, pluginOptions,
    }: SubscriberArgs<Record<string, any>>) {
    const orderService: OrderService = container.resolve(
        "orderService"
    )

    const {id} = data

    const order: Order = (await orderService.retrieve(id, {
        relations: [
            "items",
            "items.variant",
            "cart",
            "shipping_methods",
            "payments",
        ],
    })) as any;
    console.log(order, "product")
    //group items by store id
    const groupedItems = {};

    for (const item of order.items) {
        const product: Product = (await this.productService.retrieve(
            item.variant.product_id,
            { select: ["store_id"] }
        )) as any;
        const store_id = product.store_id;
        if (!store_id) {
            continue;
        }
        if (!groupedItems.hasOwnProperty(store_id)) {
            groupedItems[store_id] = [];
        }

        groupedItems[store_id].push(item);
    }

    const orderRepo = this.manager.withRepository(this.orderRepository);
    const lineItemRepo = this.manager.withRepository(this.lineItemRepository);
    const shippingMethodRepo = this.manager.withRepository(
        this.shippingMethodRepository
    );

    for (const store_id in groupedItems) {
        //create order
        const childOrder = orderRepo.create({
            ...order,
            order_parent_id: id,
            store_id: store_id,
            cart_id: null,
            cart: null,
            id: null,
            shipping_methods: [],
        }) as Order;
        const orderResult = await orderRepo.save(childOrder);

        //create shipping methods
        for (const shippingMethod of order.shipping_methods) {
            const newShippingMethod = shippingMethodRepo.create({
                ...shippingMethod,
                id: null,
                cart_id: null,
                cart: null,
                order_id: orderResult.id,
            });

            await shippingMethodRepo.save(newShippingMethod);
        }

        //create line items
        const items: LineItem[] = groupedItems[store_id];
        for (const item of items) {
            const newItem = lineItemRepo.create({
                ...item,
                id: null,
                order_id: orderResult.id,
                cart_id: null,
            });
            await lineItemRepo.save(newItem);
        }
    }


}

export const config: SubscriberConfig = {
    event: OrderService.Events.PLACED,
    context: {
        subscriberId: "order-update-handler",
    },
}