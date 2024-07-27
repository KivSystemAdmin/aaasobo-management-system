import { Response } from "express";
import { RequestWithId } from "../middlewares/parseId.middleware";
import {
  getInstructorUnavailabilities as getAll,
  createInstructorUnavailability as createOne,
} from "../services/instructorsUnavailabilitiesService";

export const getInstructorUnavailabilities = async (
  req: RequestWithId,
  res: Response,
) => {
  try {
    const data = await getAll(req.id);
    return res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const createInstructorUnavailability = async (
  req: RequestWithId,
  res: Response,
) => {
  const { dateTime } = req.body;
  try {
    const instructorUnavailability = await createOne(req.id, dateTime);
    return res.status(200).json({ instructorUnavailability });
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};
