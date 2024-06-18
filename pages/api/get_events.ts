import { PrismaClient } from "@prisma/client";

const GetEvents = async (req, res) => {
  try {
    const prisma = new PrismaClient();
    const result = await prisma.event_type.findMany();
    const sorted_data = result.sort((a, b) => a.id - b.id);
    res.json(sorted_data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error feching data" });
  }
};

export default GetEvents;
