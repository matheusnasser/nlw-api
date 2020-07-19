import knex from "../database/connection";
import { Request, Response } from "express";

class PointsController {
  async index(req: Request, res: Response) {
    const { uf, city, items } = req.query;

    const parsedItems = String(items)
      .split(",")
      .map((item) => Number(item.trim()));

    const points = await knex("points")
      .join("point_items", "points.id", "=", "point_items.point_id")
      .whereIn("point_items.item_id", parsedItems)
      .where("city", String(city))
      .where("uf", String(uf))
      .distinct()
      .select("points.*");

    return res.json(points);
  }

  async show(req: Request, res: Response) {
    const { point_id } = req.query;

    let point = await knex("points").where("id", `${point_id}`).first();
    if (!point) {
      return res.status(400).json({ message: "No points found with the id" });
    }

    const items = await knex("items")
      .join("point_items", "items.id", "=", "point_items.item_id")
      .where("point_items.point_id", `${point_id}`)
      .select("items.title");

    res.status(200).json({ point, items });
  }

  async create(req: Request, res: Response) {
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items,
    } = req.body;
    const trxProvider = knex.transactionProvider();

    const point = {
      image: "image-fake",
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    };
    await knex
      .transaction(async (trx) => {
        let insertedId = await trx("points").insert(point);

        const pointItems = items.map((item_id: number) => {
          return {
            item_id,
            point_id: insertedId[0],
          };
        });
        await trx("point_items").insert(pointItems);
      })
      .catch((err) => {
        return res.status(406).json({ error: err });
      });

    return res.json({ success: true });
  }
}

export default PointsController;
